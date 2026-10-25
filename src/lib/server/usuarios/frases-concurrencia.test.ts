import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { IDS_REGISTRO } from '#lib/shared/mascota/frases';
import { crearUsuario } from './index';
import { fraseEntregada } from './esquema';

// EV-108 contra la base real: dos entregas simultáneas a la misma persona reciben frases distintas. Cada entrega corre en
// su `worker_threads` con una conexión propia y repite con SQL directo la transacción de `frases.ts` (un worker no carga
// TypeScript): lee el ciclo y las entregadas, elige la primera libre del catálogo e inserta. La elección es determinista
// para que, sin serialización, las dos eligieran la misma frase y una fallara por la clave primaria.

const INSTANTE = '2026-10-25T08:00:00.000Z';
const RUTA_MODULO = createRequire(import.meta.url).resolve('better-sqlite3');

const SCRIPT_ENTREGA = `
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
		const ciclo = db.prepare("SELECT coalesce(max(ciclo), 1) AS c FROM frase_entregada WHERE usuario_id = ? AND lista = 'registro'").get(workerData.usuarioId).c;
		const entregadas = new Set(db.prepare("SELECT frase_id AS f FROM frase_entregada WHERE usuario_id = ? AND lista = 'registro' AND ciclo = ?").all(workerData.usuarioId, ciclo).map((fila) => fila.f));
		const fraseId = workerData.catalogo.find((id) => !entregadas.has(id));
		db.prepare("INSERT INTO frase_entregada (usuario_id, lista, ciclo, frase_id, entregada_en) VALUES (?, 'registro', ?, ?, ?)").run(workerData.usuarioId, ciclo, fraseId, workerData.instante);
		db.exec('COMMIT');
		parentPort.postMessage({ estado: 'ok', fraseId });
	} catch (causa) {
		db.exec('ROLLBACK');
		parentPort.postMessage({ estado: 'error', codigo: String(causa.code ?? causa.message) });
	}
} finally {
	db.close();
}
`;

type Resultado = { estado: 'ok'; fraseId: string } | { estado: 'error'; codigo: string };

function lanzarEntrega(ruta: string, usuarioId: string, senal: SharedArrayBuffer) {
	const trabajador = new Worker(SCRIPT_ENTREGA, {
		eval: true,
		workerData: { modulo: RUTA_MODULO, ruta, instante: INSTANTE, senal, usuarioId, catalogo: [...IDS_REGISTRO] },
	});
	const listo = new Promise<void>((resolver, rechazar) => {
		trabajador.on('message', (mensaje: { estado: string }) => {
			if (mensaje.estado === 'listo') resolver();
		});
		trabajador.on('error', rechazar);
	});
	const resultado = new Promise<Resultado>((resolver, rechazar) => {
		trabajador.on('message', (mensaje: { estado: string; fraseId?: string; codigo?: string }) => {
			if (mensaje.estado === 'ok') resolver({ estado: 'ok', fraseId: mensaje.fraseId ?? '' });
			if (mensaje.estado === 'error') resolver({ estado: 'error', codigo: mensaje.codigo ?? '' });
		});
		trabajador.on('error', rechazar);
	});
	return { listo, resultado };
}

describe('concurrencia del ciclo de frases (EV-108)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('EV-108: dos entregas simultáneas a la misma persona dan frases distintas y dos filas', async () => {
		const ana = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => {
			crearUsuario(tx, { id: ana, nombre: 'Ana', correo: `ana-${ana}@ejemplo.test`, rol: 'miembro', instante: INSTANTE });
		});

		const ruta = join(entorno.base.directorio, 'becafe.db');
		const senal = new SharedArrayBuffer(4);
		const control = new Int32Array(senal);
		const movil = lanzarEntrega(ruta, ana, senal);
		const ordenador = lanzarEntrega(ruta, ana, senal);
		await Promise.all([movil.listo, ordenador.listo]);

		Atomics.store(control, 0, 1);
		Atomics.notify(control, 0);
		const resultados = await Promise.all([movil.resultado, ordenador.resultado]);

		const frases = resultados.flatMap((resultado) => (resultado.estado === 'ok' ? [resultado.fraseId] : []));
		expect(frases).toHaveLength(2);
		expect(new Set(frases).size).toBe(2);
		expect(entorno.ambiente.db.select().from(fraseEntregada).all()).toHaveLength(2);
	});
});
