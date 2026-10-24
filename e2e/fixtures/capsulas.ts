import { expect, type Page } from '@playwright/test';
import sharp from 'sharp';
import type { ServidorDePrueba } from './servidor';

// Datos de prueba del catálogo de F2. Los nombres son únicos por ejecución para no chocar con otras pruebas del mismo servidor.
export function nombreUnico(base: string): string {
	return `${base} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// Foto JPEG real generada en la prueba: el servidor valida el contenido, no la extensión (RF-005).
export async function fotoDePrueba(): Promise<Buffer> {
	return sharp({ create: { width: 640, height: 480, channels: 3, background: { r: 120, g: 70, b: 40 } } })
		.jpeg()
		.toBuffer();
}

export type DatosAlta = { nombre: string; umbral: string; foto?: Buffer };

/** Rellena y envía el alta de un tipo en `/admin/capsulas/nueva` y espera la respuesta. Con éxito, la aplicación vuelve al listado de cápsulas; con un rechazo, se queda en el formulario. */
export async function darDeAltaCapsula(page: Page, servidor: ServidorDePrueba, datos: DatosAlta): Promise<void> {
	await page.goto(`${servidor.url}/admin/capsulas/nueva`);
	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(datos.nombre);
	await page.getByRole('textbox', { name: 'Marca', exact: true }).fill('Marca de prueba');
	await page.getByRole('radio', { name: 'Ristretto', exact: true }).check({ force: true });
	await page.getByRole('spinbutton', { name: 'Umbral mínimo (unidades)', exact: true }).fill(datos.umbral);
	if (datos.foto) {
		await page.getByLabel('Hacer o elegir foto').setInputFiles({ name: 'foto.jpg', mimeType: 'image/jpeg', buffer: datos.foto });
	}
	const respuesta = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/admin/capsulas/nueva'));
	// El puntero se aparta a la esquina (solo hay navegación, que precarga al tocar) y se envía con el teclado. Si quedara
	// sobre las filas del listado, SvelteKit precargaría una ficha que la navegación siguiente del test corta (WebKit lo
	// registra como excepción).
	await page.mouse.move(0, 0);
	await page.getByRole('button', { name: 'Dar de alta', exact: true }).press('Enter');
	const resultado = await respuesta;
	// Con éxito, la acción redirige al listado: se espera a que cargue para que la navegación siguiente del test no la corte.
	const redirige = resultado.status() === 303 || (await resultado.text()).includes('"type":"redirect"');
	if (redirige) await expect(page).toHaveURL(/\/admin\/capsulas\?alta=ok$/);
}

/** Espera a que el tipo aparezca en la pantalla principal del panel de stock bajo. */
export async function esperarEnPanelDeStock(page: Page, nombre: string): Promise<void> {
	await expect(page.getByText(nombre, { exact: true })).toBeVisible();
}
