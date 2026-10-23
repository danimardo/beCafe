import { describe, expect, it } from 'vitest';
import { esquemaMes, type Mes } from '#lib/shared/fechas/tipos';
import { limitesDePeriodo, mesesDelPeriodo, rellenarMeses } from './periodos';

// Plan F5 D9 y tarea T003: periodos mes, año y todo; meses sin datos con 0 y año sin datos.
const mes = (texto: string): Mes => esquemaMes.parse(texto);

describe('limitesDePeriodo', () => {
	it('mes: devuelve el intervalo del mes de Madrid', () => {
		expect(limitesDePeriodo({ tipo: 'mes', mes: mes('2026-10') }, mes('2026-01'), mes('2026-10'))).toEqual({
			desde: '2026-09-30T22:00:00.000Z',
			hasta: '2026-10-31T23:00:00.000Z',
		});
	});

	it('año: devuelve el año natural aunque no tenga consumos', () => {
		expect(limitesDePeriodo({ tipo: 'anio', anio: 2024 }, null, mes('2026-10'))).toEqual({
			desde: '2023-12-31T23:00:00.000Z',
			hasta: '2024-12-31T23:00:00.000Z',
		});
	});

	it('todo: va del primer mes con consumos al final del mes actual', () => {
		expect(limitesDePeriodo({ tipo: 'todo' }, mes('2026-03'), mes('2026-10'))).toEqual({
			desde: '2026-02-28T23:00:00.000Z',
			hasta: '2026-10-31T23:00:00.000Z',
		});
	});

	it('todo sin consumos: devuelve null (vacío)', () => {
		expect(limitesDePeriodo({ tipo: 'todo' }, null, mes('2026-10'))).toBeNull();
	});
});

describe('rellenarMeses', () => {
	it('los meses sin dato valen 0 y conservan el orden', () => {
		const serie = new Map<Mes, number>([[mes('2026-02'), 350]]);
		expect(rellenarMeses(serie, [mes('2026-01'), mes('2026-02'), mes('2026-03')])).toEqual([
			{ mes: '2026-01', valor: 0 },
			{ mes: '2026-02', valor: 350 },
			{ mes: '2026-03', valor: 0 },
		]);
	});

	it('un año sin datos da doce ceros', () => {
		const meses = mesesDelPeriodo(mes('2024-01'), mes('2024-12'));
		expect(rellenarMeses(new Map(), meses).every((fila) => fila.valor === 0)).toBe(true);
		expect(meses).toHaveLength(12);
	});

	it('todo sin consumos no genera meses', () => {
		expect(mesesDelPeriodo(null, mes('2026-10'))).toEqual([]);
	});
});
