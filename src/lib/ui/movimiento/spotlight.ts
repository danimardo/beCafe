import type { Action } from 'svelte/action';
import { movimientoReducido, punteroFino } from './preferencias';

/**
 * Brillo de borde que sigue al puntero (RF-235). Solo con puntero fino y sin movimiento reducido. Escribe
 * `--spot-x` y `--spot-y` en el elemento; el dibujo (`::before` con máscara) está en `app.css`. No usa estado de Svelte
 * por movimiento y nunca se aplica a superficies de cristal.
 */
export const spotlight: Action<HTMLElement, boolean | undefined> = (nodo, activo = true) => {
	if (!activo || !punteroFino() || movimientoReducido()) return;
	nodo.classList.add('spotlight');
	const alMover = (evento: PointerEvent) => {
		const caja = nodo.getBoundingClientRect();
		nodo.style.setProperty('--spot-x', `${evento.clientX - caja.left}px`);
		nodo.style.setProperty('--spot-y', `${evento.clientY - caja.top}px`);
	};
	const alEntrar = () => nodo.setAttribute('data-spotlight-activo', '');
	const alSalir = () => nodo.removeAttribute('data-spotlight-activo');
	nodo.addEventListener('pointermove', alMover);
	nodo.addEventListener('pointerenter', alEntrar);
	nodo.addEventListener('pointerleave', alSalir);
	return {
		destroy: () => {
			nodo.removeEventListener('pointermove', alMover);
			nodo.removeEventListener('pointerenter', alEntrar);
			nodo.removeEventListener('pointerleave', alSalir);
			nodo.classList.remove('spotlight');
		},
	};
};
