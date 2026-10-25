import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/errores-navegador';

// F11 US5 (RF-225, CA-225): Capsulito reactivo en la pantalla de entrada.
const capsulito = (page: Page) => page.getByTestId('capsulito-entrada');

test('CA-225: Capsulito mira el texto del correo, se tapa los ojos en la contraseña y carga la animación', async ({ page, servidor }) => {
	await page.goto(`${servidor.url}/login`);
	await expect(capsulito(page)).toHaveAttribute('data-listo', 'true');

	const correo = page.getByRole('textbox', { name: 'Correo electrónico', exact: true });
	await correo.click();
	await correo.pressSequentially('persona@ejemplo.es');
	await expect(capsulito(page)).toHaveAttribute('data-tapados', 'false');
	await expect(capsulito(page)).not.toHaveAttribute('data-mirar', '50');

	await page.getByRole('textbox', { name: 'Contraseña', exact: true }).click();
	await expect(capsulito(page)).toHaveAttribute('data-tapados', 'true');

	await correo.click();
	await expect(capsulito(page)).toHaveAttribute('data-tapados', 'false');
});

test('CA-225: tras una entrada fallida Capsulito se entristece y el mensaje de error se anuncia igual', async ({ page, servidor }) => {
	await page.goto(`${servidor.url}/login`);
	await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(servidor.siembra.correos.miembro);
	await page.getByRole('textbox', { name: 'Contraseña', exact: true }).fill('una contraseña que no es correcta');
	await page.getByRole('button', { name: 'Entrar', exact: true }).click();

	await expect(page.getByRole('alert').first()).toBeVisible();
	await expect(capsulito(page)).toHaveAttribute('data-estado', 'fallo');
});

test.describe('con movimiento reducido', () => {
	test.use({ reducedMotion: 'reduce' });

	test('CA-225: se muestra la imagen estática, sin lienzo, y el formulario funciona igual', async ({ page, servidor }) => {
		await page.goto(`${servidor.url}/login`);
		await expect(capsulito(page).locator('img')).toBeVisible();
		await expect(capsulito(page).locator('canvas')).toHaveCount(0);

		await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(servidor.siembra.correos.miembro);
		await page.getByRole('textbox', { name: 'Contraseña', exact: true }).fill(servidor.siembra.contrasena);
		await page.getByRole('button', { name: 'Entrar', exact: true }).click();
		await expect(page).not.toHaveURL(`${servidor.url}/login`);
	});
});
