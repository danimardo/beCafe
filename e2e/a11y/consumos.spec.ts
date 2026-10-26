import { test } from '../fixtures/errores-navegador';
import { expectSinInfracciones } from './axe';
import { botonDeToque, tipoConCoste } from '../fixtures/consumos';
import { cerrarSesion, recontar } from '../fixtures/economia';
import { entrarComo } from '../fixtures/sesiones';

// Constitución XI y RNF-001: las pantallas de consumos de F3, en tema claro y oscuro, sin infracciones de axe (EV-060).
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('pantalla principal con las cápsulas y los últimos consumos no tiene infracciones de axe', async ({ page, servidor }) => {
			await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/`);
			await expectSinInfracciones(page);
		});

		test('pantalla principal con el aviso «Deshacer» visible no tiene infracciones de axe', async ({ page, servidor }) => {
			const tipo = await tipoConCoste(page, servidor);
			// Con movimiento reducido, el aviso aparece sin su animación de entrada: el contraste se mide sobre el estado final (constitución XI).
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.goto(`${servidor.url}/`);
			await botonDeToque(page, tipo).click();
			await expectSinInfracciones(page);
		});

		test('pantalla principal con un consumo pendiente de enviar no tiene infracciones de axe', async ({ page, servidor }) => {
			const tipo = await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/`);
			await page.context().setOffline(true);
			await botonDeToque(page, tipo).click();
			await expectSinInfracciones(page);
			await page.context().setOffline(false);
		});

		test('pantalla principal con el aviso de recuento no tiene infracciones de axe (RF-246)', async ({ page, servidor }) => {
			const tipo = await tipoConCoste(page, servidor);
			await cerrarSesion(page, servidor);
			await entrarComo(page, servidor, 'administrador');
			await recontar(page, servidor, tipo, '0');
			await cerrarSesion(page, servidor);
			await entrarComo(page, servidor, 'miembro');
			await page.goto(`${servidor.url}/`);
			await page.getByRole('button', { name: 'Entendido', exact: true }).waitFor();
			await expectSinInfracciones(page);
		});

		test('historial de consumos no tiene infracciones de axe', async ({ page, servidor }) => {
			await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/historial`);
			await expectSinInfracciones(page);
		});
	});
}
