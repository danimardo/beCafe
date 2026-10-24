import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// Cambio de un parámetro de negocio (CA-150). La sesión es reciente: no hace falta contraseña (CA-138).
// El valor se restablece al final para no alterar otras pruebas que comparten la base.
test('CA-150: un administrador cambia el plazo para deshacer y lo guarda', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/configuracion`);

	const plazo = page.getByLabel('Plazo para deshacer un registro (minutos)', { exact: true });
	await plazo.fill('20');
	await page.getByRole('button', { name: 'Guardar configuración', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Configuración guardada.' }).first()).toBeVisible();

	await plazo.fill('15');
	await page.getByRole('button', { name: 'Guardar configuración', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Configuración guardada.' }).first()).toBeVisible();
});

// Los umbrales de deuda se recalculan al escribir el límite (RN-074), antes de guardarlo.
test('RN-074: los umbrales de deuda se muestran al escribir el límite', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/configuracion`);

	await page.getByRole('textbox', { name: 'Límite de deuda', exact: true }).fill('-5');

	await expect(page.getByRole('heading', { name: 'Umbrales de deuda', exact: true })).toBeVisible();
	await expect(page.getByText('Aviso: −5,00 €')).toBeVisible();
});
