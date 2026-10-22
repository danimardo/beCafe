import { test, expect } from '../fixtures/errores-navegador';

// Sin JavaScript, definir la contraseña con el enlace de invitación funciona igual (RF-132).
test('sin JavaScript, el enlace de invitación define la contraseña', async ({ page, servidor }) => {
	await page.goto(servidor.siembra.enlacePedro);
	await page.getByRole('textbox', { name: 'Contraseña nueva', exact: true }).fill('contraseña de prueba sin JS');
	await page.getByRole('textbox', { name: 'Repite la contraseña', exact: true }).fill('contraseña de prueba sin JS');
	await page.getByRole('button', { name: 'Guardar contraseña', exact: true }).click();

	await expect(page).toHaveURL(`${servidor.url}/aceptar-privacidad`);
});
