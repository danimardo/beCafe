import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { crearAzarFijo } from '#lib/server/plataforma';
import { repartir } from './repartos';

// RN-014, RN-015, EV-020 e INV-01: la suma del reparto es exactamente el importe.

const miembros = (n: number): string[] => Array.from({ length: n }, (_, i) => `u${i}`);

describe('repartir (CA-081, EV-020)', () => {
	it('CA-081: −700 céntimos entre 6 miembros dan cuatro de −117 y dos de −116', () => {
		const partes = repartir(-700, miembros(6), crearAzarFijo([0, 0, 0, 0, 0, 0]));
		const importes = partes.map((p) => p.importe).sort((a, b) => a - b);
		expect(importes).toEqual([-117, -117, -117, -117, -116, -116]);
	});

	it('EV-020: 1 céntimo entre 10 personas lo recibe una sola', () => {
		const partes = repartir(1, miembros(10), crearAzarFijo([4]));
		expect(partes.filter((p) => p.importe === 1).map((p) => p.usuarioId)).toEqual(['u4']);
		expect(partes.reduce((suma, p) => suma + p.importe, 0)).toBe(1);
	});

	it('RN-014: con un único miembro, recibe todo el importe', () => {
		expect(repartir(-600, ['solo'], crearAzarFijo([]))).toEqual([{ usuarioId: 'solo', importe: -600 }]);
	});

	it('con importe 0 no hay reparto', () => {
		expect(repartir(0, miembros(3), crearAzarFijo([]))).toEqual([]);
	});

	it('rechaza un importe no entero o sin miembros', () => {
		expect(() => repartir(1.5, miembros(2), crearAzarFijo([]))).toThrow(RangeError);
		expect(() => repartir(100, [], crearAzarFijo([]))).toThrow(RangeError);
	});
});

describe('propiedades de INV-01 (EV-020)', () => {
	it('la suma de las partes es exactamente el importe', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: -1_000_000, max: 1_000_000 }),
				fc.integer({ min: 1, max: 12 }),
				fc.array(fc.integer({ min: 0, max: 11 }), { maxLength: 4 }),
				(importe, n, sorteos) => {
					const resto = Math.abs(importe) % n;
					const azar = crearAzarFijo(Array.from({ length: resto }, (_, i) => (sorteos[i] ?? 0) % (n - i)));
					const partes = repartir(importe, miembros(n), azar);
					expect(partes.reduce((suma, p) => suma + p.importe, 0)).toBe(importe);
				},
			),
		);
	});

	it('ninguna parte se aparta más de un céntimo de otra', () => {
		fc.assert(
			fc.property(fc.integer({ min: -100_000, max: 100_000 }), fc.integer({ min: 1, max: 12 }), (importe, n) => {
				const resto = Math.abs(importe) % n;
				const partes = repartir(importe, miembros(n), crearAzarFijo(Array.from({ length: resto }, () => 0)));
				const valores = partes.map((p) => p.importe);
				expect(Math.max(...valores) - Math.min(...valores)).toBeLessThanOrEqual(1);
			}),
		);
	});

	it('el signo del importe se aplica a todas las partes', () => {
		fc.assert(
			fc.property(fc.integer({ min: 1, max: 100_000 }), fc.integer({ min: 1, max: 8 }), (importe, n) => {
				const resto = importe % n;
				const partes = repartir(-importe, miembros(n), crearAzarFijo(Array.from({ length: resto }, () => 0)));
				expect(partes.every((p) => p.importe <= 0)).toBe(true);
			}),
		);
	});
});
