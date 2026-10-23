// Divisiones enteras con redondeo de mitad hacia arriba (RN-021, Clarifications 8 de la spec de F4). Sin E/S ni reloj.

/** `numerador / denominador` redondeado a entero, con los empates hacia arriba (hacia +∞). `denominador` debe ser > 0. */
export function dividirRedondeando(numerador: number, denominador: number): number {
	if (!Number.isInteger(numerador) || !Number.isInteger(denominador) || denominador <= 0) {
		throw new RangeError('dividirRedondeando exige enteros y un denominador positivo');
	}
	return Math.floor((2 * numerador + denominador) / (2 * denominador));
}
