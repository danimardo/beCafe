import { describe, expect, it } from 'vitest';
import { esquemaConsultaEstadisticas, esquemaConsultaHistorial } from './estadisticas';

// Plan F5 y tarea T005: valores por defecto de las consultas y rechazo de claves desconocidas.
describe('esquemaConsultaHistorial', () => {
	it('usa los valores por defecto cuando la URL no trae parámetros', () => {
		expect(esquemaConsultaHistorial.parse({})).toEqual({ quien: 'todo', tipo: 'todos', pagina: 1 });
	});

	it('convierte la página de texto y acepta «anulados» marcado', () => {
		expect(esquemaConsultaHistorial.parse({ pagina: '3', anulados: 'on' })).toEqual({
			quien: 'todo',
			tipo: 'todos',
			anulados: 'on',
			pagina: 3,
		});
	});

	it('rechaza una clave desconocida y una página menor que 1', () => {
		expect(esquemaConsultaHistorial.safeParse({ orden: 'asc' }).success).toBe(false);
		expect(esquemaConsultaHistorial.safeParse({ pagina: '0' }).success).toBe(false);
	});
});

describe('esquemaConsultaEstadisticas', () => {
	it('por defecto muestra mis datos del mes', () => {
		expect(esquemaConsultaEstadisticas.parse({})).toEqual({ vista: 'mias', periodo: 'mes' });
	});

	it('acepta un año y rechaza uno anterior a 2026', () => {
		expect(esquemaConsultaEstadisticas.parse({ periodo: 'anio', anio: '2026' }).anio).toBe(2026);
		expect(esquemaConsultaEstadisticas.safeParse({ periodo: 'anio', anio: '2025' }).success).toBe(false);
	});

	it('rechaza un mes con formato distinto de aaaa-mm', () => {
		expect(esquemaConsultaEstadisticas.safeParse({ mes: '2026/10' }).success).toBe(false);
	});
});
