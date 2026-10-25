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

	test('ajustes: la pantalla no tiene infracciones de axe', async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/ajustes`);
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

	test('ajustes: la pantalla no tiene infracciones de axe', async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/ajustes`);
		await expectSinInfracciones(page);
	});
});

// RF-195: la bienvenida de antes de entrar, en sus dos pantallas (Empezar y escena 1), en los dos temas.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`bienvenida antes de entrar, tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('«Empezar» y la primera escena no tienen infracciones de axe', async ({ browser, servidor }) => {
			const contexto = await browser.newContext({ colorScheme: esquema });
			const pagina = await contexto.newPage();
			await pagina.goto(`${servidor.url}/login`);
			await pagina.getByRole('dialog').getByRole('button', { name: 'Empezar', exact: true }).waitFor();
			await expectSinInfracciones(pagina);
			await pagina.getByRole('button', { name: 'Empezar', exact: true }).click();
			await pagina.getByText('Escena 1 de 8').waitFor();
			await expectSinInfracciones(pagina);
			await contexto.close();
		});
	});
}
