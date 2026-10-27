import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, ErrorDeNegocio, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, leerUltimaAuditoria } from '#lib/server/usuarios';
import { descargarCopia } from './descarga';
import { ErrorCopia, ErrorOperacionCopia } from './errores';
import type { ClienteS3 } from './subida-s3';

// Plan F17 D1, tarea T006: descarga de una copia del bucket (CA-284, CA-285, RF-284, RF-285).
const INSTANTE = '2026-10-27T10:00:00.000Z';
const CLAVE = 'becafe/2026/10/becafe-2026-10-26T03-00-00.000Z__becafe.mardomingo.com__diaria.tar.gz';
const CONTENIDO = Buffer.from('contenido de una copia de prueba');

function crearBucketFalso(opciones: { falla?: ErrorCopia; sinLongitud?: boolean } = {}) {
	const abiertas: string[] = [];
	const cliente: ClienteS3 = {
		subir: () => Promise.reject(new Error('No se usa')),
		listar: () => Promise.reject(new Error('No se usa')),
		descargar: () => Promise.reject(new Error('No se usa')),
		abrir(clave) {
			abiertas.push(clave);
			if (opciones.falla) return Promise.reject(opciones.falla);
			if (clave !== CLAVE) return Promise.reject(new ErrorOperacionCopia('NO_ENCONTRADA'));
			const cuerpo = new ReadableStream<Uint8Array>({
				start(controlador) {
					controlador.enqueue(new Uint8Array(CONTENIDO));
					controlador.close();
				},
			});
			return Promise.resolve({ cuerpo, tamano: opciones.sinLongitud ? null : CONTENIDO.length });
		},
	};
	return { cliente, abiertas };
}

describe('descarga de una copia (CA-284, CA-285)', () => {
	let entorno: EntornoPrueba;
	let admin: Actor;
	let miembro: Actor;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		entorno.ambiente.copias.s3 = {
			endpoint: 'http://127.0.0.1:1',
			bucket: 'prueba',
			region: 'eu-south-2',
			claveAcceso: 'clave-de-prueba',
			claveSecreta: 'secreto-de-prueba',
		};
		admin = sesionDe('administrador', 'Administración');
		miembro = sesionDe('miembro', 'Ana');
	});

	afterEach(() => entorno.cerrar());

	function sesionDe(rol: 'miembro' | 'administrador', nombre: string): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre, correo: `${nombre.toLowerCase()}-${usuarioId}@example.test`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	it('CA-284: un administrador recibe la copia íntegra, con su nombre original y su tamaño', async () => {
		const bucket = crearBucketFalso();

		const copia = await descargarCopia(entorno.ambiente, admin, CLAVE, bucket.cliente);

		expect(copia.nombre).toBe('becafe-2026-10-26T03-00-00.000Z__becafe.mardomingo.com__diaria.tar.gz');
		expect(copia.tamano).toBe(CONTENIDO.length);
		expect(Buffer.from(await new Response(copia.cuerpo).arrayBuffer())).toEqual(CONTENIDO);
	});

	it('CA-284: si el bucket no dice el tamaño, la descarga sigue sin él', async () => {
		const copia = await descargarCopia(entorno.ambiente, admin, CLAVE, crearBucketFalso({ sinLongitud: true }).cliente);

		expect(copia.tamano).toBeNull();
	});

	it('CA-285: cada descarga deja auditoría con quién y qué copia, y un evento sin datos personales', async () => {
		await descargarCopia(entorno.ambiente, admin, CLAVE, crearBucketFalso().cliente);

		expect(leerUltimaAuditoria(entorno.ambiente.db, 'copia.descargada')).toMatchObject({ actorId: admin.usuarioId, objetoId: CLAVE });
		expect(entorno.eventos().find((evento) => evento.codigo === 'copia.descarga_iniciada')?.campos).toEqual({
			usuarioId: admin.usuarioId,
			tamano: CONTENIDO.length,
		});
	});

	it('CA-284: un miembro y una persona sin sesión no descargan nada y no se consulta el bucket', async () => {
		const bucket = crearBucketFalso();

		await expect(descargarCopia(entorno.ambiente, miembro, CLAVE, bucket.cliente)).rejects.toBeInstanceOf(ErrorDeNegocio);
		await expect(descargarCopia(entorno.ambiente, undefined, CLAVE, bucket.cliente)).rejects.toBeInstanceOf(ErrorDeNegocio);

		expect(bucket.abiertas).toEqual([]);
		expect(leerUltimaAuditoria(entorno.ambiente.db, 'copia.descargada')).toBeNull();
	});

	it.each(['../../etc/passwd', 'becafe/../secreto.tar.gz', 'otra/carpeta/copia.tar.gz', 'becafe/copia.zip', ''])(
		'CA-284: la clave «%s» no es de una copia y se rechaza sin consultar el bucket',
		async (clave) => {
			const bucket = crearBucketFalso();

			await expect(descargarCopia(entorno.ambiente, admin, clave, bucket.cliente)).rejects.toMatchObject({ codigo: 'NO_ENCONTRADA' });

			expect(bucket.abiertas).toEqual([]);
		},
	);

	it('CA-284: una copia que ya no está en el bucket se rechaza y no deja auditoría', async () => {
		const bucket = crearBucketFalso();
		const otra = 'becafe/2026/10/becafe-2026-10-20T03-00-00.000Z.tar.gz';

		await expect(descargarCopia(entorno.ambiente, admin, otra, bucket.cliente)).rejects.toMatchObject({ codigo: 'NO_ENCONTRADA' });

		expect(leerUltimaAuditoria(entorno.ambiente.db, 'copia.descargada')).toBeNull();
	});

	it('CA-288: sin S3 configurado se rechaza antes de abrir nada', async () => {
		entorno.ambiente.copias.s3 = undefined;
		const bucket = crearBucketFalso();

		await expect(descargarCopia(entorno.ambiente, admin, CLAVE, bucket.cliente)).rejects.toMatchObject({ codigo: 'SIN_S3' });

		expect(bucket.abiertas).toEqual([]);
	});

	it('CA-285: un fallo del bucket emite su evento con el código, sin auditoría de descarga', async () => {
		const bucket = crearBucketFalso({ falla: new ErrorCopia('S3_RESPUESTA', 500) });

		await expect(descargarCopia(entorno.ambiente, admin, CLAVE, bucket.cliente)).rejects.toBeInstanceOf(ErrorCopia);

		expect(entorno.eventos().find((evento) => evento.codigo === 'copia.descarga_fallida')?.campos).toEqual({
			usuarioId: admin.usuarioId,
			codigo: 'S3_RESPUESTA',
			estadoHttp: 500,
		});
		expect(leerUltimaAuditoria(entorno.ambiente.db, 'copia.descargada')).toBeNull();
	});
});
