import { describe, expect, it } from 'vitest';
import { estaEnStockBajo, estimarDias } from './stock';

describe('stock bajo (RN-071, CA-020)', () => {
	it('CA-020: con umbral 10, el stock 11 no está en stock bajo; el 10 sí', () => {
		expect(estaEnStockBajo(11, 10)).toBe(false);
		expect(estaEnStockBajo(10, 10)).toBe(true);
	});

	it('CA-020: un stock negativo cuenta como stock bajo', () => {
		expect(estaEnStockBajo(-1, 10)).toBe(true);
	});

	it('CA-020: con umbral 0, solo el stock 0 o negativo está en stock bajo', () => {
		expect(estaEnStockBajo(1, 0)).toBe(false);
		expect(estaEnStockBajo(0, 0)).toBe(true);
	});
});

describe('estimación de días restantes (RN-073, CA-022)', () => {
	it('CA-022: con stock 30 y 60 consumos en 30 días, quedan 15 días', () => {
		expect(estimarDias(30, 60)).toEqual({ tipo: 'dias', dias: 15 });
	});

	it('CA-022: sin consumos en 30 días, «sin datos»', () => {
		expect(estimarDias(30, 0)).toEqual({ tipo: 'sin-datos' });
	});

	it('con stock 0 o negativo, 0 días aunque no haya consumos', () => {
		expect(estimarDias(0, 0)).toEqual({ tipo: 'dias', dias: 0 });
		expect(estimarDias(-3, 10)).toEqual({ tipo: 'dias', dias: 0 });
	});

	it('redondea hacia abajo los días', () => {
		expect(estimarDias(10, 40)).toEqual({ tipo: 'dias', dias: 7 });
	});
});
