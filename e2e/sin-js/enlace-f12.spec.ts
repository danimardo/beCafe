import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { nombreUnico } from '../fixtures/capsulas';

// RF-239, CA-239: sin JavaScript, la respuesta del alta trae el enlace bajo su botón y con el foco (`autofocus`).
test('CA-239: sin JavaScript, el enlace del alta sale bajo el botón y recibe el foco', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/usuarios`);
	const nombre = nombreUnico('SinJs');
	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(nombre);
	await page
		.getByRole('textbox', { name: 'Correo electrónico', exact: true })
		.fill(`${nombre.replace(/\W/g, '').toLowerCase()}@ejemplo.test`);
	await page.getByRole('button', { name: 'Dar de alta', exact: true }).click();

	const campo = page.getByRole('textbox', { name: 'Enlace de acceso', exact: true });
	await expect(campo).toHaveValue(new RegExp(`${servidor.url}/acceso/`));
	await expect(campo).toBeFocused();
	await expect(campo).toBeInViewport();
});
