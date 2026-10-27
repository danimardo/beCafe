import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// F16 (constitución XI): la ficha de una persona con su estado de instalación, sin infracciones de axe en claro y oscuro.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('la ficha de una persona no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'administrador');
			await page.goto(`${servidor.url}/admin/usuarios`);
			await page.getByRole('link', { name: /Luis/ }).first().click();
			await expect(page.getByText(/instal/i).first()).toBeVisible();
			await expectSinInfracciones(page);
		});
	});
}
