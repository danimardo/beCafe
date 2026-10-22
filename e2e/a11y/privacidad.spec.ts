import { test } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// RF-160 y RF-161: el texto de privacidad, en la pantalla de aceptación y en su consulta permanente, sin infracciones de axe.
test.describe('tema claro', () => {
	test.use({ colorScheme: 'light' });

	test('aceptar privacidad: la pantalla no tiene infracciones de axe', async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'pendiente');
		await expectSinInfracciones(page);
	});
});

test.describe('tema oscuro', () => {
	test.use({ colorScheme: 'dark' });

	test('privacidad: la consulta no tiene infracciones de axe', async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/privacidad`);
		await expectSinInfracciones(page);
	});
});
