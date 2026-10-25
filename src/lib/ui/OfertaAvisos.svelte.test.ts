import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import OfertaAvisos from './OfertaAvisos.svelte';

// Las pruebas de componente no cargan el CSS: la imagen de Capsulito ocupa su tamaño natural y tapa los botones.
// El clic se envía al elemento; el tamaño real y el solapamiento se miden en el E2E.
function pulsar(nombre: string) {
	page
		.getByRole('button', { name: nombre, exact: true })
		.element()
		.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('OfertaAvisos (RF-207)', () => {
	it('CA-207: «Activar avisos» llama a onactivar una sola vez y bloquea los botones mientras tanto', async () => {
		const onactivar = vi.fn(() => new Promise<void>(() => {}));
		await render(OfertaAvisos, { onactivar, onahoranoo: () => {} });

		await expect.element(page.getByRole('heading', { name: '¿Te aviso de las novedades?' })).toBeVisible();
		pulsar('Activar avisos');
		expect(onactivar).toHaveBeenCalledTimes(1);
		await expect.element(page.getByRole('button', { name: 'Ahora no', exact: true })).toBeDisabled();
	});

	it('CA-207: «Ahora no» cierra la oferta sin activar', async () => {
		const onactivar = vi.fn();
		const onahoranoo = vi.fn();
		await render(OfertaAvisos, { onactivar, onahoranoo });

		pulsar('Ahora no');
		expect(onahoranoo).toHaveBeenCalledTimes(1);
		expect(onactivar).not.toHaveBeenCalled();
	});
});
