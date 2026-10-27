import { eq } from 'drizzle-orm';
import type { Actor } from '#lib/server/auth';
import { enTransaccion, nuevoId, registrar, type Ambiente } from '#lib/server/plataforma';
import { anotarAuditoria } from '#lib/server/usuarios';
import { ejecutarCopia, type ResultadoCopia } from './copia-diaria';
import { ErrorCopia, ErrorOperacionCopia } from './errores';
import { copiaSeguridad } from './esquema';
import { exigirPermisoCopias } from './permiso';
import { crearSubidaS3 } from './subida-s3';

// «Hacer copia ahora» (plan F17 D3, RF-286, RF-287). Mismo contenido y proceso que la copia diaria; solo la lanza un administrador.

/**
 * Hace y sube una copia manual. Rechaza con `ErrorOperacionCopia` si no hay S3, si hay una copia o una restauración en curso, y con
 * `ErrorCopia` si la copia falla (queda `fallida` y avisa a los administradores igual que la diaria, RF-142).
 */
export async function hacerCopiaManual(ambiente: Ambiente, actor: Actor | undefined): Promise<Extract<ResultadoCopia, { correcta: true }>> {
	exigirPermisoCopias(ambiente.db, actor);
	const s3 = ambiente.copias.s3;
	if (!s3) throw new ErrorOperacionCopia('SIN_S3');
	const copiaId = nuevoId();
	const ahora = ambiente.reloj.ahora();
	// La comprobación y el alta van en una sola transacción síncrona: dos pulsaciones a la vez no pueden pasar las dos.
	const iniciada =
		!ambiente.mantenimiento.restaurando &&
		enTransaccion(ambiente.db, (tx) => {
			if (tx.select({ id: copiaSeguridad.id }).from(copiaSeguridad).where(eq(copiaSeguridad.estado, 'en_curso')).limit(1).get()) {
				return false;
			}
			tx.insert(copiaSeguridad).values({ id: copiaId, iniciadaEn: ahora, estado: 'en_curso', tipo: 'manual' }).run();
			anotarAuditoria(tx, {
				actorId: actor.usuarioId,
				accion: 'copia.manual',
				objetoTipo: 'copia',
				objetoId: copiaId,
				detalle: {},
				instante: ahora,
			});
			return true;
		});
	if (!iniciada) {
		registrar('copia.manual_rechazada', { usuarioId: actor.usuarioId, codigo: 'EN_CURSO' });
		throw new ErrorOperacionCopia('EN_CURSO');
	}
	registrar('copia.manual_iniciada', { copiaId, usuarioId: actor.usuarioId });
	const resultado = await ejecutarCopia(
		{
			db: ambiente.db,
			reloj: ambiente.reloj,
			directorioDatos: ambiente.copias.directorioDatos,
			origen: ambiente.copias.origen,
			subir: crearSubidaS3(s3),
		},
		{ copiaId, tipo: 'manual' },
	);
	if (!resultado.correcta) throw new ErrorCopia(resultado.codigo, resultado.estadoHttp);
	return resultado;
}
