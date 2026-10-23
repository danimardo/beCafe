import { randomInt } from 'node:crypto';

// Azar del servidor (RN-014, constitución VIII). Solo este archivo usa `crypto.randomInt`: `dominio/` recibe el azar
// como parámetro y las pruebas lo sustituyen por uno fijo.

export type Azar = { entero(maximoExclusivo: number): number };

export const azarReal: Azar = {
	entero: (maximoExclusivo) => randomInt(maximoExclusivo),
};

/** Azar de prueba: devuelve los valores en orden. Si se agotan, lanza un error para que ninguna prueba dependa de un valor no fijado. */
export function crearAzarFijo(valores: readonly number[]): Azar {
	const pendientes = [...valores];
	return {
		entero(maximoExclusivo) {
			const valor = pendientes.shift();
			if (valor === undefined) throw new Error('AZAR_AGOTADO');
			if (valor < 0 || valor >= maximoExclusivo) throw new Error('AZAR_FUERA_DE_RANGO');
			return valor;
		},
	};
}
