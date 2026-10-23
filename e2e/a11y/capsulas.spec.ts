import { test } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// Constitución XI y RNF-001: las pantallas del catálogo y el panel de stock, en tema claro y oscuro, sin infracciones de axe.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('catálogo: el listado no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'administrador');
			await page.goto(`${servidor.url}/admin/capsulas`);
			await expectSinInfracciones(page);
		});

		test('catálogo: el alta no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'administrador');
			await page.goto(`${servidor.url}/admin/capsulas/nueva`);
			await expectSinInfracciones(page);
		});

		test('panel de inicio: el aviso de stock bajo no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/`);
			await expectSinInfracciones(page);
		});
	});
}
