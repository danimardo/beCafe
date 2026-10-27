import { describe, expect, it } from 'vitest';
import { CICLO_REPOSO_SEGUNDOS, GESTOS, GESTOS_REPOSO, PARPADEO_SEGUNDOS, gestoEn, gestoVigente } from './reposo';

describe('gestos de reposo de Capsulito (RF-248, RF-259)', () => {
	it('CA-259: a los 4, 9,5, 15, 20,5 y 26 segundos toca mirar, el pie, el bostezo con la mano, el reloj y el bostezo', () => {
		expect(gestoEn(4)).toBe('mirarLados');
		expect(gestoEn(9.5)).toBe('pie');
		expect(gestoEn(15)).toBe('bostezoMano');
		expect(gestoEn(20.5)).toBe('tocarReloj');
		expect(gestoEn(26)).toBe('bostezo');
	});

	it('CA-259: del primer gesto al último pasan 22 segundos', () => {
		const segundos = GESTOS_REPOSO.map((gesto) => gesto.segundo);
		expect((segundos.at(-1) ?? 0) - (segundos[0] ?? 0)).toBe(22);
	});

	it('CA-259: hay cinco gestos distintos, uno por entrada del ciclo', () => {
		expect(GESTOS).toHaveLength(5);
		expect(GESTOS_REPOSO.map((gesto) => gesto.gesto)).toEqual([...GESTOS]);
	});

	it('CA-259: en cualquier otro instante no toca ningún gesto', () => {
		for (const segundo of [0, 1, 3.5, 4.5, 5, 9, 10, 14.5, 15.5, 20, 21, 25.5, 27, 28.5]) expect(gestoEn(segundo)).toBeNull();
		expect(gestoEn(4.2)).toBeNull();
	});

	it('CA-259: el ciclo vuelve a empezar a los 29 s', () => {
		expect(CICLO_REPOSO_SEGUNDOS).toBe(29);
		expect(gestoEn(33)).toBe('mirarLados');
		expect(gestoEn(38.5)).toBe('pie');
		expect(gestoEn(44)).toBe('bostezoMano');
		expect(gestoEn(49.5)).toBe('tocarReloj');
		expect(gestoEn(55)).toBe('bostezo');
	});

	it('CA-259: es una función pura del tiempo: no depende del azar ni de llamadas anteriores', () => {
		const instantes = Array.from({ length: 140 }, (_, i) => i / 2);
		expect(instantes.map(gestoEn)).toEqual(instantes.map(gestoEn));
	});

	it('los gestos van en orden de impaciencia creciente, no se solapan y el último termina dentro del ciclo', () => {
		const segundos = GESTOS_REPOSO.map((gesto) => gesto.segundo);
		expect(segundos).toEqual([...segundos].sort((a, b) => a - b));
		for (const [i, siguiente] of GESTOS_REPOSO.slice(1).entries()) {
			const actual = GESTOS_REPOSO[i];
			expect(actual.segundo + actual.duracion).toBeLessThanOrEqual(siguiente.segundo);
		}
		const finales = GESTOS_REPOSO.map((gesto) => gesto.segundo + gesto.duracion);
		expect(Math.max(...finales)).toBeLessThanOrEqual(CICLO_REPOSO_SEGUNDOS);
	});

	it('un tiempo no válido no produce gesto y el parpadeo es cada 3 s', () => {
		expect(gestoEn(-1)).toBeNull();
		expect(gestoEn(Number.NaN)).toBeNull();
		expect(PARPADEO_SEGUNDOS).toBe(3);
	});

	it('CA-259: el gesto está vigente durante su duración y después Capsulito vuelve a estar quieta', () => {
		expect(gestoVigente(4)).toBe('mirarLados');
		expect(gestoVigente(5.1)).toBe('mirarLados');
		expect(gestoVigente(5.2)).toBeNull();
		expect(gestoVigente(10)).toBe('pie');
		expect(gestoVigente(16.5)).toBe('bostezoMano');
		expect(gestoVigente(21)).toBe('tocarReloj');
		expect(gestoVigente(27.9)).toBe('bostezo');
		expect(gestoVigente(3.9)).toBeNull();
		expect(gestoVigente(33)).toBe('mirarLados');
		expect(gestoVigente(-1)).toBeNull();
	});
});
