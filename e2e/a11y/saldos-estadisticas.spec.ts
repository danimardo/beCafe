import { test } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// Constitución XI y RNF-001: las pantallas nuevas de F5 (saldos, historial y estadísticas), en tema claro y oscuro.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('saldos de todas las personas no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/saldos`);
			await expectSinInfracciones(page);
		});

		test('historial con filtros no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/historial`);
			await expectSinInfracciones(page);
		});

		test('estadísticas del mes no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/estadisticas`);
			await expectSinInfracciones(page);
		});
	});
}
