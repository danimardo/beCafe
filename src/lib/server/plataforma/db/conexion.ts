import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { sql } from 'drizzle-orm';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';

// Conexión SQLite (constitución V, ARCHITECTURE.md §5). Síncrona: better-sqlite3 no usa promesas.
export type Db = BetterSQLite3Database;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** La base de datos o una transacción: lo que aceptan las consultas y las escrituras de los módulos. */
export type Ejecutor = BaseSQLiteDatabase<'sync', unknown>;

export type Conexion = { db: Db; cerrar(): void };

export function abrirBaseDatos(ruta: string): Conexion {
	mkdirSync(dirname(ruta), { recursive: true });
	const sqlite = new Database(ruta);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	return { db: drizzle({ client: sqlite }), cerrar: () => sqlite.close() };
}

/**
 * Ejecuta `operacion` en una transacción `BEGIN IMMEDIATE`. Rechaza funciones asíncronas: una promesa dentro de la
 * transacción cerraría la conexión a mitad (ARCHITECTURE.md §5, punto 3).
 */
export function enTransaccion<T>(db: Db, operacion: (tx: Tx) => T): T {
	return db.transaction(
		(tx) => {
			const resultado = operacion(tx);
			if (resultado instanceof Promise) throw new Error('enTransaccion no admite funciones asíncronas');
			return resultado;
		},
		{ behavior: 'immediate' },
	);
}

const esquemaCuenta = z.array(z.object({ n: z.number() }));

function recuentoMigraciones(db: Db): number {
	const tabla = esquemaCuenta.parse(
		db.all(sql`SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'`),
	);
	if (tabla[0]?.n === 0) return 0;
	return esquemaCuenta.parse(db.all(sql`SELECT count(*) AS n FROM "__drizzle_migrations"`))[0]?.n ?? 0;
}

/** Aplica las migraciones pendientes y devuelve cuántas se han aplicado en esta llamada. */
export function aplicarMigraciones(db: Db, carpeta: string): number {
	const antes = recuentoMigraciones(db);
	migrate(db, { migrationsFolder: carpeta });
	return recuentoMigraciones(db) - antes;
}

/** Comprueba que la base de datos responde (`/api/salud`). */
export function baseDatosResponde(db: Db): boolean {
	try {
		db.all(sql`SELECT 1`);
		return true;
	} catch {
		return false;
	}
}
