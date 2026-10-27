import { describe, expect, it } from 'vitest';
import { esquemaCapsula, TAMANO_MAXIMO_FOTO } from './capsulas';

// Datos de un formulario tal como llegan del navegador: todo es texto o un archivo.
function formulario(extra: Record<string, unknown> = {}): Record<string, unknown> {
	return { nombre: 'Ristretto', marca: 'Marca', intensidad: '9', color: 'cap-ristretto', umbralMinimo: '5', foto: '', ...extra };
}

describe('esquema de tipos de cápsula (RF-001, RF-005)', () => {
	it('acepta un formulario completo y convierte la intensidad y el umbral a enteros', () => {
		const resultado = esquemaCapsula.safeParse(formulario());
		expect(resultado.success).toBe(true);
		expect(resultado.success && resultado.data.intensidad).toBe(9);
		expect(resultado.success && resultado.data.umbralMinimo).toBe(5);
	});

	it('el umbral es obligatorio: un campo vacío se rechaza y no se toma como 0', () => {
		const resultado = esquemaCapsula.safeParse(formulario({ umbralMinimo: '' }));
		expect(resultado.success).toBe(false);
	});

	it('el umbral no puede ser negativo', () => {
		expect(esquemaCapsula.safeParse(formulario({ umbralMinimo: '-1' })).success).toBe(false);
	});

	it('la intensidad es opcional: vacía no se rechaza, y fuera de 1 a 13 sí', () => {
		expect(esquemaCapsula.safeParse(formulario({ intensidad: '' })).success).toBe(true);
		expect(esquemaCapsula.safeParse(formulario({ intensidad: '14' })).success).toBe(false);
	});

	it('CA-271: el color es un token fijo o un color propio #rrggbb; cualquier otro valor se rechaza en el campo color', () => {
		expect(esquemaCapsula.safeParse(formulario({ color: 'cap-lungo' })).success).toBe(true);
		expect(esquemaCapsula.safeParse(formulario({ color: 'cap-rosa' })).success).toBe(true);
		for (const color of ['#ff0000', 'rojo', 'cap-inexistente', '', 'otro']) {
			const resultado = esquemaCapsula.safeParse(formulario({ color }));
			expect(resultado.success, color).toBe(false);
			expect(!resultado.success && resultado.error.issues[0]?.path[0]).toBe('color');
		}
	});

	it('CA-271: «Otro color» toma el valor del selector, solo si es #rrggbb de 6 cifras, y lo guarda en minúsculas', () => {
		const bueno = esquemaCapsula.safeParse(formulario({ color: 'otro', colorPropio: '#A1B2C3' }));
		expect(bueno.success && bueno.data.color).toBe('#a1b2c3');
		for (const colorPropio of ['#abc', '#abcdefg', 'a1b2c3', '#a1b2c3ff', 'rgb(1,2,3)', '', undefined]) {
			expect(esquemaCapsula.safeParse(formulario({ color: 'otro', colorPropio })).success, String(colorPropio)).toBe(false);
		}
	});

	it('CA-271: colorPropio no se acepta suelto: sin «Otro color», se ignora y manda el token', () => {
		const resultado = esquemaCapsula.safeParse(formulario({ color: 'cap-azul', colorPropio: '#000000' }));
		expect(resultado.success && resultado.data.color).toBe('cap-azul');
	});

	it('CA-005: una foto de más de 5 MB se rechaza', () => {
		const grande = new File([new Uint8Array(TAMANO_MAXIMO_FOTO + 1)], 'grande.jpg', { type: 'image/jpeg' });
		expect(esquemaCapsula.safeParse(formulario({ foto: grande })).success).toBe(false);
	});

	it('un archivo sin elegir (vacío) se trata como ausente', () => {
		const vacio = new File([], '', { type: 'application/octet-stream' });
		const resultado = esquemaCapsula.safeParse(formulario({ foto: vacio }));
		expect(resultado.success && resultado.data.foto).toBeUndefined();
	});

	it('no admite campos desconocidos en la entrada de la página', () => {
		expect(esquemaCapsula.safeParse(formulario({ precio: '1' })).success).toBe(false);
	});
});
