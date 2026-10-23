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

	it('el color debe ser de la paleta cerrada de cápsulas', () => {
		expect(esquemaCapsula.safeParse(formulario({ color: '#ff0000' })).success).toBe(false);
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
