import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { cerrarSesion } from '../fixtures/economia';
import { nombreUnico } from '../fixtures/capsulas';
import type { ServidorDePrueba } from '../fixtures/servidor';

// F12 US5 (RF-241, CA-241): Capsulito reactivo en la pantalla del enlace de acceso (primera contraseña y recuperación comparten ruta).
const capsulito = (page: Page) => page.getByTestId('capsulito-entrada');

/** Da de alta a una persona como administrador y devuelve su enlace de acceso; la sesión queda cerrada. */
async function enlaceNuevo(page: Page, servidor: ServidorDePrueba): Promise<string> {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/usuarios`);
	const nombre = nombreUnico('Enlace');
	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(nombre);
	await page
		.getByRole('textbox', { name: 'Correo electrónico', exact: true })
		.fill(`${nombre.replace(/\W/g, '').toLowerCase()}@ejemplo.test`);
	await page.getByRole('button', { name: 'Dar de alta', exact: true }).click();
	const campo = page.getByRole('textbox', { name: 'Enlace de acceso', exact: true });
	await expect(campo).toHaveValue(new RegExp(`${servidor.url}/acceso/`));
	const enlace = await campo.inputValue();
	await cerrarSesion(page, servidor);
	return enlace;
}

test('CA-241: Capsulito se tapa los ojos con el foco en cualquiera de las dos contraseñas', async ({ page, servidor }) => {
	const enlace = await enlaceNuevo(page, servidor);
	await page.goto(enlace);
	await expect(capsulito(page)).toHaveAttribute('data-listo', 'true');
	await expect(capsulito(page)).toHaveAttribute('data-tapados', 'false');

	await page.getByRole('textbox', { name: 'Contraseña nueva', exact: true }).click();
	await expect(capsulito(page)).toHaveAttribute('data-tapados', 'true');

	await page.getByRole('textbox', { name: 'Repite la contraseña', exact: true }).click();
	await expect(capsulito(page)).toHaveAttribute('data-tapados', 'true');

	await page.getByRole('heading', { level: 1 }).click();
	await page.getByRole('button', { name: 'Guardar contraseña', exact: true }).focus();
	await expect(capsulito(page)).toHaveAttribute('data-tapados', 'false');
});

test('CA-241: con contraseñas distintas Capsulito se entristece y el error de campo sigue visible', async ({ page, servidor }) => {
	const enlace = await enlaceNuevo(page, servidor);
	await page.goto(enlace);
	await page.getByRole('textbox', { name: 'Contraseña nueva', exact: true }).fill('una contraseña larga de prueba uno');
	await page.getByRole('textbox', { name: 'Repite la contraseña', exact: true }).fill('una contraseña larga de prueba dos');
	await page.getByRole('button', { name: 'Guardar contraseña', exact: true }).click();

	await expect(page.getByText('Las dos contraseñas no coinciden.', { exact: true })).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Repite la contraseña', exact: true })).toHaveAttribute('aria-invalid', 'true');
	await expect(capsulito(page)).toHaveAttribute('data-estado', 'fallo');
});

test.describe('con movimiento reducido', () => {
	test.use({ reducedMotion: 'reduce' });

	test('CA-241: se muestra la imagen estática, sin lienzo, y la contraseña se define igual', async ({ page, servidor }) => {
		const enlace = await enlaceNuevo(page, servidor);
		await page.goto(enlace);
		await expect(capsulito(page).locator('img')).toBeVisible();
		await expect(capsulito(page).locator('canvas')).toHaveCount(0);

		const contrasena = 'una contraseña larga de prueba tres';
		await page.getByRole('textbox', { name: 'Contraseña nueva', exact: true }).fill(contrasena);
		await page.getByRole('textbox', { name: 'Repite la contraseña', exact: true }).fill(contrasena);
		await page.getByRole('button', { name: 'Guardar contraseña', exact: true }).click();
		await expect(page).toHaveURL(`${servidor.url}/aceptar-privacidad`);
	});
});
