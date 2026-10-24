// Elección del aguador del mes (plan F8 D5, RN-084, RN-085). Función pura: sin base de datos, sin reloj.

export type ConteoPersona = { usuarioId: string; rellenos: number };

/**
 * Personas con el máximo de rellenos entre las activas. Empate: todas. Ningún relleno en el mes: lista vacía.
 * Las personas de baja cuentan en el ranking, pero no optan al título (RN-085): solo se consideran las `activos`.
 */
export function elegirAguadores(conteos: readonly ConteoPersona[], activos: ReadonlySet<string>): ConteoPersona[] {
	const candidatos = conteos.filter((conteo) => activos.has(conteo.usuarioId) && conteo.rellenos > 0);
	if (candidatos.length === 0) return [];
	const maximo = Math.max(...candidatos.map((conteo) => conteo.rellenos));
	return candidatos.filter((conteo) => conteo.rellenos === maximo);
}
