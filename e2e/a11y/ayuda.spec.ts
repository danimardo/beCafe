import { test } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// Constitución XI: el panel de ayuda de Capsulito y la página /ayuda, en tema claro y oscuro (CA-203).
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('el panel de ayuda abierto y /ayuda no tienen infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/compras`);
			await page.waitForLoadState('load');
			await page.getByRole('button', { name: 'Ayuda de esta pantalla', exact: true }).click();
			await page.getByRole('dialog', { name: 'Ayuda: Compras' }).waitFor();
			await expectSinInfracciones(page);

			await page.goto(`${servidor.url}/ayuda?pantalla=compras`);
			await expectSinInfracciones(page);
		});
	});
}
