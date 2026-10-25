import { test } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// Constitución XI y RNF-001: las pantallas nuevas de F5 (saldos, historial y estadísticas), en tema claro y oscuro.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('saldos de todas las personas no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/saldos`);
			await expectSinInfracciones(page);
		});

		test('saldos del administrador con «Para» y el detalle de aportaciones de una persona no tienen infracciones de axe', async ({
			page,
			servidor,
		}) => {
			await entrarComo(page, servidor, 'administrador');
			await page.goto(`${servidor.url}/saldos`);
			await expectSinInfracciones(page);
			await page
				.getByRole('link', { name: /^Marta/ })
				.first()
				.click();
			await page.getByRole('heading', { level: 1, name: 'Aportaciones de Marta' }).waitFor();
			await expectSinInfracciones(page);
		});

		test('historial con filtros no tiene infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/historial`);
			await expectSinInfracciones(page);
		});

		test('estadísticas del departamento con datos y sus tablas abiertas no tienen infracciones de axe', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/estadisticas?periodo=ultimos12`);
			await expectSinInfracciones(page);
			for (const resumen of await page.getByText('Ver datos').all()) await resumen.click();
			await expectSinInfracciones(page);
		});
	});
}
