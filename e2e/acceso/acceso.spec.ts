import { test, expect } from '../fixtures/errores-navegador';

// RF-132 y RF-131: el primer administrador define su contraseña con el enlace de arranque, entra y sale.
const CONTRASENA = 'contraseña de prueba larga';

test('CA-132: el enlace de arranque define la contraseña y, con el aviso de privacidad pendiente, lleva a aceptarla', async ({
	page,
	servidor,
}) => {
	await page.goto(servidor.enlaceAdmin);
	await expect(page.getByRole('heading', { level: 1, name: 'Define tu contraseña para entrar en beCafé.' })).toBeVisible();

	await page.getByLabel('Contraseña nueva', { exact: true }).fill(CONTRASENA);
	await page.getByLabel('Repite la contraseña', { exact: true }).fill(CONTRASENA);
	await page.getByRole('button', { name: 'Guardar contraseña' }).click();

	// RF-160: la privacidad está pendiente; el cierre de sesión se prueba cuando se acepta (T076).
	await expect(page).toHaveURL(`${servidor.url}/aceptar-privacidad`);
});

test('CA-133: un correo o una contraseña incorrectos muestran el mismo mensaje', async ({ page, servidor }) => {
	await page.goto(`${servidor.url}/login`);
	await page.getByLabel('Correo electrónico').fill('nadie@ejemplo.es');
	await page.getByLabel('Contraseña', { exact: true }).fill('una contraseña incorrecta');
	await page.getByRole('button', { name: 'Entrar' }).click();

	await expect(page.getByRole('alert')).toHaveText(
		'Correo o contraseña incorrectos. Tras 5 intentos fallidos, la cuenta se bloquea 15 minutos.',
	);
});

test('CA-132: un enlace caducado o desconocido informa y no ofrece el formulario', async ({ page, servidor }) => {
	await page.goto(`${servidor.url}/acceso/${'a'.repeat(43)}`);

	await expect(
		page.getByRole('alert').getByText('Enlace no válido o caducado. Pide a un administrador que te envíe uno nuevo.'),
	).toBeVisible();
	await expect(page.getByLabel('Contraseña nueva', { exact: true })).toHaveCount(0);
});
