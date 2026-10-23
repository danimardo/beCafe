import { and, eq, gte, lt, min } from 'drizzle-orm';
import type { Ejecutor } from '#lib/server/plataforma';
import { consumo } from './esquema';

// Consultas agregadas de consumos para las estadísticas (plan F5 D3). Solo lee consumos vigentes (RN-035).
// Agrupar por mes de Madrid lo hace `estadisticas`, con `meses.ts`: SQLite no conoce la zona horaria.

export type ConsumoEstadistico = {
	usuarioId: string;
	tipoCapsulaId: string;
	horaGesto: string;
	invitado: boolean;
	precioAplicado: number;
};

/** Consumos vigentes cuya hora del toque cae en `[desde, hasta)`. Con `usuarioId`, solo los de esa persona. */
export function contarConsumos(db: Ejecutor, filtro: { desde: string; hasta: string; usuarioId?: string }): ConsumoEstadistico[] {
	return db
		.select({
			usuarioId: consumo.usuarioId,
			tipoCapsulaId: consumo.tipoCapsulaId,
			horaGesto: consumo.horaGesto,
			invitado: consumo.invitado,
			precioAplicado: consumo.precioAplicado,
		})
		.from(consumo)
		.where(
			and(
				eq(consumo.estado, 'vigente'),
				gte(consumo.horaGesto, filtro.desde),
				lt(consumo.horaGesto, filtro.hasta),
				filtro.usuarioId ? eq(consumo.usuarioId, filtro.usuarioId) : undefined,
			),
		)
		.all();
}

/** Hora del toque más antigua entre los consumos vigentes (de una persona, si se indica). `null` si no hay ninguno. */
export function primerConsumo(db: Ejecutor, usuarioId?: string): string | null {
	const fila = db
		.select({ primero: min(consumo.horaGesto) })
		.from(consumo)
		.where(and(eq(consumo.estado, 'vigente'), usuarioId ? eq(consumo.usuarioId, usuarioId) : undefined))
		.get();
	return fila?.primero ?? null;
}
