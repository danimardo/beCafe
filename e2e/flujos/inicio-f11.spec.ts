import { test, expect } from '../fixtures/errores-navegador';
import { botonDeInvitado, botonDeToque, tipoConCoste } from '../fixtures/consumos';

// F11: Inicio centrado en el café (RF-216 a RF-219). `tipoConCoste` compra una sola cápsula: tras un toque, el stock es 0.

test('CA-216: Capsulito va arriba, después las cápsulas y después el agua (móvil)', async ({ page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');

	const capsulito = await page.getByRole('group', { name: 'Capsulito', exact: true }).boundingBox();
	const tarjeta = await botonDeToque(page, tipo).boundingBox();
	const agua = await page.getByRole('button', { name: 'He rellenado el agua', exact: true }).boundingBox();
	expect(capsulito).not.toBeNull();
	expect(tarjeta).not.toBeNull();
	expect(agua).not.toBeNull();
	expect(capsulito?.y ?? 0).toBeLessThan(tarjeta?.y ?? 0);
	expect(tarjeta?.y ?? 0).toBeLessThan(agua?.y ?? 0);
});

test('CA-216: en escritorio, las cápsulas van a la izquierda y el agua en la columna estrecha de la derecha', async ({
	page,
	servidor,
}) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');

	const capsulito = await page.getByRole('group', { name: 'Capsulito', exact: true }).boundingBox();
	const tarjeta = await botonDeToque(page, tipo).boundingBox();
	const agua = await page.getByRole('button', { name: 'He rellenado el agua', exact: true }).boundingBox();
	expect(capsulito?.y ?? 0).toBeLessThan(tarjeta?.y ?? 0);
	expect(tarjeta?.x ?? 0).toBeLessThan(agua?.x ?? 0);
});

test('CA-217: la tarjeta «Sin stock» pregunta; «Cancelar» no registra y «Sí, registrar» registra con «Deshacer»', async ({
	page,
	servidor,
}) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	// Un toque con stock deja el tipo en 0 sin pedir confirmación (RF-011).
	await botonDeToque(page, tipo).click();
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipo} registrado` })
			.first(),
	).toBeVisible();
	await expect(page.getByText('Sin stock').first()).toBeVisible();

	await botonDeToque(page, tipo).click();
	const dialogo = page.getByRole('alertdialog', { name: 'El sistema dice que no quedan' });
	await expect(dialogo).toBeVisible();
	await dialogo.getByRole('button', { name: 'Cancelar', exact: true }).click();
	await expect(dialogo).toBeHidden();
	await expect(page.getByRole('status').filter({ hasText: 'descuadre' })).toHaveCount(0);

	await botonDeInvitado(page, tipo).click();
	await expect(dialogo).toBeVisible();
	await dialogo.getByRole('button', { name: 'Sí, registrar', exact: true }).click();
	await expect(page.getByRole('link', { name: new RegExp(`${tipo} · Invitado`) }).first()).toBeVisible();
	await expect(page.getByRole('button', { name: 'Deshacer', exact: true })).toBeVisible();
});

test('CA-218: una cápsula con pocas unidades lleva el texto «Quedan pocas»', async ({ page, servidor }) => {
	await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');

	// El tipo de prueba tiene 1 cápsula y umbral 3: queda por debajo del umbral y por encima de 0.
	await expect(page.getByText('Quedan pocas').first()).toBeVisible();
});

test('CA-219: «He rellenado el agua» se ve también en el bocadillo de Capsulito', async ({ page, servidor }) => {
	await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');

	await page.getByRole('button', { name: 'He rellenado el agua', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Relleno registrado' }).first()).toBeVisible();
	const bocadillo = page.getByRole('group', { name: 'Capsulito', exact: true });
	await expect(bocadillo.getByText(/agua/i).first()).toBeVisible();
});
