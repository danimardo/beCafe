import { sql } from 'drizzle-orm';
import { abrirBaseDatos, type Db } from '#lib/server/plataforma';
import { ErrorCopia } from './errores';

// Instantánea coherente de la base (plan F8 D1, paso 2). `VACUUM INTO` no va dentro de una transacción.

/** Copia la base a `rutaDestino` y comprueba que el archivo resultante está íntegro. */
export function hacerInstantanea(db: Db, rutaDestino: string): void {
	try {
		db.run(sql`VACUUM INTO ${rutaDestino}`);
	} catch {
		throw new ErrorCopia('INSTANTANEA');
	}
	const copia = abrirBaseDatos(rutaDestino);
	try {
		const filas = copia.db.all<{ quick_check: string }>(sql`PRAGMA quick_check`);
		if (filas.some((fila) => fila.quick_check !== 'ok')) throw new ErrorCopia('INSTANTANEA');
	} finally {
		copia.cerrar();
	}
}
