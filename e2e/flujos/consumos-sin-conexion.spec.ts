import { test, expect } from '../fixtures/errores-navegador';
import { botonDeToque, tipoConCoste } from '../fixtures/consumos';
import { cerrarSesion } from '../fixtures/economia';

// Cola sin conexión (F3, CA-015, CA-063, EV-041): el toque sin red queda pendiente y se envía una sola vez al volver la red.

test('CA-015: un toque sin red queda «Pendiente de enviar» y, al volver la red, se registra una sola vez', async ({ page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.context().setOffline(true);

	await botonDeToque(page, tipo).click();
	await expect(page.getByText(`${tipo} · Pendiente de enviar`, { exact: true })).toBeVisible();

	await page.context().setOffline(false);
	await expect(page.getByText(`${tipo} · Pendiente de enviar`, { exact: true })).toHaveCount(0);

	await page.goto(`${servidor.url}/`);
	await expect(page.getByRole('link', { name: new RegExp(tipo) })).toHaveCount(1);
});

test('CA-063: «Deshacer» sobre un consumo pendiente lo quita de la cola sin enviarlo', async ({ page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.context().setOffline(true);

	await botonDeToque(page, tipo).click();
	await expect(page.getByText(`${tipo} · Pendiente de enviar`, { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
	await expect(page.getByText(`${tipo} · Pendiente de enviar`, { exact: true })).toHaveCount(0);

	await page.context().setOffline(false);
	await page.goto(`${servidor.url}/`);
	await expect(page.getByRole('link', { name: new RegExp(tipo) })).toHaveCount(0);
});

// Riesgo residual de caché (plan F3): la pantalla guardada no debe sobrevivir al cierre de sesión (constitución V).
test('caché: al cerrar sesión se borran las cachés de la aplicación', async ({ page, servidor }) => {
	await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.evaluate(() => navigator.serviceWorker.ready);
	const cachesDeLaApp = () => page.evaluate(async () => (await caches.keys()).filter((nombre) => nombre.startsWith('becafe-')).length);
	await expect.poll(cachesDeLaApp).toBeGreaterThan(0);

	await cerrarSesion(page, servidor);

	await expect.poll(cachesDeLaApp).toBe(0);
});
