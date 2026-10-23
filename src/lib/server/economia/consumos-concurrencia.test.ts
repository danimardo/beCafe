import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntornoPrueba, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { consumo } from './esquema';
import { prepararConsumo, prepararMiembros, prepararTipo } from './pruebas/constructores';

// Concurrencia de consumos contra la base real (constitución VIII, INV-04, INV-05, docs/pruebas.md §7). Cada operación
// corre en su `worker_threads` con una conexión propia al mismo archivo; `Atomics` las hace empezar a la vez. El worker
// replica con SQL directo la transacción de `registrarConsumo` y de `anularConsumo`, porque no puede cargar TypeScript.

const INSTANTE = '2026-10-22T10:00:00.000Z';
const RUTA_MODULO = createRequire(import.meta.url).resolve('better-sqlite3');

const SCRIPT = `
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
		if (workerData.operacion === 'registrar') {
			const existente = db.prepare('SELECT id FROM consumo WHERE cliente_id = ?').get(workerData.clienteId);
			if (existente) {
				db.exec('COMMIT');
				parentPort.postMessage({ estado: 'duplicado', id: existente.id });
			} else {
				db.prepare(
					"INSERT INTO consumo (id, cliente_id, usuario_id, tipo_capsula_id, invitado, precio_aplicado, coste_medio_aplicado, hora_gesto, hora_registro, estado) VALUES (?, ?, ?, ?, 0, 35, 3483, ?, ?, 'vigente')"
				).run(workerData.id, workerData.clienteId, workerData.usuarioId, workerData.tipoId, workerData.instante, workerData.instante);
				db.exec('COMMIT');
				parentPort.postMessage({ estado: 'nuevo', id: workerData.id });
			}
		} else {
			const cambios = db
				.prepare("UPDATE consumo SET estado = 'anulado', anulado_por = ?, anulado_en = ?, motivo_anulacion = 'Prueba' WHERE id = ? AND estado = 'vigente'")
				.run(workerData.usuarioId, workerData.instante, workerData.id).changes;
			db.exec('COMMIT');
			parentPort.postMessage({ estado: 'anulado', cambios });
		}
	} catch (causa) {
		db.exec('ROLLBACK');
		parentPort.postMessage({ estado: 'error', codigo: causa.code });
	}
} finally {
	db.close();
}
`;

type Mensaje =
	| { estado: 'listo' }
	| { estado: 'nuevo'; id: string }
	| { estado: 'duplicado'; id: string }
	| { estado: 'anulado'; cambios: number }
	| { estado: 'error'; codigo?: string };

type Operacion =
	| { operacion: 'registrar'; clienteId: string; usuarioId: string; tipoId: string; id: string }
	| { operacion: 'anular'; usuarioId: string; id: string };

/** Lanza un worker que espera la señal común. `listo` se resuelve cuando ha abierto su conexión. */
function lanzar(ruta: string, senal: SharedArrayBuffer, datos: Operacion) {
	const trabajador = new Worker(SCRIPT, { eval: true, workerData: { modulo: RUTA_MODULO, ruta, senal, instante: INSTANTE, ...datos } });
	const listo = new Promise<void>((resolver, rechazar) => {
		trabajador.on('message', (mensaje: Mensaje) => {
			if (mensaje.estado === 'listo') resolver();
		});
		trabajador.on('error', rechazar);
	});
	const resultado = new Promise<Mensaje>((resolver, rechazar) => {
		trabajador.on('message', (mensaje: Mensaje) => {
			if (mensaje.estado !== 'listo') resolver(mensaje);
		});
		trabajador.on('error', rechazar);
	});
	return { listo, resultado };
}

/** Suelta a los workers a la vez y espera sus resultados. */
async function soltarALa(senal: SharedArrayBuffer, workers: ReturnType<typeof lanzar>[]): Promise<Mensaje[]> {
	await Promise.all(workers.map((worker) => worker.listo));
	const control = new Int32Array(senal);
	Atomics.store(control, 0, 1);
	Atomics.notify(control, 0);
	return Promise.all(workers.map((worker) => worker.resultado));
}

describe('concurrencia de consumos (INV-04, INV-05)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('INV-04, EV-010: dos registros simultáneos con el mismo clienteId dejan un solo consumo', async () => {
		const [usuarioId] = prepararMiembros(entorno.ambiente.db, 1);
		const tipoId = await prepararTipo(entorno.ambiente);
		const ruta = join(entorno.base.directorio, 'becafe.db');
		const senal = new SharedArrayBuffer(4);
		const clienteId = nuevoId();

		const [a, b] = await soltarALa(senal, [
			lanzar(ruta, senal, { operacion: 'registrar', clienteId, usuarioId, tipoId, id: nuevoId() }),
			lanzar(ruta, senal, { operacion: 'registrar', clienteId, usuarioId, tipoId, id: nuevoId() }),
		]);

		expect([a.estado, b.estado].sort()).toEqual(['duplicado', 'nuevo']);
		expect(entorno.ambiente.db.select().from(consumo).where(eq(consumo.clienteId, clienteId)).all()).toHaveLength(1);
	});

	it('INV-05, EV-011: dos anulaciones simultáneas del mismo consumo: solo una cambia la fila', async () => {
		const [usuarioId] = prepararMiembros(entorno.ambiente.db, 1);
		const tipoId = await prepararTipo(entorno.ambiente);
		const id = prepararConsumo(entorno.ambiente.db, {
			usuarioId,
			tipoCapsulaId: tipoId,
			precioAplicado: 35,
			costeMedioAplicado: 3483,
			horaRegistro: INSTANTE,
		});
		const ruta = join(entorno.base.directorio, 'becafe.db');
		const senal = new SharedArrayBuffer(4);

		const resultados = await soltarALa(senal, [
			lanzar(ruta, senal, { operacion: 'anular', usuarioId, id }),
			lanzar(ruta, senal, { operacion: 'anular', usuarioId, id }),
		]);

		const cambios = resultados.map((mensaje) => (mensaje.estado === 'anulado' ? mensaje.cambios : -1)).sort();
		expect(cambios).toEqual([0, 1]);
	});
});
