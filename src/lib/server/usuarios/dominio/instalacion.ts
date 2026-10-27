// Estado de instalación de la aplicación por persona (F16, RF-280). Función pura: sin base de datos ni reloj.

export type EstadoInstalacion = 'instalada' | 'rechazada';

/**
 * Transición del estado guardado al estado que llega. `instalada` es definitivo (no se detecta la desinstalación);
 * `rechazada` solo pasa a `instalada`; repetir un estado no cambia nada, tampoco su instante.
 */
export function siguienteEstadoInstalacion(
	actual: EstadoInstalacion | null,
	entrante: EstadoInstalacion,
): { estado: EstadoInstalacion; cambia: boolean } {
	if (actual === null) return { estado: entrante, cambia: true };
	if (actual === 'instalada' || actual === entrante) return { estado: actual, cambia: false };
	return { estado: entrante, cambia: true };
}
