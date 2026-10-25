import { test, expect } from '../fixtures/errores-navegador';
import { botonDeInvitado, tipoConCoste } from '../fixtures/consumos';
import { entrarComo } from '../fixtures/sesiones';

// Sin JavaScript (constitución XVII, CA-182, CA-183, CA-187): el botón de invitado de CapsuleTile, las 8 escenas fijas en /ayuda y Cerrar sesión en /perfil funcionan sin JS.

test('CA-183: sin JavaScript, el botón de invitado de la tarjeta registra el consumo como invitado', async ({ page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);

	await botonDeInvitado(page, tipo).click();

	await expect(page.getByText(`${tipo} registrado`, { exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: new RegExp(`${tipo} · Invitado`) }).first()).toBeVisible();
});

test('CA-182, CA-187: sin JavaScript, /ayuda muestra las 8 escenas estáticas y /perfil cierra la sesión', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/ayuda`);

	await expect(page.getByRole('heading', { name: 'Cómo funciona beCafé', exact: true })).toBeVisible();
	await expect(page.getByText('Paso 1 de 8')).toBeVisible();
	await expect(page.getByText('Paso 8 de 8')).toBeVisible();

	await page.goto(`${servidor.url}/perfil`);
	await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
	await expect(page).toHaveURL(`${servidor.url}/login`);
});

test('CA-203: sin JavaScript, «?» lleva a /ayuda con la ayuda de la pantalla primero', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/compras`);
	await page.getByRole('button', { name: 'Ayuda de esta pantalla', exact: true }).click();

	await expect(page).toHaveURL(`${servidor.url}/ayuda?pantalla=compras`);
	await expect(page.getByRole('heading', { name: 'Ayuda de la pantalla' })).toBeVisible();
	await expect(page.getByText('Registra las cápsulas que has comprado con dinero de la hucha.')).toBeVisible();
});

test('CA-228: sin JavaScript, `/?tour=si` carga Inicio sin error (el tour necesita JavaScript)', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	const respuesta = await page.goto(`${servidor.url}/?tour=si`);

	expect(respuesta?.status()).toBe(200);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
