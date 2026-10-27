// Gestos de reposo de Capsulito (RF-248, RF-259, CA-259, DEC-128, DEC-133). El gesto depende del tiempo que lleva en reposo, nunca
// del azar (constitución XVIII): a mayor espera, más impaciencia.

export const GESTOS = ['mirarLados', 'pie', 'bostezoMano', 'tocarReloj', 'bostezo'] as const;
export type GestoReposo = (typeof GESTOS)[number];

/** Momento (segundos en reposo, en múltiplos de 0,5) y duración de cada gesto. El último termina dentro del ciclo. */
export const GESTOS_REPOSO = [
	{ segundo: 4, gesto: 'mirarLados', duracion: 1.2 },
	{ segundo: 9.5, gesto: 'pie', duracion: 1.2 },
	{ segundo: 15, gesto: 'bostezoMano', duracion: 1.8 },
	{ segundo: 20.5, gesto: 'tocarReloj', duracion: 2 },
	{ segundo: 26, gesto: 'bostezo', duracion: 2 },
] as const satisfies readonly { segundo: number; gesto: GestoReposo; duracion: number }[];

/** Cada cuántos segundos parpadea Capsulito en reposo. */
export const PARPADEO_SEGUNDOS = 3;

/** Longitud del ciclo (RF-259): el ciclo vuelve a 0 a los 29 s, tras acabar el último bostezo. */
export const CICLO_REPOSO_SEGUNDOS = 29;

/** Paso del contador de reposo: los instantes de los gestos son múltiplos de medio segundo. */
export const PASO_REPOSO_SEGUNDOS = 0.5;

/** Gesto que toca justo al cumplirse `segundosEnReposo` (múltiplo de 0,5), o `null` si no toca ninguno. */
export function gestoEn(segundosEnReposo: number): GestoReposo | null {
	if (!Number.isFinite(segundosEnReposo) || segundosEnReposo < 0 || !Number.isInteger(segundosEnReposo * 2)) return null;
	const enElCiclo = segundosEnReposo % CICLO_REPOSO_SEGUNDOS;
	return GESTOS_REPOSO.find((gesto) => gesto.segundo === enElCiclo)?.gesto ?? null;
}

/** Gesto en curso a los `segundosEnReposo` (puede ser fraccionario): el que empezó en su segundo y aún no ha terminado, o `null`. */
export function gestoVigente(segundosEnReposo: number): GestoReposo | null {
	if (!Number.isFinite(segundosEnReposo) || segundosEnReposo < 0) return null;
	const enElCiclo = segundosEnReposo % CICLO_REPOSO_SEGUNDOS;
	return GESTOS_REPOSO.find((gesto) => enElCiclo >= gesto.segundo && enElCiclo < gesto.segundo + gesto.duracion)?.gesto ?? null;
}
