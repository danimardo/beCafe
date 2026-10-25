import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { expectSinInfracciones } from './axe';

// T078 (chromium-movil): RF-180, RF-181 y EV-061. Solo en el proyecto de móvil, que es el primero de la aplicación (constitución X).
test.skip(({ isMobile, browserName }) => !(isMobile && browserName === 'chromium'), 'Solo en chromium-movil');

test.describe('sistema en oscuro', () => {
	test.use({ colorScheme: 'dark' });

	test('CA-180: sin preferencia, Automático sigue el sistema en oscuro y cambia al instante al pasar a claro', async ({
		page,
		servidor,
	}) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/ajustes`);

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'oscuro');
		await expect(page.getByRole('radio', { name: 'Automático', exact: true })).toBeChecked();

		await page.emulateMedia({ colorScheme: 'light' });
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'claro');
	});

	test('CA-180: elegir Claro conserva el texto escrito y el foco, y persiste al recargar', async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/ajustes`);
		const mascota = page.getByRole('switch', { name: 'Mostrar a Capsulito', exact: true });
		const estadoMascota = await mascota.getAttribute('aria-checked');

		const claro = page.getByRole('radio', { name: 'Claro', exact: true });
		await claro.click();

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'claro');
		await expect(mascota).toHaveAttribute('aria-checked', estadoMascota ?? 'true');
		await expect(claro).toBeFocused();

		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'claro');
	});
});

test.describe('reducir transparencia', () => {
	test('CA-181: con Reducir transparencia, ninguna superficie usa backdrop-filter y siguen las mismas acciones', async ({
		page,
		servidor,
	}) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/ajustes`);

		await page.getByRole('switch', { name: 'Reducir transparencia', exact: true }).click();

		await expect(page.locator('html')).toHaveAttribute('data-transparencia', 'reducida');
		// Los controles animan su transición (motion-safe): se espera al estado final, sin pausas fijas.
		await expect
			.poll(() =>
				page.evaluate(() =>
					Array.from(document.querySelectorAll('*')).some((elemento) => {
						const filtro = getComputedStyle(elemento).backdropFilter;
						return filtro !== '' && filtro !== 'none';
					}),
				),
			)
			.toBe(false);
		await expect(page.getByRole('button', { name: 'Ver la bienvenida otra vez', exact: true })).toBeVisible();
	});
});

test.describe('EV-061: modos de accesibilidad y 320 px', () => {
	test('EV-061: con forced-colors, contraste alto y movimiento reducido, la entrada y el perfil no tienen infracciones de axe', async ({
		page,
		servidor,
	}) => {
		await page.emulateMedia({ forcedColors: 'active', contrast: 'more', reducedMotion: 'reduce' });
		await page.goto(`${servidor.url}/login`);
		await expectSinInfracciones(page);

		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/perfil`);
		await expectSinInfracciones(page);

		await page.goto(`${servidor.url}/ayuda`);
		await expectSinInfracciones(page);

		await page.goto(`${servidor.url}/ayuda/capsulito`);
		await expectSinInfracciones(page);
	});

	test('EV-061: a 320 px de ancho, la página no tiene desplazamiento horizontal', async ({ page, servidor }) => {
		await page.setViewportSize({ width: 320, height: 640 });
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/perfil`);

		const desbordada = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
		expect(desbordada).toBe(false);
	});
});
