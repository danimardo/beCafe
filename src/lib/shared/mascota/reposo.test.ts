import { describe, expect, it } from 'vitest';
import { CICLO_REPOSO_SEGUNDOS, GESTOS_REPOSO, PARPADEO_SEGUNDOS, gestoEn, gestoVigente } from './reposo';

describe('gestos de reposo de Capsulito (RF-248)', () => {
	it('CA-248: a los 6, 12, 16 y 21 segundos toca mirar a los lados, el pie, el reloj y el bostezo', () => {
		expect(gestoEn(6)).toBe('mirarLados');
		expect(gestoEn(12)).toBe('pie');
		expect(gestoEn(16)).toBe('reloj');
		expect(gestoEn(21)).toBe('bostezo');
	});

	it('CA-248: en cualquier otro segundo no toca ningún gesto', () => {
		for (const segundo of [0, 1, 5, 7, 11, 13, 15, 17, 20, 22]) expect(gestoEn(segundo)).toBeNull();
	});

	it('CA-248: el ciclo vuelve a empezar al terminar el bostezo (29 s es el 6 del ciclo siguiente)', () => {
		expect(CICLO_REPOSO_SEGUNDOS).toBe(23);
		expect(gestoEn(29)).toBe('mirarLados');
		expect(gestoEn(35)).toBe('pie');
		expect(gestoEn(39)).toBe('reloj');
		expect(gestoEn(44)).toBe('bostezo');
	});

	it('CA-248: es una función pura del tiempo: no depende del azar ni de llamadas anteriores', () => {
		const primera = Array.from({ length: 70 }, (_, segundo) => gestoEn(segundo));
		const segunda = Array.from({ length: 70 }, (_, segundo) => gestoEn(segundo));
		expect(segunda).toEqual(primera);
	});

	it('los gestos van en orden de impaciencia creciente y el último termina dentro del ciclo', () => {
		const segundos = GESTOS_REPOSO.map((gesto) => gesto.segundo);
		expect(segundos).toEqual([...segundos].sort((a, b) => a - b));
		const ultimo = GESTOS_REPOSO.at(-1);
		expect(ultimo && ultimo.segundo + ultimo.duracion).toBeLessThanOrEqual(CICLO_REPOSO_SEGUNDOS);
	});

	it('un tiempo no válido no produce gesto y el parpadeo es cada 3 s', () => {
		expect(gestoEn(-1)).toBeNull();
		expect(gestoEn(Number.NaN)).toBeNull();
		expect(PARPADEO_SEGUNDOS).toBe(3);
	});

	it('CA-248: el gesto está vigente durante su duración y después Capsulito vuelve a estar quieta', () => {
		expect(gestoVigente(6)).toBe('mirarLados');
		expect(gestoVigente(7.1)).toBe('mirarLados');
		expect(gestoVigente(7.2)).toBeNull();
		expect(gestoVigente(12.5)).toBe('pie');
		expect(gestoVigente(17.5)).toBe('reloj');
		expect(gestoVigente(22.9)).toBe('bostezo');
		expect(gestoVigente(5.9)).toBeNull();
		expect(gestoVigente(29)).toBe('mirarLados');
		expect(gestoVigente(-1)).toBeNull();
	});
});
