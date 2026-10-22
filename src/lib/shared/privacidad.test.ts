import { describe, expect, it } from 'vitest';
import { TEXTO_PRIVACIDAD, VERSION_PRIVACIDAD } from './privacidad';

// RF-160: el texto que se acepta debe tener una versión entera y bloques con contenido.
describe('texto de privacidad (RF-160, PEND-014)', () => {
	it('CA-160: la versión vigente es un entero positivo', () => {
		expect(Number.isInteger(VERSION_PRIVACIDAD)).toBe(true);
		expect(VERSION_PRIVACIDAD).toBeGreaterThanOrEqual(1);
	});

	it('empieza por un título y no tiene bloques vacíos', () => {
		expect(TEXTO_PRIVACIDAD[0]).toEqual({ tipo: 'titulo', texto: 'Privacidad en beCafé' });
		for (const bloque of TEXTO_PRIVACIDAD) {
			if (bloque.tipo === 'lista') expect(bloque.elementos.length).toBeGreaterThan(0);
			else expect(bloque.texto.trim().length).toBeGreaterThan(0);
		}
	});

	it('PEND-014: los marcadores entre corchetes siguen visibles mientras el texto no sea definitivo', () => {
		const textos = TEXTO_PRIVACIDAD.map((bloque) => (bloque.tipo === 'lista' ? bloque.elementos.join(' ') : bloque.texto));
		expect(textos.some((texto) => texto.includes('[Nombre de la empresa]'))).toBe(true);
	});
});
