import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { aportar, arquear, registrarCompra, tiposDeCompra } from '../fixtures/economia';

// Sin JavaScript, la economía de F4 funciona con los formularios del servidor (constitución XVII).

test('sin JavaScript, una aportación muestra el aviso de aportación registrada', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await aportar(page, servidor, '5,00');
});

test('sin JavaScript, «Añadir línea» conserva lo escrito en la línea anterior', async ({ page, servidor }) => {
	const [primero] = await tiposDeCompra(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/compras`);

	await page.getByRole('combobox', { name: 'Tipo de cápsula', exact: true }).first().selectOption({ label: primero });
	await page.getByRole('spinbutton', { name: 'Cantidad', exact: true }).first().fill('2');
	await page.getByRole('textbox', { name: 'Importe', exact: true }).first().fill('24,00');
	await page.getByRole('button', { name: 'Añadir línea', exact: true }).click();

	await expect(page.getByText('Línea 2')).toBeVisible();
	await expect(page.getByRole('spinbutton', { name: 'Cantidad', exact: true }).first()).toHaveValue('2');
	await expect(page.getByRole('textbox', { name: 'Importe', exact: true }).first()).toHaveValue('24,00');
});

test('sin JavaScript, una compra que deja la hucha en negativo pide confirmación y se registra al confirmarla', async ({
	page,
	servidor,
}) => {
	const [primero] = await tiposDeCompra(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/compras`);

	await page.getByRole('combobox', { name: 'Tipo de cápsula', exact: true }).first().selectOption({ label: primero });
	await page.getByRole('spinbutton', { name: 'Cantidad', exact: true }).first().fill('1');
	await page.getByRole('textbox', { name: 'Importe', exact: true }).first().fill('1000000,00');
	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();

	await expect(page.getByRole('alert').filter({ hasText: 'Esta acción tiene efectos' })).toBeVisible();
	await page.getByRole('checkbox', { name: 'Registrar aunque la hucha quede en negativo', exact: true }).check();
	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();

	await expect(page).toHaveURL(/\/compras\/[0-9A-Z]{26}$/);
});

test('sin JavaScript, una compra se anula desde su detalle con el motivo', async ({ page, servidor }) => {
	const [primero] = await tiposDeCompra(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await aportar(page, servidor, '50,00');
	await registrarCompra(page, servidor, primero, '12,00', true);

	await page.getByRole('textbox', { name: 'Motivo de la anulación', exact: true }).fill('Ticket duplicado');
	await page.getByRole('button', { name: 'Anular compra', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'Compra anulada' }).first()).toBeVisible();
});

test('sin JavaScript, el arqueo muestra la vista previa y se confirma con contraseña', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await arquear(page, servidor, '0,00');
});
