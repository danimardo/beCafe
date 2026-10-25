import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// Sin JavaScript, el alta muestra la confirmación y el enlace (CA-130, CA-131).
test('sin JavaScript, el administrador da de alta a una persona y ve el enlace', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/usuarios`);

	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Iván');
	await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill('ivan.prueba@ejemplo.es');
	await page.getByRole('button', { name: 'Dar de alta', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'Persona dada de alta' })).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Enlace de acceso' })).toHaveValue(new RegExp(`${servidor.url}/acceso/`));
});

// RF-223, EV-107: sin JavaScript, el alta acepta una foto opcional y, si el envío falla, avisa de volver a adjuntarla.
test('sin JavaScript, el alta con foto guarda a la persona y un fallo pide adjuntarla de nuevo', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/usuarios`);

	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Marta');
	await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill('marta.foto@ejemplo.es');
	await page.getByLabel('Hacer o elegir foto').setInputFiles({
		name: 'foto.png',
		mimeType: 'image/png',
		buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
	});
	await page.getByRole('button', { name: 'Dar de alta', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Persona dada de alta' })).toBeVisible();

	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Marta Dos');
	await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill('marta.foto@ejemplo.es');
	await page.getByRole('button', { name: 'Dar de alta', exact: true }).click();
	await expect(page.getByText('vuelve a adjuntarla')).toBeVisible();
});
