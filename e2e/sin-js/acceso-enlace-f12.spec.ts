import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { cerrarSesion } from '../fixtures/economia';
import { nombreUnico } from '../fixtures/capsulas';

// F12 US5 (CA-241), sin JavaScript: la pantalla del enlace funciona y Capsulito es la imagen estática.
// El enlace lo genera un administrador con JavaScript; la persona invitada abre un contexto sin JavaScript.

test.use({ javaScriptEnabled: true });

test('CA-241: sin JavaScript, Capsulito es la imagen estática y la contraseña se define', async ({ browser, page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/usuarios`);
	const nombre = nombreUnico('AccesoSinJs');
	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(nombre);
	await page
		.getByRole('textbox', { name: 'Correo electrónico', exact: true })
		.fill(`${nombre.replace(/\W/g, '').toLowerCase()}@ejemplo.test`);
	await page.getByRole('button', { name: 'Dar de alta', exact: true }).click();
	const campo = page.getByRole('textbox', { name: 'Enlace de acceso', exact: true });
	await expect(campo).toHaveValue(new RegExp(`${servidor.url}/acceso/`));
	const enlace = await campo.inputValue();
	await cerrarSesion(page, servidor);

	const contextoSinJs = await browser.newContext({ javaScriptEnabled: false });
	try {
		const sinJs: Page = await contextoSinJs.newPage();
		await sinJs.goto(enlace);
		const imagen = sinJs.getByTestId('capsulito-entrada').locator('img');
		await expect(imagen).toBeVisible();
		await expect(sinJs.getByTestId('capsulito-entrada').locator('canvas')).toHaveCount(0);

		const contrasena = 'una contraseña larga de prueba sin JS';
		await sinJs.getByRole('textbox', { name: 'Contraseña nueva', exact: true }).fill(contrasena);
		await sinJs.getByRole('textbox', { name: 'Repite la contraseña', exact: true }).fill(contrasena);
		await sinJs.getByRole('button', { name: 'Guardar contraseña', exact: true }).click();
		await expect(sinJs).toHaveURL(`${servidor.url}/aceptar-privacidad`);
	} finally {
		await contextoSinJs.close();
	}
});
