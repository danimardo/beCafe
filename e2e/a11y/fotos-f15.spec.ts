import { elegirFoto } from '../fixtures/fotos';
import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { fotoDosMitades } from '../fixtures/capsulas';
import { expectSinInfracciones } from './axe';

// F15 US4 (constitución XI): las pantallas con el marco de encuadre, ya con una foto elegida, sin infracciones de axe en claro y oscuro.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		for (const [pantalla, ruta, rol] of [
			['Perfil', '/perfil', 'miembro'],
			['alta de cápsula', '/admin/capsulas/nueva', 'administrador'],
			['alta de persona', '/admin/usuarios', 'administrador'],
		] as const) {
			test(`${pantalla}: con una foto elegida no tiene infracciones de axe`, async ({ page, servidor }) => {
				await entrarComo(page, servidor, rol);
				await page.goto(`${servidor.url}${ruta}`);
				await page.waitForLoadState('load');
				await elegirFoto(page, await fotoDosMitades());
				await expect(page.getByRole('button', { name: 'Encuadre de la foto' })).toBeVisible();
				await expectSinInfracciones(page);
			});
		}
	});
}
