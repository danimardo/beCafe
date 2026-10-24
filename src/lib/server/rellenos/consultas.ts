import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { leerConfiguracion } from '#lib/server/configuracion';
import type { Ejecutor } from '#lib/server/plataforma';
import { usuario } from '#lib/server/usuarios';
import { esquemaInstanteUtc, type InstanteUtc, type Mes } from '#lib/shared/fechas/tipos';
import { mesAnterior, mesDeInstante } from '#lib/shared/fechas/meses';
import { aguadorMes, rellenoAgua } from './esquema';
import type { PersonaRelleno } from './registrar';

// Consultas de rellenos (plan F8 D2, D5, D6, D7; data-model.md). Solo leen. Un relleno no mueve dinero (RN-080).

export type RellenoLeido = {
	id: string;
	usuarioId: string;
	nombre: string;
	registradoEn: InstanteUtc;
	estado: 'vigente' | 'anulado';
	anuladoEn: InstanteUtc | null;
	motivo: string | null;
};

/** Último relleno vigente, con el nombre de quien lo registró. `esPropio` decide el texto («Tú la rellenaste»). */
export type UltimoRelleno = { id: string; nombre: string; registradoEn: InstanteUtc; esPropio: boolean };

export type EstadoAgua = {
	ultimo: UltimoRelleno | null;
	/** Aguador del mes anterior; `null` si ese mes no tuvo rellenos. */
	aguadores: { mes: Mes; personas: { nombre: string; esPropio: boolean }[] } | null;
};

function filaDeRelleno(fila: {
	id: string;
	usuarioId: string;
	nombre: string;
	registradoEn: string;
	estado: 'vigente' | 'anulado';
	anuladoEn: string | null;
	motivoAnulacion: string | null;
}): RellenoLeido {
	return {
		id: fila.id,
		usuarioId: fila.usuarioId,
		nombre: fila.nombre,
		registradoEn: esquemaInstanteUtc.parse(fila.registradoEn),
		estado: fila.estado,
		anuladoEn: fila.anuladoEn === null ? null : esquemaInstanteUtc.parse(fila.anuladoEn),
		motivo: fila.motivoAnulacion,
	};
}

/** Estado de la tarjeta de agua (RF-170): el último vigente y el aguador del mes anterior. */
export function leerEstadoAgua(db: Ejecutor, persona: PersonaRelleno, ahora: InstanteUtc): EstadoAgua {
	const ultimo = db
		.select({ id: rellenoAgua.id, nombre: usuario.nombre, usuarioId: rellenoAgua.usuarioId, registradoEn: rellenoAgua.registradoEn })
		.from(rellenoAgua)
		.innerJoin(usuario, eq(usuario.id, rellenoAgua.usuarioId))
		.where(eq(rellenoAgua.estado, 'vigente'))
		.orderBy(desc(rellenoAgua.registradoEn))
		.limit(1)
		.get();

	const mes = mesAnterior(mesDeInstante(ahora));
	const filas = db
		.select({ nombre: usuario.nombre, usuarioId: aguadorMes.usuarioId })
		.from(aguadorMes)
		.innerJoin(usuario, eq(usuario.id, aguadorMes.usuarioId))
		.where(eq(aguadorMes.mes, mes))
		.orderBy(usuario.nombre)
		.all();

	return {
		ultimo: ultimo
			? {
					id: ultimo.id,
					nombre: ultimo.nombre,
					registradoEn: esquemaInstanteUtc.parse(ultimo.registradoEn),
					esPropio: ultimo.usuarioId === persona.usuarioId,
				}
			: null,
		aguadores:
			filas.length > 0
				? { mes, personas: filas.map((fila) => ({ nombre: fila.nombre, esPropio: fila.usuarioId === persona.usuarioId })) }
				: null,
	};
}

/** Detalle de un relleno para `/rellenos/[id]` (contracts/rutas.md). `puedeAnular` lo calcula el caso de uso. */
export function leerRelleno(db: Ejecutor, persona: PersonaRelleno & { administrador: boolean }, id: string, ahora: InstanteUtc) {
	const fila = db
		.select({
			id: rellenoAgua.id,
			usuarioId: rellenoAgua.usuarioId,
			nombre: usuario.nombre,
			registradoEn: rellenoAgua.registradoEn,
			estado: rellenoAgua.estado,
			anuladoEn: rellenoAgua.anuladoEn,
			motivoAnulacion: rellenoAgua.motivoAnulacion,
		})
		.from(rellenoAgua)
		.innerJoin(usuario, eq(usuario.id, rellenoAgua.usuarioId))
		.where(eq(rellenoAgua.id, id))
		.get();
	if (!fila) return null;
	const { plazoAutoanulacionMin } = leerConfiguracion(db);
	const dentroDePlazo = Date.parse(ahora) - Date.parse(fila.registradoEn) <= plazoAutoanulacionMin * 60_000;
	const esAutor = fila.usuarioId === persona.usuarioId;
	return {
		...filaDeRelleno(fila),
		esPropio: esAutor,
		puedeAnular: fila.estado === 'vigente' && (persona.administrador || (esAutor && dentroDePlazo)),
	};
}

/**
 * Rellenos para el historial, del más reciente al más antiguo. Con `usuarioId`, solo los de esa persona;
 * con `incluirAnulados`, también los anulados (RN-083).
 */
export function leerRellenos(db: Ejecutor, filtro: { usuarioId?: string; incluirAnulados: boolean; limite: number }): RellenoLeido[] {
	const filas = db
		.select({
			id: rellenoAgua.id,
			usuarioId: rellenoAgua.usuarioId,
			nombre: usuario.nombre,
			registradoEn: rellenoAgua.registradoEn,
			estado: rellenoAgua.estado,
			anuladoEn: rellenoAgua.anuladoEn,
			motivoAnulacion: rellenoAgua.motivoAnulacion,
		})
		.from(rellenoAgua)
		.innerJoin(usuario, eq(usuario.id, rellenoAgua.usuarioId))
		.where(
			and(
				filtro.incluirAnulados ? undefined : eq(rellenoAgua.estado, 'vigente'),
				filtro.usuarioId ? eq(rellenoAgua.usuarioId, filtro.usuarioId) : undefined,
			),
		)
		.orderBy(desc(rellenoAgua.registradoEn), desc(rellenoAgua.id))
		.limit(filtro.limite)
		.all();
	return filas.map(filaDeRelleno);
}

/** Rellenos vigentes de un periodo, incluidos los de personas dadas de baja (RN-085), para el ranking y el KPI. */
export function contarRellenos(
	db: Ejecutor,
	filtro: { desde: InstanteUtc; hasta: InstanteUtc; usuarioId?: string },
): { usuarioId: string; registradoEn: InstanteUtc }[] {
	return db
		.select({ usuarioId: rellenoAgua.usuarioId, registradoEn: rellenoAgua.registradoEn })
		.from(rellenoAgua)
		.where(
			and(
				eq(rellenoAgua.estado, 'vigente'),
				gte(rellenoAgua.registradoEn, filtro.desde),
				lt(rellenoAgua.registradoEn, filtro.hasta),
				filtro.usuarioId ? eq(rellenoAgua.usuarioId, filtro.usuarioId) : undefined,
			),
		)
		.all()
		.map((fila) => ({ usuarioId: fila.usuarioId, registradoEn: esquemaInstanteUtc.parse(fila.registradoEn) }));
}

/** Aguadores fijados para un mes (CA-176). Una fila por persona; ninguna si el mes no tuvo rellenos. */
export function leerAguador(db: Ejecutor, mes: Mes): { usuarioId: string; nombre: string; rellenos: number }[] {
	return db
		.select({ usuarioId: aguadorMes.usuarioId, nombre: usuario.nombre, rellenos: aguadorMes.rellenos })
		.from(aguadorMes)
		.innerJoin(usuario, eq(usuario.id, aguadorMes.usuarioId))
		.where(eq(aguadorMes.mes, mes))
		.orderBy(usuario.nombre)
		.all();
}

/** Número de rellenos que cumplen el filtro del historial, para la paginación (incluye los de personas de baja). */
export function contarRellenosHistorial(db: Ejecutor, filtro: { usuarioId?: string; incluirAnulados: boolean }): number {
	return db
		.select({ id: rellenoAgua.id })
		.from(rellenoAgua)
		.where(
			and(
				filtro.incluirAnulados ? undefined : eq(rellenoAgua.estado, 'vigente'),
				filtro.usuarioId ? eq(rellenoAgua.usuarioId, filtro.usuarioId) : undefined,
			),
		)
		.all().length;
}
