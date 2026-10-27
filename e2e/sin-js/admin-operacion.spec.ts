import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// Sin JavaScript, guardar la configuración funciona con el formulario (principio XVII).
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
