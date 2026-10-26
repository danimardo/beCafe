import { test } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { nombreUnico } from '../fixtures/capsulas';
import { darDeAltaPersona } from '../fixtures/usuarios';
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

		// F12: el alta deja el enlace bajo su botón y la ficha lo genera de nuevo bajo «Generar enlace».
		test('administración: el alta con el enlace y la ficha con el enlace generado no tienen infracciones de axe', async ({
			page,
			servidor,
		}) => {
			await entrarComo(page, servidor, 'administrador');
			const nombre = nombreUnico('Axe');
			await darDeAltaPersona(page, servidor, nombre);
			await page.getByRole('textbox', { name: 'Enlace de acceso', exact: true }).waitFor();
			await expectSinInfracciones(page);

			await page.getByRole('link', { name: nombre }).first().click();
			await page.waitForLoadState('load');
			await page.getByRole('button', { name: 'Generar enlace', exact: true }).click();
			await page.getByRole('textbox', { name: 'Enlace de acceso', exact: true }).waitFor();
			await expectSinInfracciones(page);
		});
	});
}
