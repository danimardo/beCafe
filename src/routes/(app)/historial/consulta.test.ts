import { describe, expect, it } from 'vitest';
import { normalizarConsulta } from './consulta';

// Tarea T013: una consulta inválida usa los valores por defecto y lo indica; no es un error de la página.
describe('normalizarConsulta de /historial', () => {
	it('sin parámetros usa «Todo», «todos», página 1 y sin anulados', () => {
		expect(normalizarConsulta({})).toEqual({
			consultaValida: true,
			consulta: { quien: 'todo', tipo: 'todos', pagina: 1 },
			filtros: { quien: 'todo', tipo: 'todos', anulados: false, pagina: 1 },
		});
	});

	it('traduce «anulados=on» y «quien=mios» a los filtros del servicio', () => {
		const { filtros, consultaValida } = normalizarConsulta({ quien: 'mios', anulados: 'on', pagina: '2' });
		expect(consultaValida).toBe(true);
		expect(filtros).toEqual({ quien: 'mios', tipo: 'todos', anulados: true, pagina: 2 });
	});

	it('una consulta inválida (parámetro desconocido) usa los valores por defecto y lo marca', () => {
		const resultado = normalizarConsulta({ quien: 'otros' });
		expect(resultado.consultaValida).toBe(false);
		expect(resultado.filtros).toEqual({ quien: 'todo', tipo: 'todos', anulados: false, pagina: 1 });
	});
});
