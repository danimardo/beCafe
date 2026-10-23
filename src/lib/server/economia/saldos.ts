import { desc, eq } from 'drizzle-orm';
import type { Actor } from '#lib/server/auth';
import { RecursoNoEncontrado, type Ejecutor } from '#lib/server/plataforma';
import { aportacion, arqueo } from './esquema';
import { saldoHucha, saldoPersona } from './libro';

// Consultas de saldos y aportaciones (RF-041, RF-042, RF-044). Sin efectos.

export type UltimoArqueo = { realizadoEn: string; contado: number };

export function leerSaldoPropio(db: Ejecutor, actor: Actor): number {
	return saldoPersona(db, actor.usuarioId);
}

export function leerSaldoHucha(db: Ejecutor): { saldo: number; ultimoArqueo: UltimoArqueo | null } {
	const ultimo = db
		.select({ realizadoEn: arqueo.realizadoEn, contado: arqueo.contado })
		.from(arqueo)
		.where(eq(arqueo.estado, 'vigente'))
		.orderBy(desc(arqueo.realizadoEn))
		.limit(1)
		.get();
	return { saldo: saldoHucha(db), ultimoArqueo: ultimo ?? null };
}

export function leerAportacionesPropias(db: Ejecutor, actor: Actor, limite: number) {
	return db
		.select()
		.from(aportacion)
		.where(eq(aportacion.usuarioId, actor.usuarioId))
		.orderBy(desc(aportacion.registradaEn))
		.limit(limite)
		.all();
}

/** Una aportación se lee si es propia o si quien consulta es administrador. Si no, es «no encontrada». */
export function leerAportacion(db: Ejecutor, actor: Actor, id: string) {
	const fila = db.select().from(aportacion).where(eq(aportacion.id, id)).get();
	if (!fila) throw new RecursoNoEncontrado();
	if (fila.usuarioId !== actor.usuarioId && actor.rol !== 'administrador') throw new RecursoNoEncontrado();
	return fila;
}
