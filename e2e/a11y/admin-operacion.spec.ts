import { test } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// Constitución XI y T026: las pantallas de configuración y de copias, en tema claro y oscuro, sin infracciones de axe.
// La pantalla de restaurar una copia necesita un bucket real y el E2E no lo tiene: axe no puede verla aquí (queda para la revisión manual de quickstart.md).
const pantallas = ['/admin/configuracion', '/admin/copias'] as const;

for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		for (const ruta of pantallas) {
			test(`administración: ${ruta} no tiene infracciones de axe`, async ({ page, servidor }) => {
				await entrarComo(page, servidor, 'administrador');
				await page.goto(`${servidor.url}${ruta}`);
				await expectSinInfracciones(page);
			});
		}
	});
}
