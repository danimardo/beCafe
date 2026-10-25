import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { rellenarLineaDeCompra, tiposDeCompra } from '../fixtures/economia';

// F11, CA-229: cada destino de la barra lateral aparece una sola vez (RF-229). Se reproduce el defecto de la captura 5.png.

test('CA-229: en escritorio, «Compras» aparece una vez en la barra lateral, también con el diálogo abierto y tras un fallo', async ({
	page,
	servidor,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	const [primero] = await tiposDeCompra(page, servidor);
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/compras`);
	await page.waitForLoadState('load');

	const enBarra = page.locator('aside').getByRole('link', { name: 'Compras', exact: true });
	await expect(enBarra).toHaveCount(1);

	await rellenarLineaDeCompra(page, primero, '1', '9000,00');
	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();
	const dialogo = page.getByRole('alertdialog');
	await expect(dialogo).toBeVisible();
	await expect(enBarra).toHaveCount(1);

	await dialogo.getByRole('button', { name: 'Cancelar', exact: true }).click();
	await expect(dialogo).toBeHidden();
	await expect(enBarra).toHaveCount(1);
});

test('CA-229: cada destino de la barra lateral y de administración aparece una sola vez por rol', async ({ page, servidor }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/compras`);
	await page.waitForLoadState('load');
	const enlaces = await page
		.locator('aside nav a')
		.evaluateAll((as) => as.map((a) => (a instanceof HTMLAnchorElement ? a.getAttribute('href') : null)));
	const repetidos = enlaces.filter((href, i) => enlaces.indexOf(href) !== i);
	expect(repetidos).toEqual([]);
});
