import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// F17 (RF-286, RF-287): la pantalla de copias con S3 y la confirmación abierta no tienen infracciones de axe en claro y oscuro.
test.use({ conS3: true });

for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('CA-286: copias con la confirmación abierta y un fallo explicado no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'administrador');
			await page.goto(`${servidor.url}/admin/copias`);
			await page.getByText('Hacer copia ahora', { exact: true }).click();
			await expectSinInfracciones(page);

			await page.getByRole('button', { name: 'Sí, hacer la copia', exact: true }).click();
			await expect(page.getByRole('status').filter({ hasText: 'No se pudo hacer la copia' }).first()).toBeVisible();
			await expectSinInfracciones(page);
		});
	});
}
