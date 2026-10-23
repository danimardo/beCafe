import { describe, expect, it } from 'vitest';
import { esquemaAportacion, esquemaImporte, lineasDesdeFormulario, esquemaCompra } from './economia';

const CLIENTE = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const TIPO = '01BX5ZZKBKACTAV9WEVGEMMVRY';

describe('contratos de economía', () => {
	it('CA-031: una aportación de 0, −3 y 500,01 € se rechaza; 500,00 € se acepta; tres decimales se rechazan', () => {
		const aportacion = (importe: string) => esquemaAportacion.safeParse({ clienteId: CLIENTE, importe });
		expect(aportacion('0').success).toBe(false);
		expect(aportacion('-3').success).toBe(false);
		expect(aportacion('500,01').success).toBe(false);
		expect(aportacion('500,00').success).toBe(true);
		expect(aportacion('17,123').success).toBe(false);
	});

	it('CA-031: el importe llega a céntimos enteros (17,50 → 1750)', () => {
		expect(esquemaImporte.safeParse('17,50')).toEqual({ success: true, data: 1750 });
		expect(esquemaImporte.safeParse('abc').success).toBe(false);
	});

	it('lineasDesdeFormulario empareja las listas por posición', () => {
		expect(lineasDesdeFormulario([TIPO], ['10'], ['4,00'])).toEqual([{ tipoCapsulaId: TIPO, cantidad: '10', importe: '4,00' }]);
	});

	it('una compra sin líneas se rechaza', () => {
		expect(esquemaCompra.safeParse({ clienteId: CLIENTE, lineas: [] }).success).toBe(false);
	});
});
