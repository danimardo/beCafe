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
