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

/** Cierra la sesión desde la pantalla principal y espera a estar en `/login`. */
export async function cerrarSesion(page: Page, servidor: ServidorDePrueba): Promise<void> {
	await page.goto(`${servidor.url}/`);
	await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
	await expect(page).toHaveURL(`${servidor.url}/login`);
}

/** Aporta un importe en `/saldos` (RF-030) y espera el aviso de aportación registrada. */
export async function aportar(page: Page, servidor: ServidorDePrueba, importe: string): Promise<void> {
	await page.goto(`${servidor.url}/saldos`);
	await page.getByRole('textbox', { name: 'Importe', exact: true }).fill(importe);
	await page.getByRole('button', { name: 'Aportar', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Aportación registrada' }).first()).toBeVisible();
}

/**
 * Registra una compra de una cápsula como la persona miembro y devuelve el enlace a su detalle.
 * `confirmarHuchaNegativa` marca la casilla de confirmación (RN-019) cuando la hucha compartida ya está en negativo.
 */
export async function registrarCompra(
	page: Page,
	servidor: ServidorDePrueba,
	tipo: string,
	importe: string,
	confirmarHuchaNegativa = false,
): Promise<string> {
	await page.goto(`${servidor.url}/compras`);
	await page.getByRole('combobox', { name: 'Tipo de cápsula', exact: true }).first().selectOption({ label: tipo });
	await page.getByRole('spinbutton', { name: 'Cantidad', exact: true }).first().fill('1');
	await page.getByRole('textbox', { name: 'Importe', exact: true }).first().fill(importe);
	if (confirmarHuchaNegativa) {
		await page.getByRole('checkbox', { name: 'Registrar aunque la hucha quede en negativo', exact: true }).check();
	}
	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();
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
