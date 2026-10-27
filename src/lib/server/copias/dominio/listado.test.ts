import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { COPIAS_POR_PAGINA, LIMITE_COPIAS_LISTADO, unificarCopias } from './listado';

function bucket(indice: number) {
	const instante = new Date(Date.UTC(2026, 9, 1, 3, 0, 0) + indice * 3_600_000).toISOString();
	return {
		clave: `becafe-${instante}.tar.gz`,
		tamano: 1000 + indice,
		modificadaEn: instante,
		resguardo: false,
		origen: null,
		tipo: 'diaria' as const,
	};
}

describe('unificarCopias (RF-253)', () => {
	it('CA-253: con 20 copias, la primera página tiene 8, la tercera 4 y van de la más reciente a la más antigua', () => {
		const copias = Array.from({ length: 20 }, (_, i) => bucket(i));
		const primera = unificarCopias({ bucket: copias, locales: [], pagina: 1 });
		const tercera = unificarCopias({ bucket: copias, locales: [], pagina: 3 });
		expect(primera).toMatchObject({ pagina: 1, paginas: 3, total: 20 });
		expect(primera.filas).toHaveLength(COPIAS_POR_PAGINA);
		expect(tercera.filas).toHaveLength(4);
		expect(primera.filas[0]?.instante).toBe(bucket(19).modificadaEn);
	});

	it('CA-253: una copia fallida sale en el mismo listado, sin clave y ordenada por fecha; la correcta y la en curso no salen aparte', () => {
		const resultado = unificarCopias({
			bucket: [bucket(0), bucket(2)],
			locales: [
				{ id: 'F', iniciadaEn: bucket(1).modificadaEn, estado: 'fallida', tipo: 'manual', codigoError: 'S3_RED' },
				{ id: 'C', iniciadaEn: bucket(0).modificadaEn, estado: 'correcta', tipo: 'diaria', codigoError: null },
				{ id: 'E', iniciadaEn: bucket(3).modificadaEn, estado: 'en_curso', tipo: 'manual', codigoError: null },
			],
			pagina: 1,
		});
		expect(resultado.filas.map((fila) => [fila.id.slice(0, 1), fila.fallida, fila.clave === null])).toEqual([
			['b', false, false],
			['F', true, true],
			['b', false, false],
		]);
		expect(resultado.filas[1]).toMatchObject({ tipo: 'manual', codigoError: 'S3_RED', tamano: null });
	});

	it('CA-253: sin copias hay una página vacía y una página fuera de rango se acota', () => {
		expect(unificarCopias({ bucket: [], locales: [], pagina: 5 })).toEqual({ filas: [], pagina: 1, paginas: 1, total: 0 });
		const copias = Array.from({ length: 10 }, (_, i) => bucket(i));
		expect(unificarCopias({ bucket: copias, locales: [], pagina: 99 })).toMatchObject({ pagina: 2, paginas: 2 });
		expect(unificarCopias({ bucket: copias, locales: [], pagina: -3 })).toMatchObject({ pagina: 1 });
	});

	it('CA-253: propiedad: nunca más de 30 copias en total ni más de 8 por página, y el orden es descendente', () => {
		fc.assert(
			fc.property(fc.integer({ min: 0, max: 80 }), fc.integer({ min: -2, max: 12 }), (cuantas, pagina) => {
				const copias = Array.from({ length: cuantas }, (_, i) => bucket(i));
				const resultado = unificarCopias({ bucket: copias, locales: [], pagina });
				expect(resultado.total).toBeLessThanOrEqual(LIMITE_COPIAS_LISTADO);
				expect(resultado.filas.length).toBeLessThanOrEqual(COPIAS_POR_PAGINA);
				const instantes = resultado.filas.map((fila) => fila.instante);
				expect(instantes).toEqual([...instantes].sort().reverse());
			}),
		);
	});
});
