import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { fotoDePrueba } from '../fixtures/capsulas';
import { aportar, arquear, registrarCompra, rellenarLineaDeCompra, tiposDeCompra } from '../fixtures/economia';

// Sin JavaScript, la economía de F4 funciona con los formularios del servidor (constitución XVII).

test('sin JavaScript, una aportación muestra el aviso de aportación registrada', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await aportar(page, servidor, '5,00');
});

test('CA-197: sin JavaScript, la cuadrícula muestra el importe de cada tipo y registra solo los de cantidad mayor que 0', async ({
	page,
	servidor,
}) => {
	const [primero, segundo] = await tiposDeCompra(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await aportar(page, servidor, '50,00');
	await page.goto(`${servidor.url}/compras`);

	await expect(page.getByRole('textbox', { name: `Importe de ${segundo}`, exact: true })).toBeVisible();
	await rellenarLineaDeCompra(page, primero, '2', '8,00');
	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();

	await expect(page).toHaveURL(/\/compras\/[0-9A-Z]{26}$/);
});

test('EV-106, CA-198: sin JavaScript, una compra que deja la hucha en negativo muestra el paso intermedio y se registra igualmente', async ({
	page,
	servidor,
}) => {
	const [primero] = await tiposDeCompra(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/compras`);

	await rellenarLineaDeCompra(page, primero, '1', '1000000,00');
	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();

	const paso = page.getByRole('alert').filter({ hasText: 'La hucha quedará en negativo' });
	await expect(paso).toBeVisible();
	await expect(paso.getByText('Saldo resultante')).toBeVisible();
	await expect(page.getByRole('spinbutton', { name: `Cantidad de ${primero}`, exact: true })).toHaveValue('1');
	// El navegador no puede volver a rellenar un campo de archivo (constitución XVII: `valores` no lleva archivos): el paso lo avisa.
	await expect(paso.getByText('vuelve a elegirla antes de registrar')).toBeVisible();
	await page.getByLabel('Hacer o elegir foto').setInputFiles({ name: 'ticket.jpg', mimeType: 'image/jpeg', buffer: await fotoDePrueba() });
	await page.getByRole('button', { name: 'Registrar igualmente', exact: true }).click();

	await expect(page).toHaveURL(/\/compras\/[0-9A-Z]{26}$/);
	await expect(page.getByRole('img', { name: 'Foto del ticket' })).toBeVisible();
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

test('CA-200: sin JavaScript, un administrador registra una aportación para otra persona', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/saldos`);
	await page.getByRole('combobox', { name: 'Para', exact: true }).selectOption({ label: 'Marta' });
	await page.getByRole('textbox', { name: 'Importe', exact: true }).fill('3,00');
	await page.getByRole('button', { name: 'Aportar', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Aportación registrada a nombre de Marta' }).first()).toBeVisible();
});

test('CA-211, EV-107: sin JavaScript, una línea con cantidad y sin importe marca ese campo y no pide confirmar la hucha', async ({
	page,
	servidor,
}) => {
	const [primero] = await tiposDeCompra(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/compras`);

	await rellenarLineaDeCompra(page, primero, '16', '');
	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();

	await expect(page.getByRole('textbox', { name: `Importe de ${primero}`, exact: true })).toHaveAttribute('aria-invalid', 'true');
	await expect(page.getByText('Escribe lo que costó esta línea en el ticket.')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Registrar igualmente', exact: true })).toHaveCount(0);
});
