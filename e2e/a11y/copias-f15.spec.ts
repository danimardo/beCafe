import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// RF-275, CA-275: cada sección de «Copias de seguridad» lleva su icono y su fondo; sin infracciones de axe en claro y oscuro.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('CA-275: la pantalla de copias no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'administrador');
			await page.goto(`${servidor.url}/admin/copias`);
			await expect(page.getByRole('heading', { name: 'Copias', exact: true, level: 2 })).toBeVisible();
			await expectSinInfracciones(page);
		});
	});
}
