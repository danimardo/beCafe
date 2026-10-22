import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// Sin JavaScript, aceptar el texto de privacidad lleva a la portada con la confirmación (RF-160, RF-161).
test('sin JavaScript, aceptar el texto de privacidad confirma en la portada', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'pendiente');
	await expect(page).toHaveURL(`${servidor.url}/aceptar-privacidad`);

	await page.getByRole('button', { name: 'He leído el texto y lo acepto', exact: true }).click();

	await expect(page).toHaveURL(`${servidor.url}/?aviso=privacidad-aceptada`);
	await expect(page.getByRole('status').filter({ hasText: 'Texto de privacidad aceptado.' })).toBeVisible();
});
