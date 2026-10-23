import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { registrarAportacion } from './aportaciones';

// EV-011 y INV-05 contra la base real: dos anulaciones simultáneas de la misma aportación (docs/pruebas.md §7).
// Cada anulación corre en su `worker_threads` con una conexión propia al mismo archivo. La transacción replica el
// `UPDATE` condicionado de `anularAportacion` y el de sus movimientos con SQL directo, porque un worker no puede
// cargar el código TypeScript. `Atomics` las hace empezar a la vez.

const INSTANTE = '2026-10-22T10:00:00.000Z';
const RUTA_MODULO = createRequire(import.meta.url).resolve('better-sqlite3');

const SCRIPT_ANULACION = `
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
		const cambios = db.prepare(
			"UPDATE aportacion SET estado = 'anulado', anulado_por = ?, anulado_en = ?, motivo_anulacion = ? WHERE id = ? AND estado = 'vigente'"
		).run(workerData.anuladoPor, workerData.instante, workerData.motivo, workerData.id).changes;
		if (cambios === 1) {
			db.prepare("UPDATE movimiento SET vigente = 0 WHERE origen_tipo = 'aportacion' AND origen_id = ?").run(workerData.id);
		}
		db.exec('COMMIT');
		parentPort.postMessage({ estado: 'ok', cambios });
	} catch (causa) {
		db.exec('ROLLBACK');
		parentPort.postMessage({ estado: 'error', codigo: causa.code });
	}
} finally {
	db.close();
}
`;

type Resultado = { estado: 'ok'; cambios: number } | { estado: 'error'; codigo: string | undefined };

function lanzarAnulacion(ruta: string, datos: { id: string; anuladoPor: string; motivo: string }, senal: SharedArrayBuffer) {
	const trabajador = new Worker(SCRIPT_ANULACION, {
		eval: true,
		workerData: { modulo: RUTA_MODULO, ruta, instante: INSTANTE, senal, ...datos },
	});
	const listo = new Promise<void>((resolver, rechazar) => {
		trabajador.on('message', (mensaje: { estado: string }) => {
			if (mensaje.estado === 'listo') resolver();
		});
		trabajador.on('error', rechazar);
	});
	const resultado = new Promise<Resultado>((resolver, rechazar) => {
		trabajador.on('message', (mensaje: { estado: string; cambios?: number; codigo?: string }) => {
			if (mensaje.estado === 'ok') resolver({ estado: 'ok', cambios: mensaje.cambios ?? 0 });
			if (mensaje.estado === 'error') resolver({ estado: 'error', codigo: mensaje.codigo });
		});
		trabajador.on('error', rechazar);
	});
	return { listo, resultado };
}

describe('concurrencia de anulaciones (EV-011, INV-05)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('EV-011: dos anulaciones a la vez de la misma aportación → una cambia la fila; los movimientos quedan no vigentes una vez', async () => {
		const ana = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: ana, nombre: 'Ana', correo: `ana-${ana}@ejemplo.test`, rol: 'miembro', instante: INSTANTE }),
		);
		const actor: Actor = { usuarioId: ana, rol: 'miembro', autenticadoEn: INSTANTE, sesionIdHash: 'hash-ana' };
		const { id } = registrarAportacion(entorno.ambiente, actor, { clienteId: nuevoId(), importe: 500 });

		const ruta = join(entorno.base.directorio, 'becafe.db');
		const senal = new SharedArrayBuffer(4);
		const control = new Int32Array(senal);
		const primera = lanzarAnulacion(ruta, { id, anuladoPor: ana, motivo: 'Primera' }, senal);
		const segunda = lanzarAnulacion(ruta, { id, anuladoPor: ana, motivo: 'Segunda' }, senal);
		await Promise.all([primera.listo, segunda.listo]);

		Atomics.store(control, 0, 1);
		Atomics.notify(control, 0);
		const resultados = await Promise.all([primera.resultado, segunda.resultado]);

		const cambian = resultados.filter((resultado) => resultado.estado === 'ok' && resultado.cambios === 1);
		const noCambian = resultados.filter((resultado) => resultado.estado === 'ok' && resultado.cambios === 0);
		expect(cambian).toHaveLength(1);
		expect(noCambian).toHaveLength(1);

		const anuladas = entorno.base.db.all<{ n: number }>(sql`SELECT count(*) AS n FROM aportacion WHERE id = ${id} AND estado = 'anulado'`);
		expect(anuladas[0]?.n).toBe(1);
		const vigentes = entorno.base.db.all<{ n: number }>(
			sql`SELECT count(*) AS n FROM movimiento WHERE origen_tipo = 'aportacion' AND origen_id = ${id} AND vigente = 1`,
		);
		expect(vigentes[0]?.n).toBe(0);
	});
});
