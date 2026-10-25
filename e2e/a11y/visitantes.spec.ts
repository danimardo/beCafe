import { test } from '../fixtures/errores-navegador';
import { expectSinInfracciones } from './axe';
import { tipoConCoste } from '../fixtures/consumos';
import { cerrarSesion } from '../fixtures/economia';
import { entrarComo } from '../fixtures/sesiones';
import { crearEnlaceVisitante, entrarComoVisitante } from '../fixtures/visitantes';

// Constitución XI: las pantallas de visitantes de F10 en tema claro y oscuro (EV-050, EV-061).
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('visitantes, entrada y café de visitante no tienen infracciones de axe', async ({ page, browser, servidor }) => {
			const tipo = await tipoConCoste(page, servidor);
			const enlace = await crearEnlaceVisitante(page, servidor);
			await expectSinInfracciones(page);

			const visitante = await entrarComoVisitante(browser, servidor, enlace, 'Marta');
			await visitante.emulateMedia({ colorScheme: esquema });
			await expectSinInfracciones(visitante);
			await visitante.getByRole('button', { name: `Registrar ${tipo}`, exact: true }).click();
			await visitante.getByText('Pendiente de aprobación', { exact: true }).first().waitFor();
			await expectSinInfracciones(visitante);
			await visitante.goto(enlace);
			await expectSinInfracciones(visitante);
			await visitante.context().close();

			await cerrarSesion(page, servidor);
			await entrarComo(page, servidor, 'administrador');
			await page.goto(`${servidor.url}/admin/visitantes`);
			await expectSinInfracciones(page);
			await page.goto(`${servidor.url}/admin/visitantes?vista=revisados`);
			await expectSinInfracciones(page);
		});
	});
}
