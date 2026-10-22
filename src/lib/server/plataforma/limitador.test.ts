import { describe, expect, it } from 'vitest';
import { crearLimitador } from './limitador';

describe('límite de frecuencia con ventana fija (PEND-034)', () => {
	it('admite hasta el máximo en una ventana y vuelve a admitir al abrir otra', () => {
		const limitador = crearLimitador({ maximo: 3, ventanaMs: 60_000 });
		const instante = '2026-10-21T09:00:00.000Z';
		expect(limitador.admite('sesion-a', instante, 2)).toBe(true);
		expect(limitador.admite('sesion-a', instante, 2)).toBe(false);
		expect(limitador.admite('sesion-b', instante, 3)).toBe(true);
		expect(limitador.admite('sesion-a', '2026-10-21T09:01:00.000Z', 1)).toBe(true);
	});
});
