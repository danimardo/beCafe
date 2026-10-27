// Orden de la visita en Inicio (plan F14 D3, RF-258, DEC-132). Inicio calcula el orden de RN-090 al entrar y lo conserva mientras la
// persona sigue en la pantalla: registrar, deshacer o actualizar los datos no cambia el puesto de ninguna tarjeta.

/**
 * Coloca `tipos` en el orden en que llegaron al entrar (`ordenInicial`). Un tipo que aparece durante la visita va al final,
 * en el orden en que lo envía el servidor; un tipo que desaparece se quita.
 */
export function ordenarSegunVisita<T extends { id: string }>(ordenInicial: readonly string[], tipos: readonly T[]): T[] {
	const porId = new Map(tipos.map((tipo) => [tipo.id, tipo]));
	const conocidos: T[] = [];
	for (const id of ordenInicial) {
		const tipo = porId.get(id);
		if (tipo) conocidos.push(tipo);
	}
	const vistos = new Set(ordenInicial);
	return [...conocidos, ...tipos.filter((tipo) => !vistos.has(tipo.id))];
}
