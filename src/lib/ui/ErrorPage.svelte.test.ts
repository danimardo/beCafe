import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ErrorPage from './ErrorPage.svelte';

describe('ErrorPage (RF-226)', () => {
	it('CA-226: la 500 muestra el código de incidencia, qué hacer y Reintentar', async () => {
		await render(ErrorPage, { kind: 'servidor', code: '01J0000000000000000000000A' });

		await expect.element(page.getByRole('heading', { level: 1, name: 'Algo ha fallado por nuestra parte' })).toBeVisible();
		await expect.element(page.getByText('Código de incidencia 01J0000000000000000000000A', { exact: true })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
	});

	it('CA-226: la 400 no muestra código ni Reintentar', async () => {
		await render(ErrorPage, { kind: 'peticion' });

		await expect.element(page.getByRole('heading', { level: 1, name: 'No hemos entendido esa petición' })).toBeVisible();
		await expect.element(page.getByText('Código de incidencia', { exact: true })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
	});
});
