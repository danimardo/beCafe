import type { CueLipSync } from '#lib/shared/contratos/apariencia';

/**
 * Formas de boca de Capsulito en Rive (capa `Boca`, propiedad `mouth` del ViewModel `Default`):
 * - 0: cerrada / silencio / pausa
 * - 1: E, I (sonrisa / vocal anterior)
 * - 2: A (abierta)
 * - 3: O (redonda media)
 * - 4: U (redonda pequeña)
 * - 5: F, V (labiodental)
 * - 6: L, R, D, T, N, S, Z, C, J, G, Q, K, X (alveolar / dental / velar)
 * - 7: M, B, P (bilabial cerrada)
 */
export type FormaBoca = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface AlineacionCaracteres {
	readonly characters: readonly string[];
	readonly character_start_times_seconds: readonly number[];
	readonly character_end_times_seconds: readonly number[];
}

const ETIQUETAS_RISA = new Set(['laughs', 'laughing', 'chuckles', 'giggles', 'risas', 'risa']);

/** Quita tildes y pasa a minúscula un carácter para clasificarlo fonéticamente. */
function normalizarCaracter(caracter: string): string {
	return caracter
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

/** Devuelve la forma de boca (0..7) asociada a un carácter pronunciado en español. */
export function formaDeCaracter(caracter: string): FormaBoca {
	const limpio = normalizarCaracter(caracter);
	if (!limpio || /[\s.,;:¡!¿?…"«»()—\-']/.test(limpio)) return 0;
	if ('mbp'.includes(limpio)) return 7;
	if ('fv'.includes(limpio)) return 5;
	if ('a'.includes(limpio)) return 2;
	if ('ei'.includes(limpio) || limpio === 'y') return 1;
	if ('o'.includes(limpio)) return 3;
	if ('uw'.includes(limpio)) return 4;
	if ('lrdtnszcjgqkxñ'.includes(limpio)) return 6;
	return 0;
}

function redondearTiempo(segundos: number): number {
	return Math.round(segundos * 1000) / 1000;
}

/**
 * Convierte la alineación por carácter de ElevenLabs (`/with-timestamps`) en `cues` compactos `1..7`.
 * Ignora las etiquetas expresivas entre corchetes (`[excited]`, `[sighs]`, etc.) para no mover la boca
 * sobre metadatos no hablados, salvo las etiquetas de risa (`[chuckles]`, `[laughs]`), que generan boca abierta (`2`).
 */
export function construirCuesLipSync(alineacion: AlineacionCaracteres): CueLipSync[] {
	const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = alineacion;
	const crudos: CueLipSync[] = [];
	const total = Math.min(characters.length, starts.length, ends.length);

	let indice = 0;
	while (indice < total) {
		const ch = characters[indice] ?? '';
		if (ch === '[') {
			let cierre = indice + 1;
			let contenido = '';
			while (cierre < total && characters[cierre] !== ']') {
				contenido += characters[cierre] ?? '';
				cierre += 1;
			}
			const etiqueta = contenido.trim().toLowerCase();
			const inicioEtiqueta = starts[indice] ?? 0;
			const finEtiqueta = ends[Math.min(cierre, total - 1)] ?? inicioEtiqueta;
			if (ETIQUETAS_RISA.has(etiqueta) && finEtiqueta > inicioEtiqueta) {
				crudos.push({ start: inicioEtiqueta, end: finEtiqueta, value: 2 });
			}
			indice = cierre + 1;
			continue;
		}

		const boca = formaDeCaracter(ch);
		const inicio = starts[indice] ?? 0;
		const fin = ends[indice] ?? inicio;
		if (boca !== 0 && fin > inicio) {
			crudos.push({ start: inicio, end: fin, value: boca });
		}
		indice += 1;
	}

	const agrupados: CueLipSync[] = [];
	for (const cue of crudos) {
		const anterior: CueLipSync | undefined = agrupados.at(-1);
		if (anterior !== undefined && anterior.value === cue.value && cue.start - anterior.end < 0.04) {
			anterior.end = cue.end;
		} else {
			agrupados.push({ ...cue });
		}
	}

	return agrupados
		.filter((cue) => cue.end - cue.start >= 0.02)
		.map((cue) => ({
			start: redondearTiempo(cue.start),
			end: redondearTiempo(cue.end),
			value: cue.value,
		}));
}

/** Devuelve la forma de boca `0..7` correspondiente al instante `segundos` de reproducción. */
export function bocaEnInstante(cues: readonly CueLipSync[], segundos: number): FormaBoca {
	if (segundos < 0) return 0;
	for (const cue of cues) {
		if (segundos >= cue.start && segundos < cue.end) {
			const valor = cue.value;
			if (valor === 1 || valor === 2 || valor === 3 || valor === 4 || valor === 5 || valor === 6 || valor === 7) {
				return valor;
			}
		}
	}
	return 0;
}
