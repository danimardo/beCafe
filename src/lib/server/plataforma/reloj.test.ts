import { describe, expect, it } from 'vitest';
import { crearRelojFijo } from './reloj';

describe('reloj fijo (constitución VIII)', () => {
	it('avanza solo cuando la prueba lo pide', () => {
		const reloj = crearRelojFijo('2026-10-21T09:00:00.000Z');
		expect(reloj.ahora()).toBe('2026-10-21T09:00:00.000Z');
		reloj.avanzar(60_000);
		expect(reloj.ahora()).toBe('2026-10-21T09:01:00.000Z');
	});
});
