import { describe, expect, it } from 'vitest';
import { formatDate } from './formato';

describe('fechas en español', () => {
	it('muestra día y mes abreviado sin punto', () => {
		expect(formatDate('2026-10-20T12:00:00Z')).toBe('20 oct');
	});

	it('añade el año cuando se pide', () => {
		expect(formatDate(new Date('2026-10-20T12:00:00Z'), true)).toBe('20 oct 2026');
	});
});
