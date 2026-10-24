import { describe, expect, it } from 'vitest';
import { formatDate, formatearHace } from './formato';

describe('fechas en español', () => {
	it('muestra día y mes abreviado sin punto', () => {
		expect(formatDate('2026-10-20T12:00:00Z')).toBe('20 oct');
	});

	it('añade el año cuando se pide', () => {
		expect(formatDate(new Date('2026-10-20T12:00:00Z'), true)).toBe('20 oct 2026');
	});
});

describe('formatearHace (RF-170)', () => {
	const AHORA = '2026-10-23T12:00:00.000Z';

	it('menos de un minuto es «hace un momento»', () => {
		expect(formatearHace('2026-10-23T11:59:30.000Z', AHORA)).toBe('hace un momento');
	});

	it('de 1 a 59 minutos cuenta minutos enteros', () => {
		expect(formatearHace('2026-10-23T11:40:00.000Z', AHORA)).toBe('hace 20 min');
		expect(formatearHace('2026-10-23T11:01:00.000Z', AHORA)).toBe('hace 59 min');
	});

	it('de 1 a 23 horas cuenta horas enteras', () => {
		expect(formatearHace('2026-10-23T09:00:00.000Z', AHORA)).toBe('hace 3 h');
	});

	it('a partir de un día cuenta días, en singular y en plural', () => {
		expect(formatearHace('2026-10-22T12:00:00.000Z', AHORA)).toBe('hace 1 día');
		expect(formatearHace('2026-10-20T12:00:00.000Z', AHORA)).toBe('hace 3 días');
	});
});
