import { eq } from 'drizzle-orm';
import { exigirAdministrador, type Actor } from '#lib/server/auth';
import { enTransaccion, ErrorDeNegocio, nuevoId, registrar, type Ambiente, type Tx } from '#lib/server/plataforma';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { registrarAviso } from '#lib/server/notificaciones';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { anotarMovimientos } from './libro';
import { aportacion } from './esquema';

// Aportaciones directas a la hucha (RF-040 a RF-046, RN-030, RN-034). Cada aportación y sus dos movimientos se
// escriben en una única transacción (constitución IV). Un `clienteId` repetido devuelve la aportación original (RF-046).
// Un administrador puede registrarla en nombre de otra persona activa (RF-199, RN-087): la aportación y sus movimientos
// son de la persona beneficiaria y `registrada_por` guarda quién la registró.

const RUTA_SALDOS = '/(app)/saldos';

export type ResultadoAportacion = { id: string; duplicado: boolean };

export type DatosAportacion = { clienteId: string; importe: number; beneficiarioId?: string };

export function registrarAportacion(ambiente: Ambiente, actor: Actor, datos: DatosAportacion): ResultadoAportacion {
	const instante = ambiente.reloj.ahora();
	const beneficiarioId = datos.beneficiarioId ?? actor.usuarioId;
	const enNombreDeOtra = beneficiarioId !== actor.usuarioId;
	if (enNombreDeOtra) exigirAdministrador(actor, RUTA_SALDOS);
	return enTransaccion(ambiente.db, (tx) => {
		const existente = tx.select({ id: aportacion.id }).from(aportacion).where(eq(aportacion.clienteId, datos.clienteId)).get();
		if (existente) {
			registrar('registro.duplicado', { tipo: 'aportacion', id: existente.id });
			return { id: existente.id, duplicado: true };
		}
		if (enNombreDeOtra && buscarUsuarioPorId(tx, beneficiarioId)?.estado !== 'activo') throw new ErrorDeNegocio('ESTADO_INCORRECTO');
		const id = escribirAportacion(tx, {
			clienteId: datos.clienteId,
			importe: datos.importe,
			usuarioId: beneficiarioId,
			registradaPor: actor.usuarioId,
			origen: 'directa',
			instante,
		});
		if (enNombreDeOtra) {
			registrarAviso(tx, {
				tipo: 'aportacion_en_tu_nombre',
				destinatario: beneficiarioId,
				datos: { aportacionId: id, importe: datos.importe },
				origenId: id,
				instante: esquemaInstanteUtc.parse(instante),
			});
			registrar('aportacion.en_nombre_de', { aportacionId: id });
		}
		registrar('aportacion.registrada', { aportacionId: id });
		return { id, duplicado: false };
	});
}

/** Inserta una aportación y sus movimientos dentro de una transacción ya abierta. Lo usa también el pago de una baja. */
export function escribirAportacion(
	tx: Tx,
	datos: {
		clienteId?: string;
		importe: number;
		usuarioId: string;
		registradaPor: string;
		origen: 'directa' | 'baja';
		instante: string;
	},
): string {
	const id = nuevoId();
	tx.insert(aportacion)
		.values({
			id,
			clienteId: datos.clienteId ?? nuevoId(),
			usuarioId: datos.usuarioId,
			registradaPor: datos.registradaPor,
			importe: datos.importe,
			origen: datos.origen,
			registradaEn: datos.instante,
		})
		.run();
	anotarMovimientos(tx, [
		{
			cuenta: 'persona',
			usuarioId: datos.usuarioId,
			tipo: 'abono_aportacion',
			importe: datos.importe,
			origenTipo: 'aportacion',
			origenId: id,
			creadoEn: datos.instante,
		},
		{
			cuenta: 'hucha',
			usuarioId: null,
			tipo: 'hucha_aportacion',
			importe: datos.importe,
			origenTipo: 'aportacion',
			origenId: id,
			creadoEn: datos.instante,
		},
	]);
	return id;
}
