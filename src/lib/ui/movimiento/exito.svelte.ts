const VISIBLE_MS = 1200;

/**
 * Estado «guardado» de un botón (RF-236): la página lo activa solo cuando el servidor confirma el guardado
 * (`result.type === 'success'`) y se apaga a los 1,2 s. Un guardado rechazado nunca lo activa.
 */
export function crearExito() {
	let activo = $state(false);
	let temporizador: ReturnType<typeof setTimeout> | undefined;
	return {
		get activo() {
			return activo;
		},
		marcar() {
			clearTimeout(temporizador);
			activo = true;
			temporizador = setTimeout(() => (activo = false), VISIBLE_MS);
		},
	};
}
