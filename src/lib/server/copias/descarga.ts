import type { Actor } from '#lib/server/auth';
import { enTransaccion, registrar, type Ambiente } from '#lib/server/plataforma';
import { anotarAuditoria } from '#lib/server/usuarios';
import { ErrorCopia, ErrorOperacionCopia } from './errores';
import { exigirPermisoCopias } from './permiso';
import { crearClienteS3, esquemaClaveCopia, type ClienteS3 } from './subida-s3';

// Descarga de una copia del bucket (plan F17 D1, RF-284, RF-285, ADR 0007). La copia lleva toda la base de datos: solo administradores.

export type CopiaDescargable = { nombre: string; tamano: number | null; cuerpo: ReadableStream<Uint8Array> };

/**
 * Abre la copia `clave` en flujo (con `cliente`, o con el del bucket configurado) y anota la auditoría antes de entregarla. Lanza `ErrorOperacionCopia` si no hay S3 o la copia no existe,
 * y `ErrorCopia` si el bucket falla.
 */
export async function descargarCopia(
	ambiente: Ambiente,
	actor: Actor | undefined,
	clave: string,
	cliente?: ClienteS3,
): Promise<CopiaDescargable> {
	exigirPermisoCopias(ambiente.db, actor);
	const s3 = ambiente.copias.s3;
	if (!s3) throw new ErrorOperacionCopia('SIN_S3');
	const valida = esquemaClaveCopia.safeParse(clave);
	if (!valida.success) throw new ErrorOperacionCopia('NO_ENCONTRADA');
	let abierta: Awaited<ReturnType<ClienteS3['abrir']>>;
	try {
		abierta = await (cliente ?? crearClienteS3(s3)).abrir(valida.data);
	} catch (causa) {
		if (causa instanceof ErrorCopia) {
			registrar(
				'copia.descarga_fallida',
				causa.estadoHttp === undefined
					? { usuarioId: actor.usuarioId, codigo: causa.codigo }
					: { usuarioId: actor.usuarioId, codigo: causa.codigo, estadoHttp: causa.estadoHttp },
			);
		}
		throw causa;
	}
	enTransaccion(ambiente.db, (tx) => {
		anotarAuditoria(tx, {
			actorId: actor.usuarioId,
			accion: 'copia.descargada',
			objetoTipo: 'copia',
			objetoId: valida.data,
			detalle: {},
			instante: ambiente.reloj.ahora(),
		});
	});
	registrar(
		'copia.descarga_iniciada',
		abierta.tamano === null ? { usuarioId: actor.usuarioId } : { usuarioId: actor.usuarioId, tamano: abierta.tamano },
	);
	return { nombre: valida.data.split('/').pop() ?? 'copia.tar.gz', tamano: abierta.tamano, cuerpo: abierta.cuerpo };
}
