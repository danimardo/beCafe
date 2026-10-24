import { describe, expect, it } from 'vitest';
import { bocaEnInstante, construirCuesLipSync, formaDeCaracter } from './lip-sync';

describe('sincronización labial de Capsulito (RF-187, CA-187)', () => {
	it('CA-187: clasifica las vocales y consonantes del español en las bocas 0..7 de Rive', () => {
		expect(formaDeCaracter('a')).toBe(2);
		expect(formaDeCaracter('Á')).toBe(2);
		expect(formaDeCaracter('e')).toBe(1);
		expect(formaDeCaracter('í')).toBe(1);
		expect(formaDeCaracter('o')).toBe(3);
		expect(formaDeCaracter('u')).toBe(4);
		expect(formaDeCaracter('f')).toBe(5);
		expect(formaDeCaracter('m')).toBe(7);
		expect(formaDeCaracter('p')).toBe(7);
		expect(formaDeCaracter('s')).toBe(6);
		expect(formaDeCaracter('!')).toBe(0);
		expect(formaDeCaracter(' ')).toBe(0);
	});

	it('CA-187: construirCuesLipSync ignora etiquetas expresivas [excited] pero conserva risas [chuckles] y el texto hablado', () => {
		const texto = '[excited] ¡Hola! [chuckles]';
		const characters = Array.from({ length: texto.length }, (_, idx) => texto.charAt(idx));
		const starts = characters.map((_, idx) => idx * 0.05);
		const ends = characters.map((_, idx) => (idx + 1) * 0.05);

		const cues = construirCuesLipSync({
			characters,
			character_start_times_seconds: starts,
			character_end_times_seconds: ends,
		});

		// `[excited]` ocupa los índices 0..8 (0.00 a 0.45 s): no debe generar ningún cue en ese tramo.
		expect(cues.every((cue) => cue.start >= 0.5)).toBe(true);
		// «Hola» empieza en 'H' (índice 11, 0.55 s) / 'o' (índice 12, 0.60 s -> boca 3) y 'a' (índice 14, 0.70 s -> boca 2).
		expect(cues.some((cue) => cue.value === 3)).toBe(true);
		expect(cues.some((cue) => cue.value === 2)).toBe(true);
		// `[chuckles]` al final genera boca abierta (2).
		expect(cues.at(-1)).toMatchObject({ value: 2 });
	});

	it('CA-187: bocaEnInstante devuelve la forma activa o 0 en silencio', () => {
		const cues = [
			{ start: 0.1, end: 0.3, value: 3 },
			{ start: 0.35, end: 0.5, value: 2 },
		];
		expect(bocaEnInstante(cues, 0.05)).toBe(0);
		expect(bocaEnInstante(cues, 0.2)).toBe(3);
		expect(bocaEnInstante(cues, 0.32)).toBe(0);
		expect(bocaEnInstante(cues, 0.4)).toBe(2);
		expect(bocaEnInstante(cues, 0.8)).toBe(0);
	});
});
