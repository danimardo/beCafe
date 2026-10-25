import { describe, expect, it } from 'vitest';
import { campoImporteDe, erroresDeImporte, esquemaAportacion, esquemaImporte, lineasDesdeFormulario, esquemaCompra } from './economia';

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

	it('CA-197: las líneas con cantidad 0 o vacía se descartan y queda una compra de dos líneas', () => {
		const lineas = lineasDesdeFormulario([TIPO, CLIENTE, TIPO], ['0', '3', ' '], ['', '4,00', '']);
		expect(lineas).toEqual([{ tipoCapsulaId: CLIENTE, cantidad: '3', importe: '4,00' }]);
		expect(esquemaCompra.safeParse({ clienteId: CLIENTE, lineas }).success).toBe(true);
	});

	it('CA-197: todas las cantidades a 0 dejan la compra sin líneas y se rechaza; más de 999 también', () => {
		expect(esquemaCompra.safeParse({ clienteId: CLIENTE, lineas: lineasDesdeFormulario([TIPO], ['0'], ['']) }).success).toBe(false);
		const grande = lineasDesdeFormulario([TIPO], ['1000'], ['4,00']);
		expect(esquemaCompra.safeParse({ clienteId: CLIENTE, lineas: grande }).success).toBe(false);
	});

	it('CA-198: confirmar la hucha negativa exige el saldo confirmado', () => {
		const lineas = lineasDesdeFormulario([TIPO], ['1'], ['4,00']);
		expect(esquemaCompra.safeParse({ clienteId: CLIENTE, lineas, confirmarHuchaNegativa: 'si' }).success).toBe(false);
		const confirmada = esquemaCompra.safeParse({ clienteId: CLIENTE, lineas, confirmarHuchaNegativa: 'si', saldoConfirmado: '-150' });
		expect(confirmada.success && confirmada.data.saldoConfirmado).toBe(-150);
	});
});

describe('erroresDeImporte (RF-211)', () => {
	const tipoA = CLIENTE;
	const tipoB = TIPO;
	const lineas = [
		{ tipoCapsulaId: tipoA, cantidad: '16', importe: '' },
		{ tipoCapsulaId: tipoB, cantidad: '2', importe: 'abc' },
	];

	it('CA-211: traduce cada importe que falta o no vale al campo de su tipo', () => {
		const resultado = esquemaCompra.safeParse({ clienteId: tipoA, lineas });
		expect(resultado.success).toBe(false);
		const errores = erroresDeImporte(resultado.error?.issues ?? [], lineas, 'Falta el importe');
		expect(errores).toEqual({
			[campoImporteDe(tipoA)]: { codigo: 'IMPORTE_OBLIGATORIO', mensaje: 'Falta el importe' },
			[campoImporteDe(tipoB)]: { codigo: 'VALIDACION', mensaje: 'Escribe un importe en euros, como 17,50' },
		});
	});

	it('ignora las incidencias que no son de un importe de línea', () => {
		expect(
			erroresDeImporte(
				[
					{ path: ['lineas'], message: 'x' },
					{ path: ['clienteId'], message: 'y' },
				],
				lineas,
				'z',
			),
		).toEqual({});
	});
});
