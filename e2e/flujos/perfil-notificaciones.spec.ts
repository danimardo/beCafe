import { elegirFoto } from '../fixtures/fotos';
import { test, expect } from '../fixtures/errores-navegador';
import { cerrarSesion } from '../fixtures/economia';
import { entrarComo } from '../fixtures/sesiones';
import { fotoDePrueba } from '../fixtures/capsulas';
import { botonDeToque, tipoConCoste } from '../fixtures/consumos';

// Preferencias de avisos en Ajustes (RF-102, CA-102): el aviso de deuda no se puede desactivar y los demás sí.
test('CA-102: el aviso de deuda aparece siempre activado y «Stock bajo» se puede desactivar', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/ajustes`);

	await expect(page.getByText('Siempre activado')).toBeVisible();
	const stockBajo = page.getByRole('switch', { name: 'Stock bajo', exact: true });
	await expect(stockBajo).toHaveAttribute('aria-checked', 'true');

	await stockBajo.click();

	await expect(page.getByRole('switch', { name: 'Stock bajo', exact: true })).toHaveAttribute('aria-checked', 'false');
	await expect(page.getByText('Preferencia guardada.')).toBeVisible();
});

// Avisos de administración solo para administradores (RF-102).
test('un administrador ve los avisos de administración y un miembro no', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/ajustes`);
	await expect(page.getByRole('switch', { name: 'Stock negativo', exact: true })).toBeVisible();

	await cerrarSesion(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/ajustes`);
	await expect(page.getByRole('switch', { name: 'Stock negativo', exact: true })).toHaveCount(0);
});

// Foto propia (RF-208, CA-208): se sube en Perfil, aparece en la navegación y se puede quitar.
test('CA-208: una persona sube su foto en Perfil, la ve en la navegación y puede quitarla', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/perfil`);
	await page.waitForLoadState('load');
	const fotos = page.locator('img[src^="/fotos/usuarios/"]');
	await expect(fotos).toHaveCount(0);

	await elegirFoto(page, await fotoDePrueba());
	await page.getByRole('button', { name: 'Guardar foto', exact: true }).click();
	await expect(page.getByText('Foto guardada.')).toBeVisible();
	// La navegación lleva otra copia de la foto (oculta en móvil): la de Perfil es la última de la página.
	await expect(fotos.last()).toBeVisible();

	const origen = await fotos.last().getAttribute('src');
	const respuesta = await page.request.get(`${servidor.url}${origen}`);
	expect(respuesta.status()).toBe(200);
	expect(respuesta.headers()['content-type']).toBe('image/webp');

	await page.getByRole('button', { name: 'Quitar foto', exact: true }).click();
	await expect(page.getByText('Foto quitada.')).toBeVisible();
	await expect(fotos).toHaveCount(0);
});

// RF-209: sin foto, las iniciales llevan un color propio de la persona, el mismo en todas las pantallas.
test('CA-209: sin foto, el avatar de una persona tiene el mismo color en Saldos y en Estadísticas', async ({ page, servidor }) => {
	// Estadísticas solo lista personas cuando hay consumos en el periodo: se registra un café de Luis antes.
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await botonDeToque(page, tipo).click();
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipo} registrado` })
			.first(),
	).toBeVisible();
	const colorEn = async (ruta: string): Promise<string> => {
		await page.goto(`${servidor.url}${ruta}`);
		const avatar = page.getByRole('main').getByRole('link', { name: /Luis/ }).first().locator('span[aria-hidden="true"]').first();
		await expect(avatar).toBeVisible();
		return avatar.evaluate((elemento) => getComputedStyle(elemento).backgroundColor);
	};

	const enSaldos = await colorEn('/saldos');
	const enEstadisticas = await colorEn('/estadisticas');

	expect(enSaldos).toBe(enEstadisticas);
	expect(enSaldos).not.toBe('rgba(0, 0, 0, 0)');
});
