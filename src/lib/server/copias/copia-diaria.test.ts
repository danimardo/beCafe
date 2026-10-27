import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readdir, writeFile, mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { eq, sql } from 'drizzle-orm';
import * as tar from 'tar';
import {
	crearEntornoPrueba,
	crearRelojFijo,
	abrirBaseDatos,
	enTransaccion,
	nuevoId,
	tieneEjecucion,
	type EntornoPrueba,
} from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { notificacion } from '#lib/server/notificaciones';
import { copiaSeguridad, pruebaRestauracion } from './esquema';
import { crearSubidaS3 } from './subida-s3';
import { crearS3Falso, type S3Falso } from './pruebas/s3-falso';
import { hacerCopiaDiaria, prepararArranqueCopias, TAREA_COPIA_DIARIA } from './copia-diaria';

// Plan F8 D1 a D3, tarea T009: copia diaria con S3 falso (CA-140, CA-142, Clarifications 1 y 4).
// 03:00 de Madrid del 23 de octubre de 2026 = 01:00 UTC.
const INSTANTE = '2026-10-23T01:00:00.000Z';
const DIA_SIGUIENTE = '2026-10-24T01:00:00.000Z';

/** Un endpoint sin nadie escuchando: el puerto se reserva y se libera, así la conexión falla sin esperar. */
async function endpointCerrado(): Promise<string> {
	const servidor = createServer();
	await new Promise<void>((resolver) => servidor.listen(0, '127.0.0.1', () => resolver()));
	const direccion = servidor.address();
	await new Promise<void>((resolver) => servidor.close(() => resolver()));
	if (direccion === null || typeof direccion === 'string') throw new Error('Sin puerto libre');
	return `http://127.0.0.1:${direccion.port}`;
}

describe('copia diaria (CA-140, CA-142, RF-140 a RF-142)', () => {
	let entorno: EntornoPrueba;
	let s3: S3Falso;
	let directorioDatos: string;
	let admin: string;

	beforeEach(async () => {
		entorno = crearEntornoPrueba(INSTANTE);
		s3 = await crearS3Falso();
		directorioDatos = dirname(entorno.ambiente.directorioFotos);
		admin = nuevoId();
		crearUsuario(entorno.ambiente.db, {
			id: admin,
			nombre: 'Administración',
			correo: `${admin}@example.test`,
			rol: 'administrador',
			instante: INSTANTE,
		});
	});

	afterEach(async () => {
		await s3.cerrar();
		entorno.cerrar();
	});

	function subidor(endpoint = s3.endpoint) {
		return crearSubidaS3({
			endpoint,
			bucket: 'becafe-prueba',
			region: 'eu-south-2',
			claveAcceso: 'clave-de-prueba',
			claveSecreta: 'secreto-de-prueba',
		});
	}

	/** Ejecuta la copia a las 03:00 de `instante` (por defecto, el 23 de octubre). */
	function ejecutar(endpoint?: string, instante = INSTANTE) {
		return hacerCopiaDiaria({
			db: entorno.ambiente.db,
			reloj: crearRelojFijo(instante),
			directorioDatos,
			origen: 'local',
			subir: subidor(endpoint),
		});
	}

	function copias() {
		return entorno.ambiente.db.select().from(copiaSeguridad).all();
	}

	it('CA-140: a las 03:00 sube el archivo al bucket con su clave y la copia queda correcta con tamaño y SHA-256', async () => {
		await ejecutar();

		const [copia] = copias();
		expect(copia.estado).toBe('correcta');
		expect(copia.claveObjeto).toMatch(/^becafe\/2026\/10\/becafe-2026-10-23T01-00-00\.000Z__local__diaria\.tar\.gz$/);
		expect(copia.tamano).toBeGreaterThan(0);
		expect(copia.sha256).toMatch(/^[0-9a-f]{64}$/);
		expect(s3.peticiones).toEqual([expect.objectContaining({ metodo: 'PUT', firmada: true })]);
	});

	it('CA-140: el archivo subido se descomprime en una base que abre con los mismos usuarios que el origen', async () => {
		await ejecutar();
		const verificacion = await mkdtemp(join(tmpdir(), 'copia-verificacion-'));
		const archivo = join(verificacion, 'copia.tar.gz');
		const contenido = s3.ultimaSubida();
		if (!contenido) throw new Error('El servidor falso debía recibir la subida');
		await writeFile(archivo, contenido);

		await tar.x({ file: archivo, cwd: verificacion });

		const copia = abrirBaseDatos(join(verificacion, 'becafe.db'));
		try {
			const [fila] = copia.db.all<{ total: number }>(sql`SELECT count(*) AS total FROM usuario`);
			const [origen] = entorno.ambiente.db.all<{ total: number }>(sql`SELECT count(*) AS total FROM usuario`);
			expect(fila.total).toBe(origen.total);
		} finally {
			copia.cerrar();
		}
	});

	it('CA-142: un 403 de S3 deja la copia fallida con S3_CREDENCIALES y avisa a los administradores', async () => {
		s3.responder(403);

		await ejecutar();

		expect(copias()[0]).toMatchObject({ estado: 'fallida', codigoError: 'S3_CREDENCIALES', estadoHttp: 403 });
		const avisos = entorno.ambiente.db.select().from(notificacion).where(eq(notificacion.usuarioId, admin)).all();
		expect(avisos).toEqual([expect.objectContaining({ tipo: 'fallo_copia' })]);
	});

	it('CA-142: un 500 de S3 deja S3_RESPUESTA con el estado; un servidor caído deja S3_RED', async () => {
		s3.responder(500);
		await ejecutar();
		expect(copias()[0]).toMatchObject({ codigoError: 'S3_RESPUESTA', estadoHttp: 500 });

		await ejecutar(await endpointCerrado(), DIA_SIGUIENTE);
		expect(copias()[1]).toMatchObject({ codigoError: 'S3_RED' });
	});

	it('los temporales se borran tras éxito y tras fallo', async () => {
		await ejecutar();
		s3.responder(403);
		await ejecutar(undefined, DIA_SIGUIENTE);

		expect(await readdir(join(directorioDatos, 'tmp')).catch(() => [])).toEqual([]);
	});

	it('Clarifications 1 y 4: una segunda ejecución del mismo día no crea otra copia, aunque la primera fallara', async () => {
		s3.responder(500);
		await ejecutar();
		s3.responder('ok');
		await ejecutar();

		expect(copias()).toHaveLength(1);
		expect(copias()[0]?.estado).toBe('fallida');
		expect(entorno.ambiente.db.select().from(pruebaRestauracion).all()).toEqual([]);
	});

	it('Clarifications 1: la tarea del día queda registrada en ejecucion_tarea', async () => {
		await ejecutar();

		expect(tieneEjecucion(entorno.ambiente.db, TAREA_COPIA_DIARIA, '2026-10-23')).toBe(true);
	});

	it('Clarifications 1: al arrancar, una copia en curso queda fallida como INTERRUMPIDA', async () => {
		const id = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => tx.insert(copiaSeguridad).values({ id, iniciadaEn: INSTANTE, estado: 'en_curso' }).run());

		await prepararArranqueCopias({ db: entorno.ambiente.db, reloj: crearRelojFijo(INSTANTE), directorioDatos, origen: 'local' });

		expect(copias()[0]).toMatchObject({ id, estado: 'fallida', codigoError: 'INTERRUMPIDA' });
	});
});
