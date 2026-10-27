import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { coloresCapsula, contraste, CONTRASTE_LIMITE, CONTRASTE_TEXTO, luminancia } from './color-propio';
import { REFERENCIAS_TEMA } from './referencias-tema';

// EV-115, CA-270, RF-270: el color propio de una cápsula siempre se lee en los dos temas.
const HEX = /^#[0-9a-f]{6}$/;
const colorArbitrario = fc.integer({ min: 0, max: 0xffffff }).map((valor) => `#${valor.toString(16).padStart(6, '0')}`);
const TEMAS = ['claro', 'oscuro'] as const;

describe('luminancia y contraste (WCAG 2.2)', () => {
	it('negro y blanco dan 0, 1 y 21:1', () => {
		expect(luminancia('#000000')).toBe(0);
		expect(luminancia('#ffffff')).toBeCloseTo(1, 10);
		expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
	});

	it('es simétrico y un color contra sí mismo da 1:1', () => {
		fc.assert(
			fc.property(colorArbitrario, colorArbitrario, (a, b) => {
				expect(contraste(a, b)).toBeCloseTo(contraste(b, a), 10);
				expect(contraste(a, a)).toBeCloseTo(1, 10);
			}),
		);
	});

	it('rechaza un formato que no es #rrggbb', () => {
		expect(() => luminancia('rojo')).toThrow(RangeError);
		expect(() => coloresCapsula('#fff')).toThrow(RangeError);
	});
});

describe('coloresCapsula', () => {
	for (const tema of TEMAS) {
		it(`EV-115, CA-270: para cualquier color, en tema ${tema} el texto da ≥ 4,5:1 y el límite ≥ 3:1`, () => {
			fc.assert(
				fc.property(colorArbitrario, (color) => {
					const { relleno, limite, texto } = coloresCapsula(color)[tema];
					const referencias = REFERENCIAS_TEMA[tema];
					expect(contraste(texto, relleno)).toBeGreaterThanOrEqual(CONTRASTE_TEXTO);
					expect(contraste(limite, referencias.tarjeta)).toBeGreaterThanOrEqual(CONTRASTE_LIMITE);
					expect(contraste(limite, referencias.fondo)).toBeGreaterThanOrEqual(CONTRASTE_LIMITE);
				}),
				{ numRuns: 2000 },
			);
		});
	}

	it('RF-270: devuelve siempre #rrggbb en minúsculas y el texto es un color del tema', () => {
		fc.assert(
			fc.property(colorArbitrario, (color) => {
				for (const tema of TEMAS) {
					const { relleno, limite, texto } = coloresCapsula(color)[tema];
					expect([relleno, limite, texto].every((valor) => HEX.test(valor))).toBe(true);
					expect([REFERENCIAS_TEMA[tema].tinta, REFERENCIAS_TEMA[tema].sobreAcento]).toContain(texto);
				}
			}),
		);
	});

	it('RF-270: es determinista y no distingue mayúsculas', () => {
		fc.assert(
			fc.property(colorArbitrario, (color) => {
				expect(coloresCapsula(color)).toEqual(coloresCapsula(color));
				expect(coloresCapsula(color.toUpperCase())).toEqual(coloresCapsula(color));
			}),
		);
	});

	it('RF-270: en tema oscuro el relleno no se apaga hasta el negro ni llega al blanco', () => {
		for (const color of ['#000000', '#ffffff', '#050505', '#fafafa']) {
			const { relleno } = coloresCapsula(color).oscuro;
			expect(contraste(relleno, '#000000')).toBeGreaterThan(1.5);
			expect(contraste(relleno, '#ffffff')).toBeGreaterThan(1.5);
		}
	});

	it('CA-270: una muestra de colores (blancos, negros, grises, saturados y casi iguales al fondo) cumple en los dos temas', () => {
		const muestra = [
			'#ffffff',
			'#000000',
			'#808080',
			'#ff0000',
			'#00ff00',
			'#0000ff',
			'#ffff00',
			'#ff00ff',
			'#00ffff',
			'#f5ece1',
			'#fcf8f3',
			'#1c1714',
			'#2a221d',
		];
		for (const color of muestra) {
			for (const tema of TEMAS) {
				const { relleno, limite, texto } = coloresCapsula(color)[tema];
				expect(contraste(texto, relleno), `${color} ${tema} texto`).toBeGreaterThanOrEqual(CONTRASTE_TEXTO);
				expect(contraste(limite, REFERENCIAS_TEMA[tema].tarjeta), `${color} ${tema} límite`).toBeGreaterThanOrEqual(CONTRASTE_LIMITE);
			}
		}
	});

	it('un color que ya cumple en tema claro conserva su relleno', () => {
		expect(coloresCapsula('#3b2a6b').claro.relleno).toBe('#3b2a6b');
	});
});
