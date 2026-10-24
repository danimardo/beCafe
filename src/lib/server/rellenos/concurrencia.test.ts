import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntornoPrueba, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';

// EV-100 e INV-07 (plan F8 D10): dos registros a la vez contra la base real. Cada uno corre en su `worker_threads` con una
// conexión propia al mismo archivo, y `Atomics` los hace empezar juntos. La transacción replica la de `registrarRelleno`
// con SQL directo, porque un worker no puede cargar el código TypeScript (mismo patrón que `economia/concurrencia.test.ts`).

const INSTANTE = '2026-10-23T10:00:00.000Z';
const RUTA_MODULO = createRequire(import.meta.url).resolve('better-sqlite3');

const SCRIPT_REGISTRO = `
const { workerData, parentPort } = require('node:worker_threads');
const Database = require(workerData.modulo);
const senal = new Int32Array(workerData.senal);
const db = new Database(workerData.ruta);
try {
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	db.pragma('busy_timeout = 5000');
	parentPort.postMessage({ estado: 'listo' });
	Atomics.wait(senal, 0, 0);
	db.exec('BEGIN IMMEDIATE');
	try {
		const configurado = db.prepare("SELECT valor FROM configuracion WHERE clave = 'intervalo_rellenos_min'").get();
		const intervalo = configurado ? Number(JSON.parse(configurado.valor)) : 60;
		const ultimo = db.prepare("SELECT registrado_en AS registradoEn FROM relleno_agua WHERE estado = 'vigente' ORDER BY registrado_en DESC LIMIT 1").get();
		if (ultimo && Date.parse(workerData.instante) - Date.parse(ultimo.registradoEn) < intervalo * 60000) {
			db.exec('ROLLBACK');
			parentPort.postMessage({ estado: 'rechazado' });
		} else {
			db.prepare("INSERT INTO relleno_agua (id, cliente_id, usuario_id, registrado_en, estado) VALUES (?, ?, ?, ?, 'vigente')").run(workerData.id, workerData.clienteId, workerData.usuarioId, workerData.instante);
			db.exec('COMMIT');
			parentPort.postMessage({ estado: 'ok' });
		}
	} catch (causa) {
		db.exec('ROLLBACK');
		parentPort.postMessage({ estado: 'error', codigo: causa.code });
	}
} finally {
	db.close();
}
`;

type Resultado = { estado: 'ok' | 'rechazado' | 'error'; codigo?: string };

function lanzarRegistro(
	ruta: string,
	usuarioId: string,
	senal: SharedArrayBuffer,
): { listo: Promise<void>; resultado: Promise<Resultado> } {
	const trabajador = new Worker(SCRIPT_REGISTRO, {
		eval: true,
		workerData: { modulo: RUTA_MODULO, ruta, id: nuevoId(), clienteId: nuevoId(), usuarioId, instante: INSTANTE, senal },
	});
	const listo = new Promise<void>((resolver, rechazar) => {
		trabajador.on('message', (mensaje: { estado: string }) => {
			if (mensaje.estado === 'listo') resolver();
		});
		trabajador.on('error', rechazar);
	});
	const resultado = new Promise<Resultado>((resolver, rechazar) => {
		trabajador.on('message', (mensaje: Resultado | { estado: 'listo' }) => {
			if (mensaje.estado !== 'listo') resolver(mensaje);
		});
		trabajador.on('error', rechazar);
	});
	return { listo, resultado };
}

describe('concurrencia de rellenos (EV-100, INV-07, RN-082)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('EV-100: dos registros simultáneos dejan un relleno vigente y el otro se rechaza sin insertar nada', async () => {
		const ana = nuevoId();
		const luis = nuevoId();
		crearUsuario(entorno.ambiente.db, { id: ana, nombre: 'Ana', correo: `${ana}@example.test`, rol: 'miembro', instante: INSTANTE });
		crearUsuario(entorno.ambiente.db, { id: luis, nombre: 'Luis', correo: `${luis}@example.test`, rol: 'miembro', instante: INSTANTE });
		const ruta = join(entorno.base.directorio, 'becafe.db');
		const senal = new SharedArrayBuffer(4);
		const control = new Int32Array(senal);

		const primero = lanzarRegistro(ruta, ana, senal);
		const segundo = lanzarRegistro(ruta, luis, senal);
		await Promise.all([primero.listo, segundo.listo]);
		Atomics.store(control, 0, 1);
		Atomics.notify(control, 0);
		const resultados = await Promise.all([primero.resultado, segundo.resultado]);

		expect(resultados.filter((resultado) => resultado.estado === 'ok')).toHaveLength(1);
		expect(resultados.filter((resultado) => resultado.estado === 'rechazado')).toHaveLength(1);
		const vigentes = entorno.base.db.all<{ n: number }>(sql`SELECT count(*) AS n FROM relleno_agua WHERE estado = 'vigente'`);
		expect(vigentes[0]?.n).toBe(1);
	});
});
