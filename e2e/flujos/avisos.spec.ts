import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// Campana y panel de avisos (RF-107, CA-021): la campana abre `/avisos` y la página muestra el estado vacío.
test('la campana abre /avisos y sin avisos muestra el mensaje vacío', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/estadisticas`);

	await page.getByRole('button', { name: 'Avisos', exact: true }).click();

	await expect(page).toHaveURL(`${servidor.url}/avisos?nuevos=0`);
	await expect(page.getByRole('heading', { name: 'Avisos', exact: true })).toBeVisible();
	await expect(page.getByText('No tienes avisos de los últimos 30 días.')).toBeVisible();
});

test('CA-021: la página de avisos enlaza con el ajuste de avisos del perfil', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/avisos`);

	await page.getByRole('link', { name: 'Ajustar qué avisos recibo', exact: true }).click();

	await expect(page).toHaveURL(`${servidor.url}/perfil`);
});
