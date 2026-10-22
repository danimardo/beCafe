import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// CA-130 y CA-131: un administrador da de alta a una persona sin contraseña y copia su enlace de invitación de 24 horas.
test('CA-130 y CA-131: el administrador da de alta a una persona y copia el enlace de invitación', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/usuarios`);

	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Sofía');
	await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill('sofia.prueba@ejemplo.es');
	await page.getByRole('button', { name: 'Dar de alta', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'Persona dada de alta' })).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Enlace de acceso' })).toHaveValue(new RegExp(`${servidor.url}/acceso/`));
	await expect(page.getByText(/Caduca el/)).toBeVisible();
});
