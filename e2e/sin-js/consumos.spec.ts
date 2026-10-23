import { test, expect } from '../fixtures/errores-navegador';
import { botonDeToque, tipoConCoste } from '../fixtures/consumos';

// Sin JavaScript, el toque, «Deshacer» y la anulación funcionan con los formularios del servidor (constitución XVII).

test('sin JavaScript, un toque muestra el registro con «Deshacer» y «Deshacer» lo quita', async ({ page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);

	await botonDeToque(page, tipo).click();
	await expect(page.getByText(`${tipo} registrado`, { exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Consumo deshecho' }).first()).toBeVisible();
});

test('sin JavaScript, la anulación de un consumo pide el motivo y lo deja anulado', async ({ page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await botonDeToque(page, tipo).click();

	await page
		.getByRole('link', { name: new RegExp(tipo) })
		.first()
		.click();
	await page.getByRole('textbox', { name: 'Motivo', exact: true }).fill('Tomado por error');
	await page.getByRole('button', { name: 'Anular consumo', exact: true }).click();

	await expect(page.getByText('Anulado', { exact: true })).toBeVisible();
});
