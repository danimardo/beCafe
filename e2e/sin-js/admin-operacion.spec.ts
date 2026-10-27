import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// Sin JavaScript, guardar la configuración y anotar una prueba funcionan con el formulario (principio XVII).
test('sin JavaScript, guardar la configuración confirma el cambio y lo restablece', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/configuracion`);

	await page.getByLabel('Plazo para deshacer un registro (minutos)', { exact: true }).fill('20');
	await page.getByRole('button', { name: 'Guardar configuración', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Configuración guardada.' }).first()).toBeVisible();

	await page.getByLabel('Plazo para deshacer un registro (minutos)', { exact: true }).fill('15');
	await page.getByRole('button', { name: 'Guardar configuración', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Configuración guardada.' }).first()).toBeVisible();
});

test('sin JavaScript, anotar una prueba de restauración confirma en la pantalla', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	const ayer = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
	await page.getByLabel('Fecha de la prueba', { exact: true }).fill(ayer);
	await page.getByRole('button', { name: 'Anotar prueba', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'Prueba de restauración anotada.' }).first()).toBeVisible();
});
