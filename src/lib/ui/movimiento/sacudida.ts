import type { Action } from 'svelte/action';
import { movimientoReducido } from './preferencias';

/**
 * Sacude un campo una vez cada vez que aparece un error nuevo (RF-233). El parámetro es el mensaje de error:
 * la clase se quita y se vuelve a poner para reiniciar la animación. Con movimiento reducido no hace nada.
 */
export const sacudida: Action<HTMLElement, string | undefined> = (nodo, error) => {
	const sacudir = (mensaje: string | undefined) => {
		if (!mensaje || movimientoReducido()) return;
		nodo.classList.remove('campo-sacudida');
		nodo.getBoundingClientRect();
		nodo.classList.add('campo-sacudida');
	};
	const alTerminar = () => nodo.classList.remove('campo-sacudida');
	nodo.addEventListener('animationend', alTerminar);
	sacudir(error);
	return {
		update: sacudir,
		destroy: () => nodo.removeEventListener('animationend', alTerminar),
	};
};
