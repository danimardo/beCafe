import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// Anotar una prueba de restauración (CA-143): la prueba aparece en la lista y el formulario confirma.
test('CA-143: un administrador anota una prueba de restauración', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	const ayer = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
	await page.getByLabel('Fecha de la prueba', { exact: true }).fill(ayer);
	await page.getByLabel('Correcta', { exact: true }).check();
	await page.getByRole('button', { name: 'Anotar prueba de restauración', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'Prueba de restauración anotada.' }).first()).toBeVisible();
});

// Una fecha futura no se guarda (Clarifications 3). El navegador ya la bloquea con `max`; se quita para comprobar que el servidor también la rechaza.
test('CA-143: el servidor rechaza una fecha futura aunque el navegador no la compruebe', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	const fecha = page.getByLabel('Fecha de la prueba', { exact: true });
	await fecha.evaluate((campo) => campo.removeAttribute('max'));
	const manana = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
	await fecha.fill(manana);
	await page.getByRole('button', { name: 'Anotar prueba de restauración', exact: true }).click();

	await expect(page.getByRole('alert').filter({ hasText: 'Revisa los datos marcados.' }).first()).toBeVisible();
});
