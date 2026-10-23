import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from './index';

// EV-040 e INV-03 contra la base real: una baja y un cambio de rol simultáneos no dejan cero administradores activos
// (docs/pruebas.md §7). Cada operación corre en su `worker_threads` con una conexión propia al mismo archivo y repite
// con SQL directo la comprobación de `contarAdministradoresActivos` y el `UPDATE` de `baja.ts` y `roles.ts`, porque un
// worker no puede cargar el código TypeScript. Las transacciones son `immediate`, como en `enTransaccion`.

const INSTANTE = '2026-10-22T10:00:00.000Z';
const RUTA_MODULO = createRequire(import.meta.url).resolve('better-sqlite3');

const SCRIPT_OPERACION = `
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
		const { n } = db.prepare("SELECT count(*) AS n FROM usuario WHERE rol = 'administrador' AND estado = 'activo'").get();
		if (n <= 1) throw Object.assign(new Error('ULTIMO_ADMIN'), { codigo: 'ULTIMO_ADMIN' });
		if (workerData.accion === 'baja') {
			db.prepare("UPDATE usuario SET estado = 'baja', baja_en = ? WHERE id = ?").run(workerData.instante, workerData.usuarioId);
		} else {
			db.prepare("UPDATE usuario SET rol = 'miembro' WHERE id = ?").run(workerData.usuarioId);
		}
		db.exec('COMMIT');
		parentPort.postMessage({ estado: 'ok' });
	} catch (causa) {
		db.exec('ROLLBACK');
		parentPort.postMessage({ estado: 'error', codigo: causa.codigo });
	}
} finally {
	db.close();
}
`;

type Resultado = { estado: 'ok' } | { estado: 'error'; codigo: string | undefined };

function lanzarOperacion(ruta: string, datos: { accion: 'baja' | 'rol'; usuarioId: string }, senal: SharedArrayBuffer) {
	const trabajador = new Worker(SCRIPT_OPERACION, {
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
		trabajador.on('message', (mensaje: { estado: string; codigo?: string }) => {
			if (mensaje.estado === 'ok') resolver({ estado: 'ok' });
			if (mensaje.estado === 'error') resolver({ estado: 'error', codigo: mensaje.codigo });
		});
		trabajador.on('error', rechazar);
	});
	return { listo, resultado };
}

describe('concurrencia del último administrador (EV-040, INV-03)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('EV-040: una baja y un cambio de rol simultáneos con dos administradores dejan uno activo', async () => {
		const ana = nuevoId();
		const luis = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => {
			crearUsuario(tx, { id: ana, nombre: 'Ana', correo: `ana-${ana}@ejemplo.test`, rol: 'administrador', instante: INSTANTE });
			crearUsuario(tx, { id: luis, nombre: 'Luis', correo: `luis-${luis}@ejemplo.test`, rol: 'administrador', instante: INSTANTE });
		});

		const ruta = join(entorno.base.directorio, 'becafe.db');
		const senal = new SharedArrayBuffer(4);
		const control = new Int32Array(senal);
		const dar = lanzarOperacion(ruta, { accion: 'baja', usuarioId: ana }, senal);
		const quitar = lanzarOperacion(ruta, { accion: 'rol', usuarioId: luis }, senal);
		await Promise.all([dar.listo, quitar.listo]);

		Atomics.store(control, 0, 1);
		Atomics.notify(control, 0);
		const resultados = await Promise.all([dar.resultado, quitar.resultado]);

		expect(resultados.filter((resultado) => resultado.estado === 'ok')).toHaveLength(1);
		expect(resultados.filter((resultado) => resultado.estado === 'error' && resultado.codigo === 'ULTIMO_ADMIN')).toHaveLength(1);
		const activos = entorno.base.db.all<{ n: number }>(
			sql`SELECT count(*) AS n FROM usuario WHERE rol = 'administrador' AND estado = 'activo'`,
		);
		expect(activos[0]?.n).toBe(1);
	});
});
