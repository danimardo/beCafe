import { test } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// Constitución XI y T071: las pantallas de administración, en tema claro y oscuro, sin infracciones de axe.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('administración: el listado de personas no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'administrador');
			await page.goto(`${servidor.url}/admin/usuarios`);
			await expectSinInfracciones(page);
		});
	});
}
