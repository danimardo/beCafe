import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { ordenarSegunVisita } from './orden-visita';

// CA-258, RF-258: el orden de Inicio no cambia durante la visita.
const tipo = (id: string, consumos = 0) => ({ id, consumos });
const ids = (lista: readonly { id: string }[]) => lista.map((t) => t.id);

describe('orden de la visita en Inicio (CA-258, RF-258)', () => {
	it('CA-258: la tarjeta pulsada conserva su puesto aunque ahora sea la más consumida', () => {
		const alEntrar = [tipo('lungo', 9), tipo('ristretto', 5), tipo('vainilla', 2)];
		const orden = ids(alEntrar);
		// Tras un café de ristretto, el servidor lo ordenaría el primero (RN-090).
		const trasElCafe = [tipo('ristretto', 10), tipo('lungo', 9), tipo('vainilla', 2)];

		expect(ids(ordenarSegunVisita(orden, trasElCafe))).toEqual(['lungo', 'ristretto', 'vainilla']);
	});

	it('conserva los datos nuevos del servidor, solo cambia el puesto', () => {
		const resultado = ordenarSegunVisita(['a', 'b'], [tipo('b', 7), tipo('a', 3)]);

		expect(resultado).toEqual([tipo('a', 3), tipo('b', 7)]);
	});

	it('un tipo que aparece durante la visita va al final, en el orden del servidor', () => {
		expect(ids(ordenarSegunVisita(['a', 'b'], [tipo('n2'), tipo('b'), tipo('n1'), tipo('a')]))).toEqual(['a', 'b', 'n2', 'n1']);
	});

	it('un tipo que desaparece se quita sin mover los demás', () => {
		expect(ids(ordenarSegunVisita(['a', 'b', 'c'], [tipo('c'), tipo('a')]))).toEqual(['a', 'c']);
	});

	it('sin orden inicial, deja el orden del servidor', () => {
		expect(ids(ordenarSegunVisita([], [tipo('x'), tipo('y')]))).toEqual(['x', 'y']);
	});

	it('CA-258 (propiedades): los conocidos mantienen su orden inicial, los nuevos van al final y no se pierde ni repite ninguno', () => {
		const identificador = fc.string({ minLength: 1, maxLength: 4 });
		fc.assert(
			fc.property(fc.uniqueArray(identificador, { maxLength: 8 }), fc.uniqueArray(identificador, { maxLength: 8 }), (inicial, actual) => {
				const resultado = ids(
					ordenarSegunVisita(
						inicial,
						actual.map((id) => tipo(id)),
					),
				);
				const conocidos = inicial.filter((id) => actual.includes(id));
				const nuevos = actual.filter((id) => !inicial.includes(id));

				expect(resultado).toEqual([...conocidos, ...nuevos]);
				expect(new Set(resultado).size).toBe(actual.length);
			}),
		);
	});
});
