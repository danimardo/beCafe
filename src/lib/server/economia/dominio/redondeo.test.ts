import { describe, expect, it } from 'vitest';
import { dividirRedondeando } from './redondeo';

describe('dividirRedondeando (RN-021, mitad hacia arriba)', () => {
	it('redondea hacia arriba a partir de la mitad', () => {
		expect(dividirRedondeando(1, 2)).toBe(1);
		expect(dividirRedondeando(3, 2)).toBe(2);
		expect(dividirRedondeando(3550, 100)).toBe(36);
	});

	it('redondea hacia abajo por debajo de la mitad', () => {
		expect(dividirRedondeando(49, 100)).toBe(0);
		expect(dividirRedondeando(3483, 100)).toBe(35);
	});

	it('rechaza argumentos no enteros o denominadores no positivos', () => {
		expect(() => dividirRedondeando(1.5, 2)).toThrow(RangeError);
		expect(() => dividirRedondeando(1, 0)).toThrow(RangeError);
	});
});
