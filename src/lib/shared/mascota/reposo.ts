// Gestos de reposo de Capsulito (RF-248, CA-248, DEC-128). El gesto depende del tiempo que lleva en reposo, nunca del azar
// (constitución XVIII): a mayor espera, más impaciencia.

export const GESTOS = ['mirarLados', 'pie', 'reloj', 'bostezo'] as const;
export type GestoReposo = (typeof GESTOS)[number];

/** Momento (segundos en reposo) y duración de cada gesto. El último fija la longitud del ciclo. */
export const GESTOS_REPOSO = [
	{ segundo: 6, gesto: 'mirarLados', duracion: 1.2 },
	{ segundo: 12, gesto: 'pie', duracion: 1.2 },
	{ segundo: 16, gesto: 'reloj', duracion: 1.6 },
	{ segundo: 21, gesto: 'bostezo', duracion: 2 },
] as const satisfies readonly { segundo: number; gesto: GestoReposo; duracion: number }[];

/** Cada cuántos segundos parpadea Capsulito en reposo. */
export const PARPADEO_SEGUNDOS = 3;

/** Longitud del ciclo: el ciclo vuelve a 0 cuando termina el bostezo. */
export const CICLO_REPOSO_SEGUNDOS = 23;

/** Gesto que toca justo al cumplirse `segundosEnReposo` (entero), o `null` si no toca ninguno. */
export function gestoEn(segundosEnReposo: number): GestoReposo | null {
	if (!Number.isFinite(segundosEnReposo) || segundosEnReposo < 0) return null;
	const enElCiclo = Math.floor(segundosEnReposo) % CICLO_REPOSO_SEGUNDOS;
	return GESTOS_REPOSO.find((gesto) => gesto.segundo === enElCiclo)?.gesto ?? null;
}

/** Gesto en curso a los `segundosEnReposo` (puede ser fraccionario): el que empezó en su segundo y aún no ha terminado, o `null`. */
export function gestoVigente(segundosEnReposo: number): GestoReposo | null {
	if (!Number.isFinite(segundosEnReposo) || segundosEnReposo < 0) return null;
	const enElCiclo = segundosEnReposo % CICLO_REPOSO_SEGUNDOS;
	return GESTOS_REPOSO.find((gesto) => enElCiclo >= gesto.segundo && enElCiclo < gesto.segundo + gesto.duracion)?.gesto ?? null;
}
