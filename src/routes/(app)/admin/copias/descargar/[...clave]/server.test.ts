import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GET } from './+server';
import { crearEventoAccion } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, leerUltimaAuditoria } from '#lib/server/usuarios';
import { crearS3Falso, type S3Falso } from '#lib/server/copias';

// Descarga de una copia (CA-284, CA-285, CA-288, RF-284): el `+server.ts` solo valida, llama al caso de uso y traduce el resultado.
const INSTANTE = '2026-10-27T10:00:00.000Z';
const CLAVE = 'becafe/2026/10/becafe-2026-10-26T03-00-00.000Z__local__diaria.tar.gz';

describe('GET de la descarga de una copia (CA-284, CA-285, CA-288)', () => {
	let entorno: EntornoPrueba;
	let s3: S3Falso;

	beforeEach(async () => {
		entorno = crearEntornoPrueba(INSTANTE);
		s3 = await crearS3Falso();
		entorno.ambiente.copias.s3 = {
			endpoint: s3.endpoint,
			bucket: 'becafe-prueba',
			region: 'eu-south-2',
			claveAcceso: 'clave-de-prueba',
			claveSecreta: 'secreto-de-prueba',
		};
	});

	afterEach(async () => {
		await s3.cerrar();
		entorno.cerrar();
	});

	function sesionDe(rol: 'miembro' | 'administrador'): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre: 'Ana', correo: `ana-${usuarioId}@ejemplo.es`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	const pedir = (actor: Actor | undefined, clave = CLAVE) =>
		GET(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/admin/copias/descargar/[...clave]',
				params: { clave },
				metodo: 'GET',
			}),
		);

	it('CA-284: un administrador recibe el archivo como adjunto, sin caché y con su nombre original', async () => {
		const admin = sesionDe('administrador');

		const respuesta = await pedir(admin);

		expect(respuesta.status).toBe(200);
		expect(respuesta.headers.get('content-type')).toBe('application/gzip');
		expect(respuesta.headers.get('content-disposition')).toBe(
			'attachment; filename="becafe-2026-10-26T03-00-00.000Z__local__diaria.tar.gz"',
		);
		expect(respuesta.headers.get('cache-control')).toBe('no-store');
		expect(s3.peticiones).toEqual([{ metodo: 'GET', ruta: `/becafe-prueba/${CLAVE}`, firmada: true }]);
		expect(leerUltimaAuditoria(entorno.ambiente.db, 'copia.descargada')).toMatchObject({ actorId: admin.usuarioId, objetoId: CLAVE });
	});

	it('CA-284: sin sesión responde 401 y no consulta el bucket', async () => {
		await expect(pedir(undefined)).rejects.toMatchObject({ status: 401 });

		expect(s3.peticiones).toHaveLength(0);
	});

	it('CA-284: un miembro recibe 403 y no consulta el bucket', async () => {
		await expect(pedir(sesionDe('miembro'))).rejects.toMatchObject({ status: 403 });

		expect(s3.peticiones).toHaveLength(0);
	});

	it('CA-284: una clave que no es de una copia responde 404 sin consultar el bucket', async () => {
		await expect(pedir(sesionDe('administrador'), 'becafe/../secreto.tar.gz')).rejects.toMatchObject({ status: 404 });

		expect(s3.peticiones).toHaveLength(0);
	});

	it('CA-284: una copia que ya no está en el bucket responde 404 con un mensaje en español', async () => {
		s3.responder(404);

		await expect(pedir(sesionDe('administrador'))).rejects.toMatchObject({
			status: 404,
			body: { message: 'Esa copia ya no está en el bucket. Vuelve a la lista y elige otra.' },
		});
	});

	it('CA-284: si el bucket falla, responde 502 sin detalles internos', async () => {
		s3.responder(500);

		await expect(pedir(sesionDe('administrador'))).rejects.toMatchObject({
			status: 502,
			body: { message: 'No se pudo hablar con el bucket. Inténtalo más tarde.' },
		});
	});

	it('CA-288: sin S3 configurado responde 404', async () => {
		entorno.ambiente.copias.s3 = undefined;

		await expect(pedir(sesionDe('administrador'))).rejects.toMatchObject({ status: 404 });
	});
});
