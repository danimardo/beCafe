// Reglas puras del stock (RN-071, RN-073). Sin base de datos, sin reloj ni azar (ARCHITECTURE.md §3).

/** Ventana de la estimación de días restantes (RN-073). */
export const DIAS_VENTANA_ESTIMACION = 30;

export type EstimacionDias = { tipo: 'dias'; dias: number } | { tipo: 'sin-datos' };

/** RN-071: el stock bajo incluye el umbral exacto y cualquier stock negativo. Con umbral 0, solo 0 o menos. */
export function estaEnStockBajo(stock: number, umbral: number): boolean {
	return stock <= umbral;
}

/**
 * RN-073: días restantes a partir de los consumos de los últimos 30 días. Con stock 0 o negativo, 0 días
 * (Clarifications, punto 5 de la spec). Sin consumos en la ventana, «sin datos».
 */
export function estimarDias(stock: number, consumosUltimos30: number): EstimacionDias {
	if (stock <= 0) return { tipo: 'dias', dias: 0 };
	if (consumosUltimos30 === 0) return { tipo: 'sin-datos' };
	return { tipo: 'dias', dias: Math.floor((stock * DIAS_VENTANA_ESTIMACION) / consumosUltimos30) };
}

/** Inicio de la ventana de consumos de la estimación (RN-073), a partir del instante recibido. Sin reloj propio. */
export function inicioVentanaEstimacion(ahora: string): string {
	const milisegundos = Date.parse(ahora) - DIAS_VENTANA_ESTIMACION * 24 * 60 * 60 * 1000;
	return new Date(milisegundos).toISOString();
}
