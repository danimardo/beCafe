import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/errores-navegador';
import { botonDeInvitado, botonDeToque, tipoConCoste } from '../fixtures/consumos';

// F12 US1 (RF-243, RF-244): confeti y sonido al confirmar el servidor un registro; nada si el café queda pendiente.

const RUTA_SONIDO = '/mascota/sonidos/celebracion.mp3';
const CONFETI = '[data-confeti]';

/** Anota, en orden, las rutas de sonido y de locución que pide la página. */
function observarAudio(page: Page): string[] {
	const pedidas: string[] = [];
	page.on('request', (peticion) => {
		const { pathname } = new URL(peticion.url());
		if (pathname === RUTA_SONIDO || (pathname.startsWith('/mascota/voces/') && pathname.endsWith('.json'))) pedidas.push(pathname);
	});
	return pedidas;
}

async function activarVoz(page: Page): Promise<void> {
	await page.addInitScript(() => localStorage.setItem('becafe-voz', 'activa'));
}

test('CA-243: un café propio y uno de invitado muestran el confeti y el sonido suena antes que la locución', async ({ page, servidor }) => {
	await activarVoz(page);
	const audio = observarAudio(page);
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');

	// Las peticiones anteriores (el saludo de Capsulito) no cuentan: se mide desde el toque.
	const previas = audio.length;
	await botonDeToque(page, tipo).click();
	await expect(page.locator(CONFETI)).toHaveCount(1);
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipo} registrado` })
			.first(),
	).toBeVisible();
	await expect.poll(() => audio.includes(RUTA_SONIDO)).toBe(true);
	// El confeti es breve y se retira solo.
	await expect(page.locator(CONFETI)).toHaveCount(0, { timeout: 3000 });

	// El primer toque dejó el tipo en «Sin stock»: el de invitado pide confirmación (RF-217) y celebra al confirmarse.
	await expect(page.getByText('Sin stock').first()).toBeVisible();
	await botonDeInvitado(page, tipo).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Sí, registrar', exact: true }).click();
	await expect(page.locator(CONFETI)).toHaveCount(1);
	expect(audio[previas]).toBe(RUTA_SONIDO);
});

test('CA-243, SC-002: el confeti no bloquea: 10 toques seguidos registran 10 consumos', async ({ page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	const filas = () => page.getByRole('link', { name: /^Consumo · / });
	await page.goto(`${servidor.url}/historial?tipo=consumos`);
	const antes = await filas().count();
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	const boton = botonDeToque(page, tipo);

	// Con una sola cápsula en stock, el primer toque deja el tipo en «Sin stock» y los siguientes piden confirmación (RF-217).
	await boton.click();
	await expect(page.getByText('Sin stock').first()).toBeVisible();
	await expect(page.locator(CONFETI)).toHaveCount(0, { timeout: 3000 });
	for (let i = 0; i < 9; i += 1) {
		const dialogo = page.getByRole('alertdialog');
		await boton.click();
		await dialogo.getByRole('button', { name: 'Sí, registrar', exact: true }).click();
		// El confeti aparece cuando el servidor confirma: así cada toque espera al anterior.
		await expect(page.locator(CONFETI)).toHaveCount(1);
		await expect(dialogo, `toque ${i}`).toBeHidden();
		await expect(page.locator(CONFETI)).toHaveCount(0, { timeout: 3000 });
	}

	await page.goto(`${servidor.url}/historial?tipo=consumos`);
	// La base se comparte entre las pruebas de un worker: se cuenta lo que añaden estos 10 toques.
	await expect(filas()).toHaveCount(antes + 10);
});

test('CA-244: con la voz silenciada hay confeti pero no se pide el sonido', async ({ page, servidor }) => {
	const audio = observarAudio(page);
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');

	await botonDeToque(page, tipo).click();

	await expect(page.locator(CONFETI)).toHaveCount(1);
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipo} registrado` })
			.first(),
	).toBeVisible();
	expect(audio).toEqual([]);
});

test.describe('con movimiento reducido', () => {
	test.use({ reducedMotion: 'reduce' });

	test('CA-244: no hay confeti, pero sí el mensaje y el sonido', async ({ page, servidor }) => {
		await activarVoz(page);
		const audio = observarAudio(page);
		const tipo = await tipoConCoste(page, servidor);
		await page.goto(`${servidor.url}/`);
		await page.waitForLoadState('load');

		await botonDeToque(page, tipo).click();

		await expect(
			page
				.getByRole('status')
				.filter({ hasText: `${tipo} registrado` })
				.first(),
		).toBeVisible();
		await expect.poll(() => audio.includes(RUTA_SONIDO)).toBe(true);
		await expect(page.locator(CONFETI)).toHaveCount(0);
	});
});

test('CA-244: sin red el café queda pendiente, sin confeti ni sonido', async ({ page, servidor }) => {
	await activarVoz(page);
	const audio = observarAudio(page);
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	await page.context().setOffline(true);

	await botonDeToque(page, tipo).click();

	await expect(page.getByText(`${tipo} · Pendiente de enviar`, { exact: true })).toBeVisible();
	await expect(page.locator(CONFETI)).toHaveCount(0);
	expect(audio).not.toContain(RUTA_SONIDO);
});
