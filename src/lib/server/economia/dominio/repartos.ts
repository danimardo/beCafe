// Reparto exacto de un importe entre miembros (RN-014, RN-015, INV-01). Sin reloj; el azar entra por parámetro.

/** Fuente de azar mínima. `plataforma/azar.ts` la implementa; `dominio/` no importa la plataforma. */
export type FuenteAzar = { entero(maximoExclusivo: number): number };

export type Parte = { usuarioId: string; importe: number };

/**
 * Reparte `importe` (céntimos, con signo) entre `miembros` (RN-014). `base = |importe| ÷ n` y los `resto` céntimos
 * sobrantes se asignan a miembros elegidos al azar, sin repetir. El signo se aplica a todos. Con importe 0 no hay reparto.
 * Con un miembro, recibe todo. La suma de las partes es exactamente `importe` (INV-01).
 */
export function repartir(importe: number, miembros: readonly string[], azar: FuenteAzar): Parte[] {
	if (!Number.isInteger(importe)) throw new RangeError('El importe de un reparto debe ser entero');
	if (miembros.length === 0) throw new RangeError('Un reparto necesita al menos un miembro');
	if (importe === 0) return [];

	const signo = importe < 0 ? -1 : 1;
	const magnitud = Math.abs(importe);
	const n = miembros.length;
	const base = Math.floor(magnitud / n);
	const resto = magnitud % n;

	const pendientes = [...miembros];
	const conCentimoExtra = new Set<string>();
	for (let i = 0; i < resto; i++) {
		// `resto < n`: el pool nunca queda vacío antes de repartir todos los céntimos.
		const [elegido] = pendientes.splice(azar.entero(pendientes.length), 1);
		conCentimoExtra.add(elegido);
	}

	return miembros.map((usuarioId) => ({
		usuarioId,
		importe: signo * (base + (conCentimoExtra.has(usuarioId) ? 1 : 0)),
	}));
}
