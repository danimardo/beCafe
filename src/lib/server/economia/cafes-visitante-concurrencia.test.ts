import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '#lib/server/auth';
import { crearEntornoPrueba, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { registrarAportacion } from './aportaciones';
import { registrarCafeVisitante } from './cafes-visitante';
import { registrarCompra } from './compras';
import { cafeVisitante, existencia } from './esquema';
import { prepararTipo } from './pruebas/constructores';

// EV-104 contra la base real: dos administradores aprueban a la vez el mismo café de visitante (docs/pruebas.md §7).
// Cada aprobación corre en su `worker_threads` con una conexión propia. La transacción replica el `UPDATE` condicionado
// de `revisarCafesVisitante` y la resta de stock con SQL directo, porque un worker no puede cargar el código TypeScript.

const INSTANTE = '2026-10-24T10:00:00.000Z';
const RUTA_MODULO = createRequire(import.meta.url).resolve('better-sqlite3');

const SCRIPT_APROBACION = `
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
			"UPDATE cafe_visitante SET estado = 'aprobado', revisado_por = ?, revisado_en = ? WHERE id = ? AND estado = 'pendiente'"
		).run(workerData.revisadoPor, workerData.instante, workerData.id).changes;
		if (cambios === 1) {
			db.prepare('UPDATE existencia SET stock = stock - 1 WHERE tipo_capsula_id = ?').run(workerData.tipo);
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

function lanzarAprobacion(ruta: string, datos: { id: string; tipo: string; revisadoPor: string }, senal: SharedArrayBuffer) {
	const trabajador = new Worker(SCRIPT_APROBACION, {
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

function crearAdmin(entorno: EntornoPrueba): Actor {
	const id = nuevoId();
	crearUsuario(entorno.ambiente.db, { id, nombre: `Admin ${id}`, correo: `${id}@ejemplo.test`, rol: 'administrador', instante: INSTANTE });
	return { usuarioId: id, rol: 'administrador', autenticadoEn: INSTANTE, sesionIdHash: 'hash' };
}

describe('concurrencia de la aprobación de cafés de visitante (EV-104)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	it('EV-104: dos aprobaciones a la vez del mismo café → una cambia el estado y el stock baja una sola vez', async () => {
		const ana = crearAdmin(entorno);
		const luis = crearAdmin(entorno);
		const tipo = await prepararTipo(entorno.ambiente);
		registrarAportacion(entorno.ambiente, ana, { clienteId: nuevoId(), importe: 5000 });
		await registrarCompra(entorno.ambiente, ana, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 10, importe: 400 }],
			confirmoHuchaNegativa: false,
		});
		const visita = { id: nuevoId(), enlaceId: nuevoId(), nombre: 'Marta', expiraEn: '2026-10-25T10:00:00.000Z' };
		const { id } = registrarCafeVisitante(entorno.ambiente, visita, { clienteId: nuevoId(), tipoCapsulaId: tipo, horaGesto: INSTANTE });

		const ruta = join(entorno.base.directorio, 'becafe.db');
		const senal = new SharedArrayBuffer(4);
		const control = new Int32Array(senal);
		const primera = lanzarAprobacion(ruta, { id, tipo, revisadoPor: ana.usuarioId }, senal);
		const segunda = lanzarAprobacion(ruta, { id, tipo, revisadoPor: luis.usuarioId }, senal);
		await Promise.all([primera.listo, segunda.listo]);

		Atomics.store(control, 0, 1);
		Atomics.notify(control, 0);
		const resultados = await Promise.all([primera.resultado, segunda.resultado]);

		expect(resultados.filter((r) => r.estado === 'ok' && r.cambios === 1)).toHaveLength(1);
		expect(resultados.filter((r) => r.estado === 'ok' && r.cambios === 0)).toHaveLength(1);
		expect(entorno.ambiente.db.select().from(existencia).where(eq(existencia.tipoCapsulaId, tipo)).get()?.stock).toBe(9);
		expect(entorno.ambiente.db.select().from(cafeVisitante).where(eq(cafeVisitante.id, id)).get()?.estado).toBe('aprobado');
	});
});
