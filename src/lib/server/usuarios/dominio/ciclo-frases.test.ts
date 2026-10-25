import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { crearAzarFijo } from '#lib/server/plataforma';
import { siguienteFrase, type FuenteAzar } from './ciclo-frases';

// RN-088: una persona no repite frase hasta haberlas recibido todas; después empieza un ciclo nuevo.

const catalogo = (n: number): string[] => Array.from({ length: n }, (_, i) => `f${i}`);

/** Azar de propiedades: usa la semilla de fast-check y siempre devuelve un valor en rango. */
function azarDe(semillas: readonly number[]): FuenteAzar {
	let i = 0;
	return { entero: (maximo) => (semillas[i++ % semillas.length] ?? 0) % maximo };
}

/** Recorre `pasos` entregas como haría el servidor: acumula las del ciclo y lo reinicia al subir. */
function recorrer(lista: readonly string[], pasos: number, azar: FuenteAzar) {
	let ciclo = 1;
	let entregadas = new Set<string>();
	const resultado: { fraseId: string; ciclo: number }[] = [];
	for (let paso = 0; paso < pasos; paso += 1) {
		const siguiente = siguienteFrase(lista, entregadas, ciclo, azar);
		if (siguiente.ciclo !== ciclo) entregadas = new Set();
		ciclo = siguiente.ciclo;
		entregadas.add(siguiente.fraseId);
		resultado.push(siguiente);
	}
	return resultado;
}

describe('siguienteFrase (RN-088)', () => {
	it('CA-215: elige entre las que faltan del ciclo', () => {
		const elegida = siguienteFrase(['a', 'b', 'c'], new Set(['a', 'c']), 1, crearAzarFijo([0]));
		expect(elegida).toEqual({ fraseId: 'b', ciclo: 1 });
	});

	it('CA-215: con todas entregadas empieza el ciclo siguiente con todo el catálogo', () => {
		const elegida = siguienteFrase(['a', 'b'], new Set(['a', 'b']), 3, crearAzarFijo([1]));
		expect(elegida).toEqual({ fraseId: 'b', ciclo: 4 });
	});

	it('ignora las entregadas que ya no están en el catálogo', () => {
		const elegida = siguienteFrase(['a', 'b'], new Set(['a', 'retirada']), 1, crearAzarFijo([0]));
		expect(elegida).toEqual({ fraseId: 'b', ciclo: 1 });
	});

	it('rechaza un catálogo vacío', () => {
		expect(() => siguienteFrase([], new Set(), 1, crearAzarFijo([0]))).toThrow('CATALOGO_VACIO');
	});

	it('CA-215 (propiedad): n entregas seguidas no repiten y la n + 1 empieza otro ciclo', () => {
		fc.assert(
			fc.property(fc.integer({ min: 1, max: 80 }), fc.array(fc.nat(), { minLength: 1, maxLength: 50 }), (n, semillas) => {
				const lista = catalogo(n);
				const entregas = recorrer(lista, n + 1, azarDe(semillas));
				const primeras = entregas.slice(0, n);
				expect(new Set(primeras.map((e) => e.fraseId)).size).toBe(n);
				expect(primeras.every((e) => e.ciclo === 1)).toBe(true);
				expect(entregas[n]?.ciclo).toBe(2);
			}),
		);
	});

	it('nunca devuelve una frase fuera del catálogo (propiedad)', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 30 }),
				fc.integer({ min: 1, max: 100 }),
				fc.array(fc.nat(), { minLength: 1, maxLength: 20 }),
				(n, pasos, semillas) => {
					const lista = catalogo(n);
					for (const entrega of recorrer(lista, pasos, azarDe(semillas))) expect(lista).toContain(entrega.fraseId);
				},
			),
		);
	});
});
