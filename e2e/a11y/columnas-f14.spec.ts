import { test } from '../fixtures/errores-navegador';
import { tipoConCoste } from '../fixtures/consumos';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// F14 US6 (RF-261, RF-263): Compras y las pantallas de administración con dos columnas, sin infracciones de axe en claro y oscuro.
const pantallasDeAdministracion = ['/admin/usuarios', '/admin/control', '/admin/capsulas'] as const;

for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema, viewport: { width: 1280, height: 900 } });

		test('Compras con un tipo en stock bajo: sin infracciones de axe', async ({ page, servidor }) => {
			await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/compras`);
			await page.waitForLoadState('load');
			await expectSinInfracciones(page);
		});

		for (const ruta of pantallasDeAdministracion) {
			test(`administración: ${ruta} en dos columnas no tiene infracciones de axe`, async ({ page, servidor }) => {
				await entrarComo(page, servidor, 'administrador');
				await page.goto(`${servidor.url}${ruta}`);
				await page.waitForLoadState('load');
				await expectSinInfracciones(page);
			});
		}
	});
}
