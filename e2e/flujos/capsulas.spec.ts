import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { darDeAltaCapsula, esperarEnPanelDeStock, fotoDePrueba, nombreUnico } from '../fixtures/capsulas';

// Catálogo de tipos de cápsula (F2): el administrador da de alta, edita, retira, reactiva y borra; el panel de stock bajo.

test('CA-001: el administrador da de alta un tipo y lo ve en el catálogo', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Ristretto');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3' });
	await expect(page.getByRole('status').filter({ hasText: 'Tipo dado de alta.' })).toBeVisible();

	await page.goto(`${servidor.url}/admin/capsulas`);
	await expect(page.getByRole('link', { name: new RegExp(nombre) })).toBeVisible();
});

test('CA-002: un nombre que ya usa otro tipo activo muestra el error en el campo Nombre', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Lungo');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3' });
	await darDeAltaCapsula(page, servidor, { nombre: nombre.toUpperCase(), umbral: '3' });
	await expect(page.getByText('Ya existe un tipo activo con ese nombre.')).toBeVisible();
});

test('CA-005: la foto se sube y se muestra en la ficha del tipo', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Decaf');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3', foto: await fotoDePrueba() });
	await page.goto(`${servidor.url}/admin/capsulas`);
	await page
		.getByRole('link', { name: new RegExp(nombre) })
		.first()
		.click();

	const foto = page.getByRole('img', { name: 'Foto actual' });
	await expect(foto).toBeVisible();
	const respuesta = await page.request.get(new URL((await foto.getAttribute('src')) ?? '', servidor.url).toString());
	expect(respuesta.status()).toBe(200);
	expect(respuesta.headers()['content-type']).toBe('image/webp');
});

test('CA-004: retirar un tipo lo marca como retirado y reactivarlo vuelve a activarlo', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Colombia');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3' });
	await page.goto(`${servidor.url}/admin/capsulas`);
	await page
		.getByRole('link', { name: new RegExp(nombre) })
		.first()
		.click();

	await page.getByRole('button', { name: 'Retirar', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Tipo retirado.' })).toBeVisible();
	await expect(page.getByText('Retirado', { exact: true }).first()).toBeVisible();

	await page.getByRole('button', { name: 'Reactivar', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Tipo reactivado.' })).toBeVisible();
	await expect(page.getByText('Activo', { exact: true }).first()).toBeVisible();
});

test('CA-006: borrar un tipo sin registros exige confirmar y lo quita del catálogo', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Vainilla');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3' });
	await page.goto(`${servidor.url}/admin/capsulas`);
	await page
		.getByRole('link', { name: new RegExp(nombre) })
		.first()
		.click();

	await page.getByRole('button', { name: 'Borrar tipo', exact: true }).click();
	await expect(page).toHaveURL(new RegExp(`${servidor.url}/admin/capsulas/[0-9A-Z]{26}$`));
	await page.getByRole('checkbox', { name: /Entiendo que el tipo y su foto se borran/ }).check();
	await page.getByRole('button', { name: 'Borrar tipo', exact: true }).click();

	await expect(page).toHaveURL(`${servidor.url}/admin/capsulas`);
	await expect(page.getByRole('link', { name: new RegExp(nombre) })).toHaveCount(0);
});

test('RF-021: el panel de inicio muestra el tipo en stock bajo a cualquier miembro', async ({ page, browser, servidor }) => {
	// El administrador da de alta en su propio contexto: así la sesión del miembro no hereda la del administrador.
	const contextoAdmin = await browser.newContext();
	const admin = await contextoAdmin.newPage();
	await entrarComo(admin, servidor, 'administrador');
	const nombre = nombreUnico('Intenso');
	await darDeAltaCapsula(admin, servidor, { nombre, umbral: '3' });
	await contextoAdmin.close();

	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/`);
	await esperarEnPanelDeStock(page, nombre);
});

test('RF-004: un tipo retirado no aparece en el panel de stock bajo', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Rosa');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3' });
	await page.goto(`${servidor.url}/`);
	await esperarEnPanelDeStock(page, nombre);

	await page.goto(`${servidor.url}/admin/capsulas`);
	await page
		.getByRole('link', { name: new RegExp(nombre) })
		.first()
		.click();
	await page.getByRole('button', { name: 'Retirar', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Tipo retirado.' })).toBeVisible();

	await page.goto(`${servidor.url}/`);
	await expect(page.getByText(nombre, { exact: true })).toHaveCount(0);
});
