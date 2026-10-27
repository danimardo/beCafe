import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/errores-navegador';
import { darDeAltaCapsula, nombreUnico } from '../fixtures/capsulas';
import { botonDeToque } from '../fixtures/consumos';
import { aportar, cerrarSesion, registrarCompra } from '../fixtures/economia';
import { entrarComo } from '../fixtures/sesiones';

// F14 US3 (CA-258, RF-258): Inicio no mueve las tarjetas mientras la persona sigue en la pantalla; las reordena al volver a entrar.

/** Posición de la tarjeta de un tipo en Inicio. */
async function puestoDe(page: Page, tipo: string): Promise<{ x: number; y: number }> {
	const caja = await page.getByRole('button', { name: new RegExp(`^Registrar ${tipo}(?! para un invitado)`) }).boundingBox();
	if (!caja) throw new Error(`El tipo ${tipo} no está en Inicio`);
	return caja;
}

/** El tipo `primero` está antes que `segundo` en el orden de lectura: más arriba o, en la misma fila, más a la izquierda. */
async function estaAntes(page: Page, primero: string, segundo: string): Promise<boolean> {
	const [a, b] = [await puestoDe(page, primero), await puestoDe(page, segundo)];
	return a.y < b.y || (a.y === b.y && a.x < b.x);
}

test('CA-258: la tarjeta pulsada conserva su puesto durante la visita y sube al recargar', async ({ page, servidor }) => {
	// «A…» va primero por orden alfabético; tras un café de «Z…», RN-090 pondría «Z…» primero.
	const sufijo = nombreUnico('v').replace(/\W/g, '');
	const tipoA = `Avisita ${sufijo}`;
	const tipoZ = `Zvisita ${sufijo}`;
	await entrarComo(page, servidor, 'administrador');
	for (const nombre of [tipoA, tipoZ]) await darDeAltaCapsula(page, servidor, { nombre, umbral: '1' });
	await cerrarSesion(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await aportar(page, servidor, '50,00');
	await registrarCompra(page, servidor, tipoA, '3,48');
	await registrarCompra(page, servidor, tipoZ, '3,48');
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	expect(await estaAntes(page, tipoA, tipoZ)).toBe(true);

	await botonDeToque(page, tipoZ).click();
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipoZ} registrado` })
			.first(),
	).toBeVisible();

	// El servidor ya ordenaría Z primero, pero durante la visita nada se mueve.
	expect(await estaAntes(page, tipoA, tipoZ)).toBe(true);

	// Al volver a entrar, se recalcula (RN-090).
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	expect(await estaAntes(page, tipoZ, tipoA)).toBe(true);
});
