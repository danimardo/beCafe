import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Confeti from './Confeti.svelte';

// RF-243, RF-244: el confeti es decorativo, breve y no tapa ningún control.
const capa = (contenedor: HTMLElement) => contenedor.querySelector('[data-confeti]');

describe('Confeti (RF-243, RF-244)', () => {
	it('CA-243: con disparo 0 no pinta nada', async () => {
		const { container } = await render(Confeti, { disparo: 0 });

		expect(capa(container)).toBeNull();
	});

	it('CA-243: con un disparo pinta 14 piezas decorativas que no reciben eventos', async () => {
		const { container } = await render(Confeti, { disparo: 1 });

		const elemento = capa(container);
		expect(elemento).not.toBeNull();
		expect(elemento?.getAttribute('aria-hidden')).toBe('true');
		expect(elemento?.children).toHaveLength(14);
		if (elemento) expect(getComputedStyle(elemento).pointerEvents).toBe('none');
	});

	it('CA-243: desaparece solo en 1 s o menos', async () => {
		const { container } = await render(Confeti, { disparo: 1 });
		expect(capa(container)).not.toBeNull();

		await expect.poll(() => capa(container), { timeout: 1500, interval: 50 }).toBeNull();
	});

	it('CA-243: un disparo nuevo vuelve a pintarlo', async () => {
		const { container, rerender } = await render(Confeti, { disparo: 1 });
		await expect.poll(() => capa(container), { timeout: 1500, interval: 50 }).toBeNull();

		await rerender({ disparo: 2 });

		expect(capa(container)).not.toBeNull();
	});
});
