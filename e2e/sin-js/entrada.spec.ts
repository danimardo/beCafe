import { test, expect } from '../fixtures/errores-navegador';

// F11 US5 (RF-225, CA-225, EV-107): sin JavaScript, la entrada muestra la imagen estática de Capsulito y el formulario funciona.
test('CA-225: sin JavaScript, /login muestra a Capsulito en imagen y permite entrar', async ({ page, servidor }) => {
	await page.goto(`${servidor.url}/login`);
	await expect(page.getByTestId('capsulito-entrada').locator('img')).toBeVisible();
	await expect(page.getByTestId('capsulito-entrada').locator('canvas')).toHaveCount(0);

	await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(servidor.siembra.correos.miembro);
	await page.getByRole('textbox', { name: 'Contraseña', exact: true }).fill(servidor.siembra.contrasena);
	await page.getByRole('button', { name: 'Entrar', exact: true }).click();
	await expect(page).not.toHaveURL(`${servidor.url}/login`);
});
