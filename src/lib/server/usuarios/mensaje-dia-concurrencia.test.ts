import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { IDS_MENSAJES_DIA } from '#lib/shared/mascota/mensajes-dia';
import { crearUsuario } from './index';
import { mensajeDia } from './esquema';

// EV-114 / RF-268 contra la base real: dos peticiones simultáneas de la misma persona el mismo día reciben el mismo mensaje.
// Cada una corre en su `worker_threads` con una conexión propia y repite con SQL directo la transacción de `mensaje-dia.ts`
// (un worker no carga TypeScript). Cada worker «elige» un mensaje distinto: si no se serializaran, tendrían dos mensajes.

const INSTANTE = '2026-10-27T08:00:00.000Z';
const RUTA_MODULO = createRequire(import.meta.url).resolve('better-sqlite3');

const SCRIPT_ASIGNACION = `
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
		const existente = db.prepare('SELECT mensaje_id AS m FROM mensaje_dia WHERE usuario_id = ? AND dia = ?').get(workerData.usuarioId, workerData.dia);
		if (!existente) {
			db.prepare('INSERT INTO mensaje_dia (usuario_id, dia, mensaje_id, vuelta, asignado_en) VALUES (?, ?, ?, 1, ?) ON CONFLICT DO NOTHING').run(workerData.usuarioId, workerData.dia, workerData.propuesto, workerData.instante);
		}
		const final = db.prepare('SELECT mensaje_id AS m FROM mensaje_dia WHERE usuario_id = ? AND dia = ?').get(workerData.usuarioId, workerData.dia).m;
		db.exec('COMMIT');
		parentPort.postMessage({ estado: 'ok', mensajeId: final });
	} catch (causa) {
		db.exec('ROLLBACK');
		parentPort.postMessage({ estado: 'error', codigo: String(causa.code ?? causa.message) });
	}
} finally {
	db.close();
}
`;

type Resultado = { estado: 'ok'; mensajeId: string } | { estado: 'error'; codigo: string };

function lanzar(ruta: string, usuarioId: string, propuesto: string, senal: SharedArrayBuffer) {
	const trabajador = new Worker(SCRIPT_ASIGNACION, {
		eval: true,
		workerData: { modulo: RUTA_MODULO, ruta, instante: INSTANTE, dia: '2026-10-27', senal, usuarioId, propuesto },
	});
	const listo = new Promise<void>((resolver, rechazar) => {
		trabajador.on('message', (mensaje: { estado: string }) => {
			if (mensaje.estado === 'listo') resolver();
		});
		trabajador.on('error', rechazar);
	});
	const resultado = new Promise<Resultado>((resolver, rechazar) => {
		trabajador.on('message', (mensaje: { estado: string; mensajeId?: string; codigo?: string }) => {
			if (mensaje.estado === 'ok') resolver({ estado: 'ok', mensajeId: mensaje.mensajeId ?? '' });
			if (mensaje.estado === 'error') resolver({ estado: 'error', codigo: mensaje.codigo ?? '' });
		});
		trabajador.on('error', rechazar);
	});
	return { listo, resultado };
}

describe('concurrencia del mensaje del día (EV-114)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('EV-114: dos asignaciones simultáneas de la misma persona y día dan el mismo mensaje y una fila', async () => {
		const ana = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => {
			crearUsuario(tx, { id: ana, nombre: 'Ana', correo: `ana-${ana}@ejemplo.test`, rol: 'miembro', instante: INSTANTE });
		});

		const ruta = join(entorno.base.directorio, 'becafe.db');
		const senal = new SharedArrayBuffer(4);
		const control = new Int32Array(senal);
		const movil = lanzar(ruta, ana, IDS_MENSAJES_DIA[0] ?? '', senal);
		const ordenador = lanzar(ruta, ana, IDS_MENSAJES_DIA[1] ?? '', senal);
		await Promise.all([movil.listo, ordenador.listo]);

		Atomics.store(control, 0, 1);
		Atomics.notify(control, 0);
		const resultados = await Promise.all([movil.resultado, ordenador.resultado]);

		const mensajes = resultados.flatMap((resultado) => (resultado.estado === 'ok' ? [resultado.mensajeId] : []));
		expect(mensajes).toHaveLength(2);
		expect(new Set(mensajes).size).toBe(1);
		expect(entorno.ambiente.db.select().from(mensajeDia).all()).toHaveLength(1);
	});
});
