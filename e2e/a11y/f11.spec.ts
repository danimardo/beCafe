import { test, expect } from '../fixtures/errores-navegador';
import { botonDeToque, tipoConCoste } from '../fixtures/consumos';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// F11 (EV-109): Inicio con los tres estados de stock y las páginas de error, en claro y oscuro.
// Ajustes, Perfil, el alta de usuario y la entrada ya están en `acceso`, `admin` y `apariencia` en los dos temas.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`F11, tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('Inicio con una cápsula en stock bajo («Quedan pocas») no tiene infracciones de axe', async ({ page, servidor }) => {
			await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/`);
			await expect(page.getByText('Quedan pocas').first()).toBeVisible();
			await expectSinInfracciones(page);
		});

		test('Inicio con una cápsula sin stock (atenuada) y su diálogo de confirmación no tienen infracciones de axe', async ({
			page,
			servidor,
		}) => {
			const tipo = await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/`);
			await botonDeToque(page, tipo).click();
			await expect(page.getByText('Sin stock').first()).toBeVisible();
			await expectSinInfracciones(page);

			await botonDeToque(page, tipo).click();
			await expect(page.getByRole('alertdialog', { name: 'El sistema dice que no quedan' })).toBeVisible();
			await expectSinInfracciones(page);
		});

		test('las páginas 404 y 403 no tienen infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			for (const ruta of ['/no-existe', '/admin/usuarios']) {
				await page.goto(`${servidor.url}${ruta}`);
				await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
				await expectSinInfracciones(page);
			}
		});
	});
}
