import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { MENSAJES_DIA } from '#lib/shared/mascota/mensajes-dia';

// F15 US1 (RN-091, RF-266): el bocadillo de Inicio muestra el mensaje del día, el mismo todo el día.

/** Los textos del catálogo con el nombre sustituido por un patrón y sin tocar el resto. */
const PATRONES = MENSAJES_DIA.map((mensaje) => {
	const partes = mensaje.texto.split('{nombre}').map((parte) => parte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	return new RegExp(partes.join('[^\\s]+(?:\\s[^\\s]+)?'));
});

function bocadillo(page: Page) {
	return page.locator('[role="group"][aria-label="Capsulito"]');
}

/** Espera a que el bocadillo diga un mensaje del día y devuelve su texto. */
async function mensajeDicho(page: Page): Promise<string> {
	let encontrado = '';
	await expect
		.poll(async () => {
			const contenido = await bocadillo(page).innerText();
			encontrado = PATRONES.some((patron) => patron.test(contenido)) ? contenido.trim() : '';
			return encontrado;
		})
		.not.toBe('');
	return encontrado;
}

test('CA-266: el bocadillo muestra un mensaje del día y es el mismo tras recargar', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	const primero = await mensajeDicho(page);

	await page.reload();
	await page.waitForLoadState('load');
	const segundo = await mensajeDicho(page);
	expect(segundo).toBe(primero);
});
