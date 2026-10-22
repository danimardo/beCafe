import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cambiarRol } from './roles';
import { construirUsuario } from './pruebas/constructores';
import { buscarUsuarioPorId, contarAdministradoresActivos } from './consultas';
import { aplicarMigraciones, abrirBaseDatos, enTransaccion, ErrorDeNegocio, type Db } from '../plataforma';

function codigoDeError(operacion: () => unknown): unknown {
	try {
		operacion();
	} catch (error) {
		return error instanceof ErrorDeNegocio ? error.codigo : undefined;
	}
	return undefined;
}

describe('roles y último administrador (INV-03, RN-041, CA-134, EV-040)', () => {
	let directorio: string;
	let db: Db;
	let otra: Database.Database;
	let segundaConexion: Db;

	beforeEach(() => {
		directorio = mkdtempSync(join(tmpdir(), 'becafe-roles-'));
		const conexion = abrirBaseDatos(join(directorio, 'becafe.db'));
		db = conexion.db;
		aplicarMigraciones(db, join(process.cwd(), 'drizzle'));
		otra = new Database(join(directorio, 'becafe.db'), { timeout: 0 });
		segundaConexion = drizzle({ client: otra });
	});

	afterEach(() => {
		otra.close();
		rmSync(directorio, { recursive: true, force: true });
	});

	it('CA-134: el único administrador activo no puede quitarse el rol', () => {
		const admin = construirUsuario(db, { rol: 'administrador' });
		const otro = construirUsuario(db);
		const codigo = codigoDeError(() =>
			enTransaccion(db, (tx) =>
				cambiarRol(tx, { usuarioId: admin.id, rolNuevo: 'miembro', actorId: otro.id, instante: '2026-10-21T09:00:00.000Z' }),
			),
		);
		expect(codigo).toBe('ULTIMO_ADMIN');
		expect(buscarUsuarioPorId(db, admin.id)?.rol).toBe('administrador');
	});

	it('EV-040: mientras una transacción de cambio de rol está abierta, otra no puede empezar (SQLITE_BUSY)', () => {
		const a = construirUsuario(db, { rol: 'administrador' });
		construirUsuario(db, { rol: 'administrador' });
		let bloqueada = false;
		enTransaccion(db, (tx) => {
			cambiarRol(tx, { usuarioId: a.id, rolNuevo: 'miembro', actorId: a.id, instante: '2026-10-21T09:00:00.000Z' });
			try {
				otra.prepare('BEGIN IMMEDIATE').run();
			} catch (error) {
				bloqueada = error instanceof Error && error.message.includes('locked');
			}
		});
		expect(bloqueada).toBe(true);
	});

	it('EV-040: tras el primer cambio, el segundo cambio concurrente ve un solo administrador y se rechaza', () => {
		const a = construirUsuario(db, { rol: 'administrador' });
		const b = construirUsuario(db, { rol: 'administrador' });
		enTransaccion(db, (tx) =>
			cambiarRol(tx, { usuarioId: a.id, rolNuevo: 'miembro', actorId: b.id, instante: '2026-10-21T09:00:00.000Z' }),
		);
		expect(contarAdministradoresActivos(db)).toBe(1);
		const codigo = codigoDeError(() =>
			enTransaccion(segundaConexion, (tx) =>
				cambiarRol(tx, { usuarioId: b.id, rolNuevo: 'miembro', actorId: b.id, instante: '2026-10-21T09:00:00.000Z' }),
			),
		);
		expect(codigo).toBe('ULTIMO_ADMIN');
		expect(buscarUsuarioPorId(db, b.id)?.rol).toBe('administrador');
	});
});
