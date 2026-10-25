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
