import { expect, type Page } from '@playwright/test';
import type { ServidorDePrueba } from './servidor';
import { darDeAltaCapsula, nombreUnico } from './capsulas';
import { entrarComo } from './sesiones';

// Datos de prueba de economía (F4). Los nombres son únicos por ejecución, igual que en el catálogo.

/** Da de alta dos tipos como administrador y cierra su sesión para que la persona miembro pueda entrar. */
export async function tiposDeCompra(page: Page, servidor: ServidorDePrueba): Promise<[string, string]> {
	await entrarComo(page, servidor, 'administrador');
	const primero = nombreUnico('Compra');
	const segundo = nombreUnico('Compra');
	await darDeAltaCapsula(page, servidor, { nombre: primero, umbral: '3' });
	await darDeAltaCapsula(page, servidor, { nombre: segundo, umbral: '3' });
	await cerrarSesion(page, servidor);
	return [primero, segundo];
}

/** Da de alta un tipo como administrador y cierra su sesión. Menos pasos que `tiposDeCompra`: menos navegaciones en WebKit. */
export async function tipoDeCompra(page: Page, servidor: ServidorDePrueba): Promise<string> {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Compra');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3' });
	await cerrarSesion(page, servidor);
	return nombre;
}

/** Cierra la sesión desde Perfil (RF-182, CA-182) y espera a estar en `/login`. */
export async function cerrarSesion(page: Page, servidor: ServidorDePrueba): Promise<void> {
	await page.goto(`${servidor.url}/perfil`);
	await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
	await expect(page).toHaveURL(`${servidor.url}/login`);
}

/** Aporta un importe en `/saldos` (RF-030) y espera el aviso de aportación registrada. */
export async function aportar(page: Page, servidor: ServidorDePrueba, importe: string): Promise<void> {
	await page.goto(`${servidor.url}/saldos`);
	// Espera a que la página termine de cargar antes de actuar: en el primer arranque de un navegador, el clic llegaba antes de la hidratación.
	await page.waitForLoadState('load');
	await page.getByRole('textbox', { name: 'Importe', exact: true }).fill(importe);
	await page.getByRole('button', { name: 'Aportar', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Aportación registrada' }).first()).toBeVisible();
}

/** Pone la cantidad y el importe de un tipo en la cuadrícula de `/compras` (RF-197). */
export async function rellenarLineaDeCompra(page: Page, tipo: string, cantidad: string, importe: string): Promise<void> {
	await page.getByRole('spinbutton', { name: `Cantidad de ${tipo}`, exact: true }).fill(cantidad);
	await page.getByRole('textbox', { name: `Importe de ${tipo}`, exact: true }).fill(importe);
}

/**
 * Registra una compra de una cápsula como la persona miembro y devuelve el enlace a su detalle.
 * `confirmarHuchaNegativa` pulsa «Registrar igualmente» (RF-198) si la compra deja la hucha compartida en negativo.
 */
export async function registrarCompra(
	page: Page,
	servidor: ServidorDePrueba,
	tipo: string,
	importe: string,
	confirmarHuchaNegativa = false,
): Promise<string> {
	await page.goto(`${servidor.url}/compras`);
	await page.waitForLoadState('load');
	await rellenarLineaDeCompra(page, tipo, '1', importe);
	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();
	if (confirmarHuchaNegativa) {
		const igualmente = page.getByRole('button', { name: 'Registrar igualmente', exact: true });
		const detalle = /\/compras\/[0-9A-Z]{26}$/;
		await expect.poll(async () => detalle.test(page.url()) || (await igualmente.isVisible())).toBe(true);
		if (!detalle.test(page.url())) await igualmente.click();
	}
	await expect(page).toHaveURL(/\/compras\/[0-9A-Z]{26}$/);
	return page.url();
}

/** Hace un arqueo como administrador: vista previa del efecto, contraseña para confirmar y confirmación (RF-130, RF-133). */
export async function arquear(page: Page, servidor: ServidorDePrueba, contado: string): Promise<void> {
	await page.goto(`${servidor.url}/admin/control`);
	await page.getByRole('textbox', { name: 'Dinero contado en la hucha', exact: true }).fill(contado);
	await page.getByRole('button', { name: 'Ver efecto', exact: true }).first().click();
	await page.getByLabel('Contraseña para confirmar', { exact: true }).first().fill(servidor.siembra.contrasena);
	await page.getByRole('button', { name: 'Confirmar arqueo', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Arqueo registrado' }).first()).toBeVisible();
}

/**
 * Hace un recuento de un tipo como administrador: escribe lo contado, mira el efecto, confirma con la contraseña (RF-090 a RF-092).
 * Las demás cápsulas conservan su cifra registrada, así que no generan diferencia.
 */
export async function recontar(page: Page, servidor: ServidorDePrueba, tipo: string, contado: string): Promise<void> {
	await page.goto(`${servidor.url}/admin/control`);
	await page.waitForLoadState('load');
	const grupo = page.getByRole('group', { name: tipo, exact: true });
	const formulario = page.locator('form').filter({ has: grupo });
	await grupo.getByRole('textbox', { name: 'Cápsulas contadas', exact: true }).fill(contado);
	await formulario.getByRole('button', { name: 'Ver efecto', exact: true }).click();
	await formulario.getByLabel('Contraseña para confirmar', { exact: true }).fill(servidor.siembra.contrasena);
	await formulario.getByRole('button', { name: 'Confirmar recuento', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Recuento registrado' }).first()).toBeVisible();
}
