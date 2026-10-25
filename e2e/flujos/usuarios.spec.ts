import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { darDeAltaPersona } from '../fixtures/usuarios';
import { fotoDePrueba, nombreUnico } from '../fixtures/capsulas';

// Baja de una persona sin saldo (CA-135 sin liquidación): el asistente de baja confirma y la ficha lo anuncia.
test('CA-135: un administrador da de baja a una persona sin saldo y la ficha confirma la baja', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Baja');
	await darDeAltaPersona(page, servidor, nombre);

	await page.getByRole('link', { name: nombre }).first().click();
	await page.getByRole('link', { name: 'Dar de baja', exact: true }).click();
	await page.getByRole('button', { name: 'Ver efecto', exact: true }).click();
	await page.getByLabel('Contraseña actual', { exact: true }).fill(servidor.siembra.contrasena);
	await page.getByRole('button', { name: 'Confirmar la baja', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'Baja registrada' }).first()).toBeVisible();
});

// Foto de otra persona (RF-208, CA-208): el administrador la sube y la quita desde la ficha.
test('CA-208: un administrador sube y quita la foto de otra persona desde su ficha', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Foto');
	await darDeAltaPersona(page, servidor, nombre);
	await page.getByRole('link', { name: nombre }).first().click();
	await page.waitForLoadState('load');

	await page.getByLabel('Hacer o elegir foto').setInputFiles({ name: 'foto.jpg', mimeType: 'image/jpeg', buffer: await fotoDePrueba() });
	await page.getByRole('button', { name: 'Guardar foto', exact: true }).click();
	await expect(page.getByText('Foto guardada.')).toBeVisible();
	await expect(page.locator('img[src^="/fotos/usuarios/"]').last()).toBeVisible();

	await page.getByRole('button', { name: 'Quitar foto', exact: true }).click();
	await expect(page.getByText('Foto quitada.')).toBeVisible();
	await expect(page.locator('img[src^="/fotos/usuarios/"]')).toHaveCount(0);
});
