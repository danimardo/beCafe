import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CapsulitoEntrada from './CapsulitoEntrada.svelte';

describe('CapsulitoEntrada (RF-225, CA-225)', () => {
	it('CA-225: muestra la imagen estática decorativa y refleja la mirada, los ojos tapados y el estado', async () => {
		const { container } = await render(CapsulitoEntrada, { mirarX: 80, taparOjos: true, estado: 'fallo', reducido: true });

		const img = container.querySelector('img');
		expect(img?.getAttribute('alt')).toBe('');
		expect(img?.getAttribute('aria-hidden')).toBe('true');
		const envoltorio = container.querySelector('[data-testid="capsulito-entrada"]');
		expect(envoltorio?.getAttribute('data-mirar')).toBe('80');
		expect(envoltorio?.getAttribute('data-tapados')).toBe('true');
		expect(envoltorio?.getAttribute('data-estado')).toBe('fallo');
	});

	it('CA-225: con movimiento reducido no monta el lienzo de Rive y se queda la imagen', async () => {
		const { container } = await render(CapsulitoEntrada, { reducido: true });

		expect(container.querySelector('canvas')).toBeNull();
		expect(container.querySelector('img')).not.toBeNull();
	});

	it('CA-225: sin reducción de movimiento monta el lienzo y, si la animación no carga, conserva la imagen visible', async () => {
		const { container } = await render(CapsulitoEntrada, {});

		expect(container.querySelector('canvas')).not.toBeNull();
		const img = container.querySelector('img');
		expect(img).not.toBeNull();
		expect(img?.className).not.toContain('opacity-0');
	});
});
