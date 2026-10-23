import { test } from '../fixtures/errores-navegador';
import { expectSinInfracciones } from './axe';
import { botonDeToque, tipoConCoste } from '../fixtures/consumos';

// Constitución XI y RNF-001: las pantallas de consumos de F3, en tema claro y oscuro, sin infracciones de axe (EV-060).
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('pantalla principal con las cápsulas y los últimos consumos no tiene infracciones de axe', async ({ page, servidor }) => {
			await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/`);
			await expectSinInfracciones(page);
		});

		test('pantalla principal con el aviso «Deshacer» visible no tiene infracciones de axe', async ({ page, servidor }) => {
			const tipo = await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/`);
			await botonDeToque(page, tipo).click();
			await expectSinInfracciones(page);
		});

		test('pantalla principal con un consumo pendiente de enviar no tiene infracciones de axe', async ({ page, servidor }) => {
			const tipo = await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/`);
			await page.context().setOffline(true);
			await botonDeToque(page, tipo).click();
			await expectSinInfracciones(page);
			await page.context().setOffline(false);
		});

		test('historial de consumos no tiene infracciones de axe', async ({ page, servidor }) => {
			await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/historial`);
			await expectSinInfracciones(page);
		});
	});
}
