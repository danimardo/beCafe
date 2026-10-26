import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { ordenarTiposInicio } from './orden-inicio';

// RN-090, CA-245: orden de las cápsulas en Inicio.

const tipo = (id: string, nombreNormalizado: string) => ({ id, nombreNormalizado });
const mapa = (pares: [string, number][]) => new Map(pares);

const arbTipos = fc
	.uniqueArray(fc.integer({ min: 0, max: 30 }), { minLength: 1, maxLength: 12 })
	.map((ids) => ids.map((n) => tipo(`t${n}`, `nombre${n % 5}`)));
const arbConteos = (tipos: { id: string }[]) =>
	fc
		.array(fc.integer({ min: 0, max: 6 }), { minLength: tipos.length, maxLength: tipos.length })
		.map((valores) => new Map(tipos.map((t, i) => [t.id, valores[i] ?? 0])));

describe('ordenarTiposInicio (RN-090, CA-245)', () => {
	it('CA-245: ordena por consumos propios de más a menos', () => {
		const tipos = [tipo('a', 'alfa'), tipo('b', 'beta'), tipo('c', 'gamma')];

		const resultado = ordenarTiposInicio(
			tipos,
			mapa([
				['b', 5],
				['c', 2],
				['a', 1],
			]),
			mapa([['a', 99]]),
		);

		expect(resultado.map((t) => t.id)).toEqual(['b', 'c', 'a']);
	});

	it('CA-245: sin consumos propios ordena por los del departamento', () => {
		const tipos = [tipo('a', 'alfa'), tipo('b', 'beta'), tipo('c', 'gamma')];

		const resultado = ordenarTiposInicio(
			tipos,
			mapa([]),
			mapa([
				['c', 7],
				['a', 3],
			]),
		);

		expect(resultado.map((t) => t.id)).toEqual(['c', 'a', 'b']);
	});

	it('CA-245: a igualdad, por nombre normalizado', () => {
		const tipos = [tipo('x', 'zeta'), tipo('y', 'alfa'), tipo('z', 'mu')];

		expect(ordenarTiposInicio(tipos, mapa([]), mapa([])).map((t) => t.nombreNormalizado)).toEqual(['alfa', 'mu', 'zeta']);
	});

	it('CA-245: no muta la entrada', () => {
		const tipos = [tipo('a', 'beta'), tipo('b', 'alfa')];

		ordenarTiposInicio(tipos, mapa([['b', 1]]), mapa([]));

		expect(tipos.map((t) => t.id)).toEqual(['a', 'b']);
	});

	it('CA-245: es una permutación de la entrada', () => {
		fc.assert(
			fc.property(
				arbTipos.chain((tipos) => fc.tuple(fc.constant(tipos), arbConteos(tipos), arbConteos(tipos))),
				([tipos, propios, departamento]) => {
					const resultado = ordenarTiposInicio(tipos, propios, departamento);
					expect(resultado.map((t) => t.id).sort()).toEqual(tipos.map((t) => t.id).sort());
				},
			),
		);
	});

	it('CA-245: con consumos propios, el primero tiene el máximo propio; sin ellos, el máximo del departamento', () => {
		fc.assert(
			fc.property(
				arbTipos.chain((tipos) => fc.tuple(fc.constant(tipos), arbConteos(tipos), arbConteos(tipos))),
				([tipos, propios, departamento]) => {
					const hayPropios = [...propios.values()].some((n) => n > 0);
					const base = hayPropios ? propios : departamento;
					const primero = ordenarTiposInicio(tipos, propios, departamento)[0];
					expect(base.get(primero.id)).toBe(Math.max(...base.values()));
				},
			),
		);
	});

	it('CA-245: los empates quedan en orden alfabético y el resultado es idempotente', () => {
		fc.assert(
			fc.property(
				arbTipos.chain((tipos) => fc.tuple(fc.constant(tipos), arbConteos(tipos), arbConteos(tipos))),
				([tipos, propios, departamento]) => {
					const una = ordenarTiposInicio(tipos, propios, departamento);
					const base = [...propios.values()].some((n) => n > 0) ? propios : departamento;
					una.slice(1).forEach((actual, i) => {
						const anterior = una[i];
						if (base.get(anterior.id) === base.get(actual.id)) {
							expect(anterior.nombreNormalizado <= actual.nombreNormalizado).toBe(true);
						}
					});
					expect(ordenarTiposInicio(una, propios, departamento)).toEqual(una);
				},
			),
		);
	});
});
