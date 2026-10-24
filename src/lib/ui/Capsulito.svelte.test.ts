import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Capsulito from './Capsulito.svelte';

describe('Capsulito (RF-185, RF-187, CA-185, CA-187)', () => {
	it('CA-185, CA-187: muestra la imagen decorativa alt="" con su bocadillo accesible y los atributos de pose y expresión', async () => {
		const { container } = await render(Capsulito, {
			momento: 'saludo-manana',
			nombre: 'Ana',
			size: 'md',
			modo: 'svg',
		});

		await expect.element(page.getByText('¡Buenos días, Ana! ¿Qué cápsula compilamos hoy?')).toBeVisible();
		const img = container.querySelector('img');
		expect(img).not.toBeNull();
		expect(img?.getAttribute('alt')).toBe('');
		expect(img?.getAttribute('aria-hidden')).toBe('true');

		const envoltorio = container.querySelector('[data-momento="saludo-manana"]');
		expect(envoltorio?.getAttribute('data-pose')).toBe('saludando');
		expect(envoltorio?.getAttribute('data-expresion')).toBe('feliz');
	});

	it('CA-187: con mensaje={null} no renderiza bocadillo y permite respaldo fallback', async () => {
		const fallback = createRawSnippet(() => ({ render: () => '<span>Icono alternativo</span>' }));
		const { container } = await render(Capsulito, {
			momento: 'vacio-capsulas',
			mensaje: null,
			size: 'sm',
			modo: 'svg',
			fallback,
		});

		expect(container.querySelector('p.capsulito-bocadillo')).toBeNull();
		expect(container.querySelector('img')).not.toBeNull();
	});
});
