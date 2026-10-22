import { test } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// Constitución XI y XVIII: las pantallas de acceso y el perfil, en tema claro y oscuro, sin infracciones de axe.
test.describe('tema claro', () => {
	test.use({ colorScheme: 'light' });

	test('acceso: la entrada no tiene infracciones de axe', async ({ page, servidor }) => {
		await page.goto(`${servidor.url}/login`);
		await expectSinInfracciones(page);
	});

	test('acceso: el enlace no válido no tiene infracciones de axe', async ({ page, servidor }) => {
		await page.goto(`${servidor.url}/acceso/${'A'.repeat(43)}`);
		await expectSinInfracciones(page);
	});

	test('perfil: la pantalla no tiene infracciones de axe', async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/perfil`);
		await expectSinInfracciones(page);
	});
});

test.describe('tema oscuro', () => {
	test.use({ colorScheme: 'dark' });

	test('acceso: la entrada no tiene infracciones de axe', async ({ page, servidor }) => {
		await page.goto(`${servidor.url}/login`);
		await expectSinInfracciones(page);
	});

	test('perfil: la pantalla no tiene infracciones de axe', async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/perfil`);
		await expectSinInfracciones(page);
	});
});
