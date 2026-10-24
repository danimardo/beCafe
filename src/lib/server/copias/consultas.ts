import { desc } from 'drizzle-orm';
import type { Actor } from '#lib/server/auth';
import type { Ejecutor } from '#lib/server/plataforma';
import { copiaSeguridad } from './esquema';
import type { CodigoCopia } from './errores';
import { exigirPermisoCopias } from './pruebas-restauracion';

// Lectura del panel de copias (plan F8 D5, RF-143, CA-143). Solo administradores.

export const LIMITE_COPIAS_PANEL = 30;

export type CopiaLista = {
	id: string;
	iniciadaEn: string;
	finalizadaEn: string | null;
	estado: 'en_curso' | 'correcta' | 'fallida';
	tamano: number | null;
	codigoError: CodigoCopia | null;
	estadoHttp: number | null;
};

/** Las últimas 30 copias, la más reciente primero. */
export function leerCopias(db: Ejecutor, actor: Actor | undefined): CopiaLista[] {
	exigirPermisoCopias(db, actor);
	return db
		.select({
			id: copiaSeguridad.id,
			iniciadaEn: copiaSeguridad.iniciadaEn,
			finalizadaEn: copiaSeguridad.finalizadaEn,
			estado: copiaSeguridad.estado,
			tamano: copiaSeguridad.tamano,
			codigoError: copiaSeguridad.codigoError,
			estadoHttp: copiaSeguridad.estadoHttp,
		})
		.from(copiaSeguridad)
		.orderBy(desc(copiaSeguridad.iniciadaEn))
		.limit(LIMITE_COPIAS_PANEL)
		.all();
}
