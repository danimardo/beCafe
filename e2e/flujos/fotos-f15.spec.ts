import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { darDeAltaCapsula, fotoDePrueba, nombreUnico } from '../fixtures/capsulas';

// F15 US3 (RF-272): «Quitar foto» deja la cápsula sin foto.

test('CA-272: quitar la foto de una cápsula la deja sin foto y lo confirma', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Quitar foto');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3', foto: await fotoDePrueba() });
	await page.getByRole('link', { name: new RegExp(nombre) }).first().click();
	await expect(page.getByRole('img', { name: 'Foto actual' })).toBeVisible();

	await page.getByRole('button', { name: 'Quitar foto', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'Foto quitada.' })).toBeVisible();
	await expect(page.getByRole('img', { name: 'Foto actual' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Quitar foto', exact: true })).toHaveCount(0);
});

test('CA-272: una cápsula sin foto no ofrece «Quitar foto»', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Sin foto');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3' });
	await page.getByRole('link', { name: new RegExp(nombre) }).first().click();

	await expect(page.getByRole('button', { name: 'Quitar foto', exact: true })).toHaveCount(0);
});
