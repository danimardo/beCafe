import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { sql } from 'drizzle-orm';
import { abrirBaseDatos } from './conexion';
import { aplicarMigraciones, enTransaccion } from '../index';
import { crearBaseTemporal } from '../pruebas/base-temporal';

describe('migraciones (constitución V y XIV)', () => {
	it('sobre una base vacía crea las tablas del esquema', () => {
		const base = crearBaseTemporal();
		const tablas = base.db.all<{ nombre: string }>(sql`SELECT name AS nombre FROM sqlite_master WHERE type = 'table' AND name = 'usuario'`);
		expect(tablas).toHaveLength(1);
		base.cerrar();
	});

	it('una segunda pasada no aplica ninguna migración', () => {
		const base = crearBaseTemporal();
		expect(aplicarMigraciones(base.db, join(process.cwd(), 'drizzle'))).toBe(0);
		base.cerrar();
	});

	it('abrirBaseDatos crea el directorio de datos si no existe', () => {
		const directorio = join(mkdtempSync(join(tmpdir(), 'becafe-dir-')), 'anidado');
		const conexion = abrirBaseDatos(join(directorio, 'becafe.db'));
		expect(conexion.db).toBeDefined();
		conexion.cerrar();
	});
});

describe('enTransaccion (constitución IV)', () => {
	it('deshace todo lo escrito si la operación lanza un error', () => {
		const base = crearBaseTemporal();
		expect(() =>
			enTransaccion(base.db, (tx) => {
				tx.run(sql`CREATE TABLE prueba_rollback (valor TEXT)`);
				tx.run(sql`INSERT INTO prueba_rollback (valor) VALUES ('x')`);
				throw new Error('fallo a propósito');
			}),
		).toThrow('fallo a propósito');
		const tablas = base.db.all<{ nombre: string }>(sql`SELECT name AS nombre FROM sqlite_master WHERE name = 'prueba_rollback'`);
		expect(tablas).toHaveLength(0);
		base.cerrar();
	});

	it('rechaza una operación asíncrona, porque la transacción debe ser síncrona', () => {
		const base = crearBaseTemporal();
		expect(() => enTransaccion(base.db, () => Promise.resolve(1))).toThrow('no admite funciones asíncronas');
		base.cerrar();
	});
});
