import { test, expect } from '../fixtures/errores-navegador';

// Sin JavaScript, el formulario de entrada funciona con un envío normal (principio XVII).
test('sin JavaScript, la entrada con correo y contraseña lleva a la portada', async ({ page, servidor }) => {
	await page.goto(`${servidor.url}/login`);
	await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(servidor.siembra.correos.miembro);
	await page.getByRole('textbox', { name: 'Contraseña', exact: true }).fill(servidor.siembra.contrasena);
	await page.getByRole('button', { name: 'Entrar', exact: true }).click();

	await expect(page).toHaveURL(`${servidor.url}/`);
	await expect(page.getByRole('heading', { level: 1, name: /Hola/ })).toBeVisible();
});
