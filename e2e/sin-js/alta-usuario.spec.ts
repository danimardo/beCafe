import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// Sin JavaScript, el alta muestra la confirmación y el enlace (CA-130, CA-131).
test('sin JavaScript, el administrador da de alta a una persona y ve el enlace', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/usuarios`);

	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Iván');
	await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill('ivan.prueba@ejemplo.es');
	await page.getByRole('button', { name: 'Dar de alta', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'Persona dada de alta' })).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Enlace de acceso' })).toHaveValue(new RegExp(`${servidor.url}/acceso/`));
});
