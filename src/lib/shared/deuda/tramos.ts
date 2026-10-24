import type { FechaMadrid } from '#lib/shared/fechas/tipos';
import { parseMoney } from '#lib/shared/dinero';

// Recordatorios de deuda (plan F6 D5, Clarifications 8). Puro y compartido con F7: los importes van en céntimos.
// Un saldo por debajo del límite genera aviso; cuanto más negativo, con más frecuencia (RN-074).

export type IntervaloRecordatorio = 7 | 3 | 1;

/** Intervalo en días naturales entre recordatorios, o `null` si el saldo no genera aviso (saldo ≥ límite). */
export function intervaloRecordatorio(saldo: number, limite: number): IntervaloRecordatorio | null {
	if (saldo >= limite) return null;
	if (saldo < 4 * limite) return 1;
	if (saldo < 2 * limite) return 3;
	return 7;
}

/**
 * Lee el límite de deuda escrito como importe de la deuda («5», «5,00»; un signo menos inicial es opcional).
 * Se guarda en negativo (RN-074): «5,00» vale −500 céntimos. `null` si no es un importe válido.
 */
export function parsearLimite(texto: string): number | null {
	const importe = parseMoney(texto.trim().replace(/^[-−]/, ''));
	return importe === null || importe === 0 ? null : -importe;
}

/** Los tres umbrales de un límite, para mostrarlos al lector (de menos a más urgente). */
export function tramos(limite: number): { aviso: number; frecuente: number; diario: number } {
	return { aviso: limite, frecuente: 2 * limite, diario: 4 * limite };
}

/** Días naturales de Madrid entre dos fechas de calendario (`hoy` − `desde`). Sin reloj ni zona: ambas son fechas. */
export function diasNaturales(desde: FechaMadrid, hasta: FechaMadrid): number {
	const [anioD, mesD, diaD] = desde.split('-').map(Number);
	const [anioH, mesH, diaH] = hasta.split('-').map(Number);
	return (Date.UTC(anioH, mesH - 1, diaH) - Date.UTC(anioD, mesD - 1, diaD)) / 86_400_000;
}

/** Indica si toca enviar un recordatorio hoy: el saldo genera aviso y han pasado al menos `intervalo` días desde el último. */
export function tocaRecordatorio({
	saldo,
	limite,
	ultimoEnvio,
	hoy,
}: {
	saldo: number;
	limite: number;
	ultimoEnvio: FechaMadrid | null;
	hoy: FechaMadrid;
}): boolean {
	const intervalo = intervaloRecordatorio(saldo, limite);
	if (intervalo === null) return false;
	if (ultimoEnvio === null) return true;
	return diasNaturales(ultimoEnvio, hoy) >= intervalo;
}
