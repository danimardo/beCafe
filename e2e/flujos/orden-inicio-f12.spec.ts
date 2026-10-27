import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/errores-navegador';
import { darDeAltaCapsula, nombreUnico } from '../fixtures/capsulas';
import { botonDeToque } from '../fixtures/consumos';
import { aportar, cerrarSesion, registrarCompra } from '../fixtures/economia';
import { entrarComo } from '../fixtures/sesiones';

// F12 US3 (RN-090, RF-245): Inicio ordena las cápsulas por lo que más toma la persona o, sin consumos suyos, por el departamento.

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

test('CA-245: Inicio ordena por consumos propios y, sin ellos, por los del departamento; a igualdad, alfabético', async ({
	page,
	servidor,
}) => {
	// «A…» sería el primero por orden alfabético; «Z…» el primero por consumo.
	const sufijo = nombreUnico('o').replace(/\W/g, '');
	const tipoA = `Aorden ${sufijo}`;
	const tipoZ = `Zorden ${sufijo}`;
	await entrarComo(page, servidor, 'administrador');
	for (const nombre of [tipoA, tipoZ]) await darDeAltaCapsula(page, servidor, { nombre, umbral: '1' });
	await cerrarSesion(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await aportar(page, servidor, '50,00');
	await registrarCompra(page, servidor, tipoA, '3,48');
	await registrarCompra(page, servidor, tipoZ, '3,48');

	// Sin consumos todavía, el orden es el alfabético.
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	expect(await estaAntes(page, tipoA, tipoZ)).toBe(true);

	// Dos de Z y uno de A (con «Sin stock» de por medio): ahora Z va primero para quien los toma.
	await botonDeToque(page, tipoZ).click();
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipoZ} registrado` })
			.first(),
	).toBeVisible();
	await botonDeToque(page, tipoZ).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Sí, registrar', exact: true }).click();
	await expect(page.getByRole('alertdialog')).toBeHidden();
	await botonDeToque(page, tipoA).click();
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipoA} registrado` })
			.first(),
	).toBeVisible();
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	expect(await estaAntes(page, tipoZ, tipoA)).toBe(true);
	await cerrarSesion(page, servidor);

	// Otra persona sin consumos suyos recibe el orden del departamento: Z (2) antes que A (1).
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	expect(await estaAntes(page, tipoZ, tipoA)).toBe(true);
});
