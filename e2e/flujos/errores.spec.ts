import { test, expect } from '../fixtures/errores-navegador';
import { expectSinInfracciones } from '../a11y/axe';
import { entrarComo } from '../fixtures/sesiones';

// F11 US7 (RF-226, CA-226): páginas de error con Capsulito, qué ha pasado, qué hacer y enlace a Inicio.
const ULID = '01HZZZZZZZZZZZZZZZZZZZZZZZ';

test('CA-226: la 404 muestra a Capsulito, el texto propio y el enlace a Inicio', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	const respuesta = await page.goto(`${servidor.url}/no-existe`);
	expect(respuesta?.status()).toBe(404);

	await expect(page.getByRole('heading', { level: 1, name: 'No encontramos esa página' })).toBeVisible();
	await expect(page.getByText('Aquí no hay nada, ni una triste cápsula. Te has perdido.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Ir al inicio' })).toBeVisible();
});

test('CA-226: la 403 muestra a Capsulito y no ofrece nada de la pantalla prohibida', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	const respuesta = await page.goto(`${servidor.url}/admin/usuarios`);
	expect(respuesta?.status()).toBe(403);

	await expect(page.getByRole('heading', { level: 1, name: 'No tienes permiso para ver esto' })).toBeVisible();
	await expect(page.getByText('Alto ahí, jefe. Esta zona es solo para administradores.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Ir al inicio' })).toBeVisible();
});

test('CA-226: la 400 muestra su página y no el valor recibido', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	const respuesta = await page.goto(`${servidor.url}/saldos/personas/${ULID}?pagina=valor-secreto`);
	expect(respuesta?.status()).toBe(400);

	await expect(page.getByRole('heading', { level: 1, name: 'No hemos entendido esa petición' })).toBeVisible();
	await expect(page.getByText('valor-secreto')).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Ir al inicio' })).toBeVisible();
});

test('CA-226: las páginas de error pasan axe sin infracciones', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	for (const ruta of ['/no-existe', '/admin/usuarios']) {
		await page.goto(`${servidor.url}${ruta}`);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expectSinInfracciones(page);
	}
});
