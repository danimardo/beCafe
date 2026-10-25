import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Paginacion from './Paginacion.svelte';

const base = { etiqueta: 'Páginas de prueba', anterior: 'Anterior', siguiente: 'Siguiente' };

describe('Paginacion (ARCHITECTURE.md §7)', () => {
	it('no muestra nada con una sola página', async () => {
		const { container } = await render(Paginacion, { ...base, pagina: 1, paginas: 1 });

		expect(container.querySelector('form')).toBeNull();
	});

	it('en la primera página solo ofrece «Siguiente», con el número de la página 2', async () => {
		await render(Paginacion, { ...base, pagina: 1, paginas: 3 });

		await expect.element(page.getByRole('button', { name: 'Siguiente' })).toHaveAttribute('value', '2');
		expect(page.getByRole('button', { name: 'Anterior' }).elements()).toHaveLength(0);
	});

	it('en una página intermedia ofrece las dos y conserva los parámetros indicados', async () => {
		const { container } = await render(Paginacion, { ...base, pagina: 2, paginas: 3, conservar: { vista: 'revisados' } });

		await expect.element(page.getByRole('button', { name: 'Anterior' })).toHaveAttribute('value', '1');
		await expect.element(page.getByRole('button', { name: 'Siguiente' })).toHaveAttribute('value', '3');
		expect(container.querySelector('input[name="vista"]')).toHaveAttribute('value', 'revisados');
		expect(container.querySelector('form')).toHaveAttribute('method', 'get');
	});

	it('en la última página solo ofrece «Anterior»', async () => {
		await render(Paginacion, { ...base, pagina: 3, paginas: 3 });

		await expect.element(page.getByRole('button', { name: 'Anterior' })).toBeVisible();
		expect(page.getByRole('button', { name: 'Siguiente' }).elements()).toHaveLength(0);
	});
});
