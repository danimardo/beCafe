import { limitesDeAnio, limitesDeMes, mesAnterior, mesesEntre } from '#lib/shared/fechas/meses';
import type { InstanteUtc, Mes } from '#lib/shared/fechas/tipos';

// Periodos de las estadísticas (plan F5 D9; spec.md, Clarifications 2). Función pura: el mes actual llega por parámetro.

/** `ultimos`: los `meses` meses naturales que terminan en el mes actual, incluido (RF-202). */
export type Periodo = { tipo: 'mes'; mes: Mes } | { tipo: 'anio'; anio: number } | { tipo: 'ultimos'; meses: number } | { tipo: 'todo' };

export type Limites = { desde: InstanteUtc; hasta: InstanteUtc };

/**
 * Intervalo `[desde, hasta)` de un periodo. `todo` va del primer mes con consumos al mes actual;
 * sin consumos devuelve `null` (vacío). Un mes o un año sin datos devuelve su intervalo igualmente.
 */
export function limitesDePeriodo(periodo: Periodo, primerMes: Mes | null, mesActual: Mes): Limites | null {
	if (periodo.tipo === 'mes') {
		return limitesDeMes(periodo.mes);
	}
	if (periodo.tipo === 'anio') {
		return limitesDeAnio(periodo.anio);
	}
	if (periodo.tipo === 'ultimos') {
		return { desde: limitesDeMes(primerMesDeUltimos(periodo.meses, mesActual)).desde, hasta: limitesDeMes(mesActual).hasta };
	}
	if (primerMes === null) {
		return null;
	}
	const primero = limitesDeMes(primerMes);
	const ultimo = limitesDeMes(mesActual);
	return { desde: primero.desde, hasta: ultimo.hasta };
}

/** Serie mensual completa: los meses sin dato valen 0 (Clarifications 2 de la spec). */
export function rellenarMeses(serie: Map<Mes, number>, meses: Mes[]): { mes: Mes; valor: number }[] {
	return meses.map((mes) => ({ mes, valor: serie.get(mes) ?? 0 }));
}

/** Meses de un periodo `todo` entre el primero con datos y el actual, ambos incluidos. */
export function mesesDelPeriodo(primerMes: Mes | null, mesActual: Mes): Mes[] {
	return primerMes === null ? [] : mesesEntre(primerMes, mesActual);
}

/** Primer mes de los últimos `meses` meses que terminan en `mesActual` (con 1, el propio mes actual). */
export function primerMesDeUltimos(meses: number, mesActual: Mes): Mes {
	let mes = mesActual;
	for (let i = 1; i < meses; i += 1) mes = mesAnterior(mes);
	return mes;
}

/** Meses de los últimos `meses` meses, del más antiguo al actual. */
export function mesesDeUltimos(meses: number, mesActual: Mes): Mes[] {
	return mesesEntre(primerMesDeUltimos(meses, mesActual), mesActual);
}
