import { describe, expect, it } from 'vitest';
import { normalizarConsultaEstadisticas } from './consulta';

// Tarea de F5: los campos vacíos de los filtros GET no invalidan la consulta (fallo encontrado en la prueba sin JavaScript).
describe('normalizarConsultaEstadisticas', () => {
	it('un año y un mes vacíos se ignoran y el periodo elegido se conserva', () => {
		const { consulta, consultaValida } = normalizarConsultaEstadisticas(new URLSearchParams('vista=mias&periodo=anio&mes=&anio='));
		expect(consultaValida).toBe(true);
		expect(consulta).toEqual({ vista: 'mias', periodo: 'anio' });
	});

	it('un año válido se aplica al periodo anual', () => {
		expect(normalizarConsultaEstadisticas(new URLSearchParams('periodo=anio&anio=2027')).consulta.anio).toBe(2027);
	});

	it('una clave desconocida invalida la consulta y usa los valores por defecto', () => {
		const { consulta, consultaValida } = normalizarConsultaEstadisticas(new URLSearchParams('periodo=anio&orden=asc'));
		expect(consultaValida).toBe(false);
		expect(consulta).toEqual({ vista: 'mias', periodo: 'mes' });
	});
});
