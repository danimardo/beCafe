import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntornoPrueba, type EntornoPrueba } from '#lib/server/plataforma';

// Concurrencia de dos altas con el mismo nombre contra la base real (constitución VIII, RF-002, docs/pruebas.md §7).
// better-sqlite3 es síncrono: dos llamadas seguidas no compiten. Cada alta corre en su `worker_threads` con una
// conexión propia al mismo archivo; `Atomics` las hace empezar a la vez. La transacción replica las dos escrituras
// de `darDeAltaCapsula` (tipo y existencia) con SQL directo, porque un worker no puede cargar el código TypeScript.

const INSTANTE = '2026-10-22T10:00:00.000Z';
const RUTA_MODULO = createRequire(import.meta.url).resolve('better-sqlite3');

const SCRIPT_ALTA = `
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
		db.prepare(
			'INSERT INTO tipo_capsula (id, nombre, nombre_normalizado, marca, intensidad, color, foto_ruta, estado, creado_en, actualizado_en) VALUES (?, ?, ?, ?, NULL, ?, NULL, ?, ?, ?)'
		).run(workerData.id, workerData.nombre, workerData.nombre.trim().toLowerCase(), 'Marca de prueba', 'cap-ristretto', 'activo', workerData.instante, workerData.instante);
		db.prepare('INSERT INTO existencia (tipo_capsula_id, umbral_minimo, stock, coste_medio, en_stock_bajo) VALUES (?, 3, 0, NULL, 0)').run(workerData.id);
		db.exec('COMMIT');
		parentPort.postMessage({ estado: 'ok' });
	} catch (causa) {
		db.exec('ROLLBACK');
		parentPort.postMessage({ estado: 'error', codigo: causa.code });
	}
} finally {
	db.close();
}
`;

type Resultado = { estado: 'ok' } | { estado: 'error'; codigo: string | undefined };

type Alta = { listo: Promise<void>; resultado: Promise<Resultado> };

function lanzarAlta(ruta: string, id: string, nombre: string, senal: SharedArrayBuffer): Alta {
	const trabajador = new Worker(SCRIPT_ALTA, {
		eval: true,
		workerData: { modulo: RUTA_MODULO, ruta, id, nombre, instante: INSTANTE, senal },
	});
	const listo = new Promise<void>((resolver, rechazar) => {
		trabajador.on('message', (mensaje: { estado: string }) => {
			if (mensaje.estado === 'listo') resolver();
		});
		trabajador.on('error', rechazar);
	});
	const resultado = new Promise<Resultado>((resolver, rechazar) => {
		trabajador.on('message', (mensaje: { estado: string; codigo?: string }) => {
			if (mensaje.estado === 'ok') resolver({ estado: 'ok' });
			if (mensaje.estado === 'error') resolver({ estado: 'error', codigo: mensaje.codigo });
		});
		trabajador.on('error', rechazar);
	});
	return { listo, resultado };
}

describe('concurrencia de altas de tipos (RF-002, INV: un solo tipo activo por nombre)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('RF-002: dos altas simultáneas con el mismo nombre (sin distinguir mayúsculas) dejan un tipo activo y ninguna existencia huérfana', async () => {
		const ruta = join(entorno.base.directorio, 'becafe.db');
		const senal = new SharedArrayBuffer(4);
		const control = new Int32Array(senal);

		const primera = lanzarAlta(ruta, '01ARZ3NDEKTSV4RRFFQ69G5FAA', 'Ristretto', senal);
		const segunda = lanzarAlta(ruta, '01ARZ3NDEKTSV4RRFFQ69G5FAB', 'ristretto', senal);
		await Promise.all([primera.listo, segunda.listo]);

		Atomics.store(control, 0, 1);
		Atomics.notify(control, 0);
		const resultados = await Promise.all([primera.resultado, segunda.resultado]);

		const ganadoras = resultados.filter((resultado) => resultado.estado === 'ok');
		const perdedoras = resultados.filter((resultado) => resultado.estado === 'error');
		expect(ganadoras).toHaveLength(1);
		expect(perdedoras).toHaveLength(1);
		// El código de la base de datos se traduce a NOMBRE_DUPLICADO en `catalogo` (esConflictoNombre).
		expect(perdedoras[0]).toEqual({ estado: 'error', codigo: 'SQLITE_CONSTRAINT_UNIQUE' });

		const activos = entorno.base.db.all<{ n: number }>(
			sql`SELECT count(*) AS n FROM tipo_capsula WHERE nombre_normalizado = 'ristretto' AND estado = 'activo'`,
		);
		expect(activos[0]?.n).toBe(1);

		const existencias = entorno.base.db.all<{ n: number }>(sql`SELECT count(*) AS n FROM existencia`);
		expect(existencias[0]?.n).toBe(1);
	});
});
