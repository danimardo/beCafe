import { test } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// Constitución XI: las pantallas de avisos no tienen infracciones de axe, en tema claro y en oscuro.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('perfil con sus avisos: sin infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/perfil`);
			await expectSinInfracciones(page);
		});

		test('ayuda de avisos: sin infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/ayuda`);
			await expectSinInfracciones(page);
		});

		test('página de avisos: sin infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/avisos`);
			await expectSinInfracciones(page);
		});
	});
}
