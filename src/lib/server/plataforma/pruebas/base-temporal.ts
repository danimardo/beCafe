import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { aplicarMigraciones, abrirBaseDatos, type Db } from '../db/conexion';

// Base SQLite real y temporal, con las migraciones del proyecto (constitución VIII: integración contra SQLite real).
export type BaseTemporal = { db: Db; directorio: string; cerrar(): void };

export function crearBaseTemporal(): BaseTemporal {
	const directorio = mkdtempSync(join(tmpdir(), 'becafe-prueba-'));
	const conexion = abrirBaseDatos(join(directorio, 'becafe.db'));
	aplicarMigraciones(conexion.db, join(process.cwd(), 'drizzle'));
	return {
		db: conexion.db,
		directorio,
		cerrar() {
			conexion.cerrar();
			rmSync(directorio, { recursive: true, force: true });
		},
	};
}
