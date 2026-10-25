import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { aportar } from '../fixtures/economia';

// Saldos e historial (F5): saldos de todas las personas, fila propia marcada y filtro «Míos» (CA-110, CA-111, CA-112).

test('CA-110, CA-111: /saldos muestra a todas las personas activas y marca la fila propia con «(tú)»', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/saldos`);

	await expect(page.getByRole('heading', { name: 'Saldos del departamento', exact: true })).toBeVisible();
	await expect(page.getByText(/\(tú\)/)).toBeVisible();
});

test('CA-112: «Míos» en /historial muestra mis aportaciones', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await aportar(page, servidor, '5,00');

	await page.goto(`${servidor.url}/historial`);
	await page.getByRole('combobox', { name: 'Ver', exact: true }).selectOption('mios');
	await page.getByRole('button', { name: 'Aplicar', exact: true }).click();

	await expect(page.getByText('Aportación', { exact: false }).first()).toBeVisible();
});

test('CA-199, CA-200: un administrador aporta para Marta y el detalle de Marta dice quién la registró', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/saldos`);
	await page.waitForLoadState('load');
	await page.getByRole('combobox', { name: 'Para', exact: true }).selectOption({ label: 'Marta' });
	await page.getByRole('textbox', { name: 'Importe', exact: true }).fill('7,00');
	await page.getByRole('button', { name: 'Aportar', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Aportación registrada a nombre de Marta' }).first()).toBeVisible();

	await page
		.getByRole('link', { name: /^Marta/ })
		.first()
		.click();
	await expect(page.getByRole('heading', { level: 1, name: 'Aportaciones de Marta' })).toBeVisible();
	await expect(page.getByText('Registrada por Ana').first()).toBeVisible();
});

test('CA-200: un miembro no ve el campo «Para»', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/saldos`);
	await expect(page.getByRole('combobox', { name: 'Para', exact: true })).toHaveCount(0);
	await expect(page.getByText(/^Aportado: /).first()).toBeVisible();
});
