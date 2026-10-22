import { test, expect } from '../fixtures/errores-navegador';

// CA-132 y CA-160: la persona invitada define su contraseña, acepta el texto de privacidad y entra. El enlace usado no vuelve a valer.
test('CA-132 y CA-160: la invitación lleva de la contraseña a la aceptación de privacidad y a la portada', async ({ page, servidor }) => {
	await page.goto(servidor.siembra.enlacePedro);
	await expect(page.getByRole('heading', { level: 1, name: 'Define tu contraseña para entrar en beCafé.' })).toBeVisible();

	await page.getByRole('textbox', { name: 'Contraseña nueva', exact: true }).fill('contraseña de prueba de Pedro');
	await page.getByRole('textbox', { name: 'Repite la contraseña', exact: true }).fill('contraseña de prueba de Pedro');
	await page.getByRole('button', { name: 'Guardar contraseña', exact: true }).click();

	await expect(page).toHaveURL(`${servidor.url}/aceptar-privacidad`);
	await page.getByRole('button', { name: 'He leído el texto y lo acepto', exact: true }).click();

	await expect(page).toHaveURL(`${servidor.url}/?aviso=privacidad-aceptada`);
	await expect(page.getByRole('status').filter({ hasText: 'Texto de privacidad aceptado.' })).toBeVisible();

	await page.goto(servidor.siembra.enlacePedro);
	await expect(page.getByRole('alert')).toContainText('Enlace no válido o caducado');
});
