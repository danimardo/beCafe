import { esquemaInstanteUtc, instanteDesdeFecha, type InstanteUtc } from '#lib/shared/fechas/tipos';

// El reloj se recibe como parámetro: el dominio no lee el reloj del sistema (constitución VIII).
export type Reloj = { ahora(): InstanteUtc };

export const relojReal: Reloj = { ahora: () => instanteDesdeFecha(new Date()) };

export type RelojFijo = Reloj & { avanzar(milisegundos: number): void };

/** Reloj de pruebas: parte de un instante y solo avanza cuando la prueba lo pide. */
export function crearRelojFijo(inicio: string): RelojFijo {
	let actual = esquemaInstanteUtc.parse(inicio);
	return {
		ahora: () => actual,
		avanzar(milisegundos: number) {
			actual = instanteDesdeFecha(new Date(Date.parse(actual) + milisegundos));
		},
	};
}
