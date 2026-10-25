import { test } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';
import { aportar, registrarCompra, rellenarLineaDeCompra, tipoDeCompra, tiposDeCompra } from '../fixtures/economia';
import { darDeAltaPersona } from '../fixtures/usuarios';
import { nombreUnico } from '../fixtures/capsulas';

// Constitución XI y RNF-001: las pantallas de economía de F4, en tema claro y oscuro, sin infracciones de axe.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('saldos: la pantalla de aportaciones no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/saldos`);
			await expectSinInfracciones(page);
		});

		test('compras: el formulario de compra no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/compras`);
			await expectSinInfracciones(page);
		});

		test('saldos: el detalle de una aportación no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await aportar(page, servidor, '5,00');
			await page
				.getByRole('link', { name: /^\d{4}-\d{2}-\d{2}/ })
				.first()
				.click();
			await expectSinInfracciones(page);
		});

		test('compras: el detalle de una compra no tiene infracciones de axe', async ({ page, servidor }) => {
			const [tipo] = await tiposDeCompra(page, servidor);
			await entrarComo(page, servidor, 'miembro');
			await aportar(page, servidor, '50,00');
			await registrarCompra(page, servidor, tipo, '12,00');
			await expectSinInfracciones(page);
		});

		test('compras: la cuadrícula y el diálogo de hucha negativa no tienen infracciones de axe', async ({ page, servidor }) => {
			const tipo = await tipoDeCompra(page, servidor);
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/compras`);
			await page.waitForLoadState('load');
			await rellenarLineaDeCompra(page, tipo, '1', '1000000,00');
			await expectSinInfracciones(page);
			await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();
			await page.getByRole('alertdialog').waitFor();
			await expectSinInfracciones(page);
		});

		test('baja: el asistente de baja no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'administrador');
			const nombre = nombreUnico('Baja axe');
			await darDeAltaPersona(page, servidor, nombre);
			await page.getByRole('link', { name: nombre }).first().click();
			await page.getByRole('link', { name: 'Dar de baja', exact: true }).click();
			await expectSinInfracciones(page);
		});

		test('control: la pantalla de arqueo y recuento no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'administrador');
			await page.goto(`${servidor.url}/admin/control`);
			await expectSinInfracciones(page);
		});
	});
}
