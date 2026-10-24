import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { abrirBaseDatos } from '#lib/server/plataforma';
import { desempaquetar } from './empaquetado';

// Verificación de una copia descargada (plan F8 D11, RF-142, EV-070). Trabaja sobre una extracción temporal y solo
// devuelve totales: nunca nombres, correos ni importes por persona (constitución XVI).

export type ResultadoVerificacion = {
	integridad: string;
	migracionesAplicadas: number;
	migracionesEsperadas: number;
	usuarios: number;
};

const esquemaJournal = z.object({ entries: z.array(z.object({ tag: z.string() })) });

/** Verifica una copia `.tar.gz`: integridad de SQLite, migraciones y recuento de personas. Borra su extracción al terminar. */
export async function verificarCopia(archivo: string, rutaJournal: string): Promise<ResultadoVerificacion> {
	const directorio = await mkdtemp(join(tmpdir(), 'becafe-verificacion-'));
	try {
		await desempaquetar(archivo, directorio);
		const journal = esquemaJournal.parse(JSON.parse(await readFile(rutaJournal, 'utf-8')));
		const conexion = abrirBaseDatos(join(directorio, 'becafe.db'));
		try {
			const integridad = conexion.db.all<{ integrity_check: string }>(sql`PRAGMA integrity_check`)[0]?.integrity_check ?? 'desconocido';
			const migraciones = conexion.db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM __drizzle_migrations`)[0]?.n ?? 0;
			const usuarios = conexion.db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM usuario`)[0]?.n ?? 0;
			return { integridad, migracionesAplicadas: migraciones, migracionesEsperadas: journal.entries.length, usuarios };
		} finally {
			conexion.cerrar();
		}
	} finally {
		await rm(directorio, { recursive: true, force: true });
	}
}
