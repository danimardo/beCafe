import { and, desc, eq, sql } from 'drizzle-orm';
import { exigirSesion, type Actor } from '#lib/server/auth';
import { RecursoNoEncontrado, type Ejecutor } from '#lib/server/plataforma';
import { buscarUsuarioPorId, listarUsuarios } from '#lib/server/usuarios';
import { aportacion, arqueo, movimiento } from './esquema';
import { saldoHucha, saldoPersona } from './libro';

// Consultas de saldos y aportaciones (RF-041, RF-042, RF-044). Sin efectos.

export type UltimoArqueo = { realizadoEn: string; contado: number };

export function leerSaldoPropio(db: Ejecutor, actor: Actor): number {
	return saldoPersona(db, actor.usuarioId);
}

/** `totalAportado`: suma de las aportaciones vigentes de la persona, en céntimos (RF-199). */
export type SaldoDePersona = { usuarioId: string; nombre: string; saldo: number; totalAportado: number; esPropia: boolean };

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
	const aportadoPorId = new Map(
		db
			.select({ usuarioId: aportacion.usuarioId, total: sql<number>`coalesce(sum(${aportacion.importe}), 0)` })
			.from(aportacion)
			.where(eq(aportacion.estado, 'vigente'))
			.groupBy(aportacion.usuarioId)
			.all()
			.map((fila) => [fila.usuarioId, fila.total]),
	);
	return listarUsuarios(db)
		.filter((persona) => persona.estado === 'activo')
		.map((persona) => ({
			usuarioId: persona.id,
			nombre: persona.nombre,
			saldo: saldoPorId.get(persona.id) ?? 0,
			totalAportado: aportadoPorId.get(persona.id) ?? 0,
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

export const APORTACIONES_POR_PAGINA = 20;

export type AportacionDePersona = {
	id: string;
	importe: number;
	registradaEn: string;
	estado: 'vigente' | 'anulado';
	registradaPorNombre: string;
	registradaPorOtra: boolean;
};

/**
 * Detalle de las aportaciones de una persona (RF-199): fecha, importe y quién la registró. Cualquier miembro con sesión
 * lo ve, igual que los saldos. Lanza `RecursoNoEncontrado` si la persona no existe.
 */
export function leerAportacionesDe(
	db: Ejecutor,
	actor: Actor | undefined,
	usuarioId: string,
	pagina: number,
): { nombre: string; totalAportado: number; filas: AportacionDePersona[]; total: number } {
	exigirSesion(actor);
	const persona = buscarUsuarioPorId(db, usuarioId);
	if (!persona) throw new RecursoNoEncontrado();
	const deLaPersona = eq(aportacion.usuarioId, usuarioId);
	const resumen = db
		.select({
			total: sql<number>`count(*)`,
			aportado: sql<number>`coalesce(sum(case when ${aportacion.estado} = 'vigente' then ${aportacion.importe} else 0 end), 0)`,
		})
		.from(aportacion)
		.where(deLaPersona)
		.get();
	const filas = db
		.select()
		.from(aportacion)
		.where(deLaPersona)
		.orderBy(desc(aportacion.registradaEn), desc(aportacion.id))
		.limit(APORTACIONES_POR_PAGINA)
		.offset((pagina - 1) * APORTACIONES_POR_PAGINA)
		.all()
		.map((fila) => ({
			id: fila.id,
			importe: fila.importe,
			registradaEn: fila.registradaEn,
			estado: fila.estado,
			registradaPorNombre: buscarUsuarioPorId(db, fila.registradaPor)?.nombre ?? '',
			registradaPorOtra: fila.registradaPor !== fila.usuarioId,
		}));
	return { nombre: persona.nombre, totalAportado: resumen?.aportado ?? 0, filas, total: resumen?.total ?? 0 };
}
