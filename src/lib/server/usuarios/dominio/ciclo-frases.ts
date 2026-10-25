// Ciclo de frases de Capsulito sin repetición por persona (RN-088). Función pura: el azar entra por parámetro.

/** Fuente de azar mínima. `plataforma/azar.ts` la implementa; `dominio/` no importa la plataforma. */
export type FuenteAzar = { entero(maximoExclusivo: number): number };

/**
 * Elige la siguiente frase de `catalogo` para una persona. `entregadas` son las del ciclo `cicloActual`.
 * Elige al azar entre las del catálogo aún no entregadas en el ciclo. Las entregadas que ya no están en el catálogo
 * se ignoran. Si no queda ninguna, empieza el ciclo siguiente con todo el catálogo.
 */
export function siguienteFrase(
	catalogo: readonly string[],
	entregadas: ReadonlySet<string>,
	cicloActual: number,
	azar: FuenteAzar,
): { fraseId: string; ciclo: number } {
	if (catalogo.length === 0) throw new Error('CATALOGO_VACIO');
	const disponibles = catalogo.filter((id) => !entregadas.has(id));
	const ciclo = disponibles.length === 0 ? cicloActual + 1 : cicloActual;
	const candidatas = disponibles.length === 0 ? catalogo : disponibles;
	const fraseId = candidatas.at(azar.entero(candidatas.length));
	if (fraseId === undefined) throw new Error('AZAR_FUERA_DE_RANGO');
	return { fraseId, ciclo };
}
