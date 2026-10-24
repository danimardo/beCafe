import { test } from '../fixtures/errores-navegador';
import { expectSinInfracciones } from './axe';
import { tipoConCoste } from '../fixtures/consumos';

// Constitución XI y RNF-001: la tarjeta de agua en sus estados y el detalle de un relleno, en tema claro y oscuro (EV-060).
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('tarjeta de agua sin rellenos o con su último relleno no tiene infracciones de axe', async ({ page, servidor }) => {
			await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/`);
			await expectSinInfracciones(page);
		});

		test('tarjeta de agua con el rechazo por intervalo visible no tiene infracciones de axe', async ({ page, servidor }) => {
			await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/`);
			await page.getByRole('button', { name: 'He rellenado el agua' }).click();
			await page.getByRole('button', { name: 'He rellenado el agua' }).click();
			await expectSinInfracciones(page);
			await page.getByRole('button', { name: 'Deshacer', exact: true }).first().click();
		});

		test('tarjeta de agua sin conexión no tiene infracciones de axe', async ({ page, servidor }) => {
			await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/`);
			await page.context().setOffline(true);
			await expectSinInfracciones(page);
			await page.context().setOffline(false);
		});
	});
}
