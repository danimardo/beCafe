import { test, expect } from '../fixtures/errores-navegador';
import { botonDeInvitado, botonDeToque, tipoConCoste } from '../fixtures/consumos';

// Consumos (F3): un toque con «Deshacer», el invitado y la anulación desde el detalle (CA-010, CA-013, RF-011, RF-014, CA-060).

test('CA-010, RF-011: un toque registra la cápsula, confirma el registro y «Deshacer» lo quita', async ({ page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);

	await botonDeToque(page, tipo).click();
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipo} registrado` })
			.first(),
	).toBeVisible();

	await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Consumo deshecho' }).first()).toBeVisible();
});

test('RF-014: el botón de invitado registra el consumo como de invitado', async ({ page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);

	await botonDeInvitado(page, tipo).click();

	await expect(page.getByRole('link', { name: new RegExp(`${tipo} · Invitado`) }).first()).toBeVisible();
});

test('CA-060: la anulación desde el detalle del consumo deja el consumo anulado', async ({ page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await botonDeToque(page, tipo).click();
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipo} registrado` })
			.first(),
	).toBeVisible();

	await page
		.getByRole('link', { name: new RegExp(tipo) })
		.first()
		.click();
	await page.getByRole('textbox', { name: 'Motivo', exact: true }).fill('Tomado por error');
	await page.getByRole('button', { name: 'Anular consumo', exact: true }).click();

	await expect(page.getByText('Anulado', { exact: true })).toBeVisible();
});
