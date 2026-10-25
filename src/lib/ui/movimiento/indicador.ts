import type { Action } from 'svelte/action';

/**
 * Indicador deslizante de un grupo de opciones (RF-234). Mide la opción marcada (`data-state="checked"`), escribe
 * `--indicador-x` y `--indicador-ancho` en el contenedor y marca `data-indicador-listo` cuando ya hay medida.
 * Antes de medir (sin JavaScript o antes de hidratar) la opción marcada conserva su propio fondo.
 * Observa tamaños y cambios del DOM y se desconecta al desmontar. No usa estado de Svelte.
 */
export const indicador: Action = (contenedor) => {
	const medir = () => {
		const marcada = contenedor.querySelector<HTMLElement>('[data-state="checked"]');
		if (!marcada) {
			contenedor.removeAttribute('data-indicador-listo');
			return;
		}
		contenedor.style.setProperty('--indicador-x', `${marcada.offsetLeft}px`);
		contenedor.style.setProperty('--indicador-ancho', `${marcada.offsetWidth}px`);
		contenedor.setAttribute('data-indicador-listo', '');
	};
	const tamanos = new ResizeObserver(medir);
	tamanos.observe(contenedor);
	for (const hijo of contenedor.children) tamanos.observe(hijo);
	const cambios = new MutationObserver(medir);
	cambios.observe(contenedor, { subtree: true, attributes: true, attributeFilter: ['data-state'], childList: true });
	medir();
	return {
		destroy: () => {
			tamanos.disconnect();
			cambios.disconnect();
		},
	};
};
