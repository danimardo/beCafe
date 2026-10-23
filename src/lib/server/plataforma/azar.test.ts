import { describe, expect, it } from 'vitest';
import { azarReal, crearAzarFijo } from './azar';

describe('azar', () => {
	it('azarReal devuelve enteros dentro del rango pedido', () => {
		for (let i = 0; i < 200; i++) {
			const valor = azarReal.entero(3);
			expect(Number.isInteger(valor) && valor >= 0 && valor < 3).toBe(true);
		}
	});

	it('crearAzarFijo devuelve los valores en orden', () => {
		const azar = crearAzarFijo([2, 0, 1]);
		expect([azar.entero(3), azar.entero(3), azar.entero(3)]).toEqual([2, 0, 1]);
	});

	it('crearAzarFijo falla si se agota o si el valor queda fuera de rango', () => {
		expect(() => crearAzarFijo([]).entero(2)).toThrow('AZAR_AGOTADO');
		expect(() => crearAzarFijo([2]).entero(2)).toThrow('AZAR_FUERA_DE_RANGO');
	});
});
