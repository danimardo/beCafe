import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { aportar, arquear, registrarCompra, rellenarLineaDeCompra, tipoDeCompra, tiposDeCompra } from '../fixtures/economia';
import { activarPersona, darDeAltaYLeerEnlace } from '../fixtures/usuarios';
import { nombreUnico } from '../fixtures/capsulas';
import { botonDeToque } from '../fixtures/consumos';
import { textos } from '#lib/shared/textos';

// Economía (F4): aportar, comprar con dos líneas y anular la compra desde su detalle (CA-040, CA-030, CA-060).

test('CA-030: una persona aporta 5,00 € y ve el aviso de aportación registrada', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await aportar(page, servidor, '5,00');
});

test('CA-040, CA-197: una compra de dos tipos en la cuadrícula se registra y se puede anular desde su detalle', async ({
	page,
	servidor,
}) => {
	const [primero, segundo] = await tiposDeCompra(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await aportar(page, servidor, '50,00');

	await page.goto(`${servidor.url}/compras`);
	await page.waitForLoadState('load');
	// CA-197: «+» sube el contador y abre el importe de ese tipo; el resumen cuenta las líneas y suma el total.
	await page.getByRole('button', { name: `Añadir una cápsula de ${primero}`, exact: true }).click();
	await page.getByRole('button', { name: `Añadir una cápsula de ${primero}`, exact: true }).click();
	await expect(page.getByRole('spinbutton', { name: `Cantidad de ${primero}`, exact: true })).toHaveValue('2');
	// RF-197: los botones del contador miden al menos 44 × 44 px.
	const caja = await page.getByRole('button', { name: `Añadir una cápsula de ${primero}`, exact: true }).boundingBox();
	expect(caja?.width ?? 0).toBeGreaterThanOrEqual(44);
	expect(caja?.height ?? 0).toBeGreaterThanOrEqual(44);
	await page.getByRole('textbox', { name: `Importe de ${primero}`, exact: true }).fill('24,00');
	await rellenarLineaDeCompra(page, segundo, '1', '6,00');
	await expect(page.getByText(/2 líneas · Total: 30,00/)).toBeVisible();
	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();

	await expect(page).toHaveURL(/\/compras\/[0-9A-Z]{26}$/);
	await page.getByRole('textbox', { name: 'Motivo de la anulación', exact: true }).fill('Ticket duplicado');
	await page.getByRole('button', { name: 'Anular compra', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Compra anulada' }).first()).toBeVisible();
});

test('CA-198: una compra que deja la hucha en negativo abre el diálogo con el efecto; «Cancelar» no registra', async ({
	page,
	servidor,
}) => {
	const tipo = await tipoDeCompra(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/compras`);
	await page.waitForLoadState('load');
	await rellenarLineaDeCompra(page, tipo, '1', '1000000,00');
	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();

	const dialogo = page.getByRole('alertdialog', { name: 'La hucha quedará en negativo' });
	await expect(dialogo).toBeVisible();
	await expect(dialogo.getByText('Saldo actual de la hucha')).toBeVisible();
	await expect(dialogo.getByText('Saldo resultante')).toBeVisible();
	await expect(page.getByRole('checkbox')).toHaveCount(0);
	await dialogo.getByRole('button', { name: 'Cancelar', exact: true }).click();
	await expect(page).toHaveURL(`${servidor.url}/compras`);

	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Registrar igualmente', exact: true }).click();
	await expect(page).toHaveURL(/\/compras\/[0-9A-Z]{26}$/);
});

test('arqueo: la vista previa muestra el efecto y la confirmación con contraseña registra el arqueo', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await arquear(page, servidor, '0,00');
});

// Bajas con liquidación (T056, RF-120 a RF-124): la persona activa en su propio contexto y el administrador da la baja.
// Cada prueba crea su persona: la base se comparte entre las pruebas de un mismo worker.
test('devolución: la baja que devuelve el saldo de una persona queda registrada', async ({ browser, page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Devuelve');
	const enlace = await darDeAltaYLeerEnlace(page, servidor, nombre);
	const persona = await browser.newContext();
	const paginaPersona = await persona.newPage();
	await activarPersona(paginaPersona, servidor, enlace);
	await aportar(paginaPersona, servidor, '5,00');
	await persona.close();

	await page.goto(`${servidor.url}/admin/usuarios`);
	await page.getByRole('link', { name: nombre }).first().click();
	await page.getByRole('link', { name: 'Dar de baja', exact: true }).click();
	await page.getByLabel(textos.economia.modoBaja, { exact: true }).selectOption({ label: textos.economia.modoDevolucion });
	await page.getByRole('button', { name: 'Ver efecto', exact: true }).click();
	await page.getByLabel('Contraseña actual', { exact: true }).fill(servidor.siembra.contrasena);
	await page.getByRole('button', { name: 'Confirmar la baja', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'Baja registrada' }).first()).toBeVisible();
});

test('incobrable: la baja que da la deuda por incobrable de una persona queda registrada', async ({ browser, page, servidor }) => {
	const [tipo] = await tiposDeCompra(page, servidor);
	await entrarComo(page, servidor, 'administrador');
	await registrarCompra(page, servidor, tipo, '3,48', true);
	const nombre = nombreUnico('Incobrable');
	const enlace = await darDeAltaYLeerEnlace(page, servidor, nombre);
	const persona = await browser.newContext();
	const paginaPersona = await persona.newPage();
	await activarPersona(paginaPersona, servidor, enlace);
	await paginaPersona.goto(`${servidor.url}/`);
	await botonDeToque(paginaPersona, tipo).click();
	await expect(
		paginaPersona
			.getByRole('status')
			.filter({ hasText: `${tipo} registrado` })
			.first(),
	).toBeVisible();
	await persona.close();

	await page.goto(`${servidor.url}/admin/usuarios`);
	await page.getByRole('link', { name: nombre }).first().click();
	await page.getByRole('link', { name: 'Dar de baja', exact: true }).click();
	await page.getByLabel(textos.economia.modoBaja, { exact: true }).selectOption({ label: textos.economia.modoIncobrable });
	await page.getByRole('button', { name: 'Ver efecto', exact: true }).click();
	await page.getByLabel('Contraseña actual', { exact: true }).fill(servidor.siembra.contrasena);
	await page.getByRole('button', { name: 'Confirmar la baja', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'Baja registrada' }).first()).toBeVisible();
});
