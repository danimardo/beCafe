import { and, desc, eq, sql } from 'drizzle-orm';
import type { Actor } from '#lib/server/auth';
import { RecursoNoEncontrado, type Ejecutor } from '#lib/server/plataforma';
import { listarUsuarios } from '#lib/server/usuarios';
import { aportacion, arqueo, movimiento } from './esquema';
import { saldoHucha, saldoPersona } from './libro';

// Consultas de saldos y aportaciones (RF-041, RF-042, RF-044). Sin efectos.

export type UltimoArqueo = { realizadoEn: string; contado: number };

export function leerSaldoPropio(db: Ejecutor, actor: Actor): number {
	return saldoPersona(db, actor.usuarioId);
}

export type SaldoDePersona = { usuarioId: string; nombre: string; saldo: number; esPropia: boolean };

/**
 * Saldos de las personas activas (CA-110). La fila propia va primero y el resto, por nombre (CA-111).
 * Una persona sin movimientos vigentes tiene saldo 0. Las personas de baja no aparecen.
 */
export function leerSaldos(db: Ejecutor, actor: Actor): SaldoDePersona[] {
	const sumas = db
		.select({ usuarioId: movimiento.usuarioId, total: sql<number>`coalesce(sum(${movimiento.importe}), 0)` })
		.from(movimiento)
		.where(and(eq(movimiento.cuenta, 'persona'), eq(movimiento.vigente, true)))
		.groupBy(movimiento.usuarioId)
		.all();
	const saldoPorId = new Map<string, number>();
	for (const suma of sumas) {
		if (suma.usuarioId !== null) saldoPorId.set(suma.usuarioId, suma.total);
	}
	return listarUsuarios(db)
		.filter((persona) => persona.estado === 'activo')
		.map((persona) => ({
			usuarioId: persona.id,
			nombre: persona.nombre,
			saldo: saldoPorId.get(persona.id) ?? 0,
			esPropia: persona.id === actor.usuarioId,
		}))
		.sort((a, b) => Number(b.esPropia) - Number(a.esPropia) || a.nombre.localeCompare(b.nombre, 'es'));
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
