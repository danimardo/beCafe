import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import PruebasBienvenida from './PruebasBienvenida.svelte';

describe('Bienvenida (RF-185, CA-185)', () => {
	it('CA-185: muestra la historia de 8 escenas, permite avanzar y al saltar la marca como vista', async () => {
		await render(PruebasBienvenida, { nombre: 'Ana' });

		await expect.element(page.getByText('Escena 1 de 8')).toBeVisible();
		await expect.element(page.getByRole('heading', { name: '¡Hola! Soy Capsulito' })).toBeVisible();

		await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
		await expect.element(page.getByText('Escena 2 de 8')).toBeVisible();
		await expect.element(page.getByRole('heading', { name: 'Vigilamos las reservas' })).toBeVisible();

		await page.getByRole('button', { name: 'Saltar', exact: true }).click();
		await expect.element(page.getByText('Estado bienvenida: vista')).toBeVisible();
	});
});
