/**
 * Orden de las cápsulas en Inicio (RN-090): de más a menos consumos vigentes de la persona en los últimos 30 días; si no tiene
 * ninguno, de más a menos consumos del departamento en ese periodo; a igualdad, por nombre normalizado. Función pura: no muta la entrada.
 */
export function ordenarTiposInicio<T extends { id: string; nombreNormalizado: string }>(
	tipos: readonly T[],
	propios: ReadonlyMap<string, number>,
	departamento: ReadonlyMap<string, number>,
): T[] {
	const tieneConsumosPropios = tipos.some((tipo) => (propios.get(tipo.id) ?? 0) > 0);
	const consumos = tieneConsumosPropios ? propios : departamento;
	return [...tipos].sort((a, b) => {
		const diferencia = (consumos.get(b.id) ?? 0) - (consumos.get(a.id) ?? 0);
		if (diferencia !== 0) return diferencia;
		if (a.nombreNormalizado < b.nombreNormalizado) return -1;
		if (a.nombreNormalizado > b.nombreNormalizado) return 1;
		return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
	});
}
