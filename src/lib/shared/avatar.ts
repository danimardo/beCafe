// Color estable de una persona sin foto (RF-209, CA-209). Mismo identificador, mismo color en todas las pantallas y dispositivos.
export const COLORES_AVATAR = 6;

/** Índice 0–5 del token `--avatar-N`: hash FNV-1a de 32 bits del identificador, módulo 6. */
export function colorAvatar(usuarioId: string): number {
	let hash = 0x811c9dc5;
	for (const caracter of usuarioId) {
		hash ^= caracter.codePointAt(0) ?? 0;
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash % COLORES_AVATAR;
}

export const ILUSTRACIONES_AVATAR = 8;

/**
 * Índice 0–7 de la ilustración de una persona sin foto (RF-222, CA-222): FNV-1a con otra semilla que `colorAvatar`,
 * para que el color y el dibujo no vayan siempre emparejados.
 */
export function ilustracionAvatar(usuarioId: string): number {
	let hash = 0x9e3779b1;
	for (const caracter of usuarioId) {
		hash ^= caracter.codePointAt(0) ?? 0;
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	// Se mezcla para que los bits bajos no dependan solo del último carácter.
	hash ^= hash >>> 15;
	hash = Math.imul(hash, 0x2c1b3c6d) >>> 0;
	hash ^= hash >>> 12;
	return (hash >>> 0) % ILUSTRACIONES_AVATAR;
}
