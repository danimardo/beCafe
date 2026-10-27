import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { darDeAltaCapsula, fotoDePrueba, fotoDosMitades, leerMitades, nombreUnico } from '../fixtures/capsulas';

// Sin JavaScript, «Quitar foto» de una cápsula funciona (RF-272, constitución XVII).
test('CA-272: sin JavaScript, quitar la foto de una cápsula la deja sin foto', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Sin JS quitar');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3', foto: await fotoDePrueba() });
	await page.getByRole('link', { name: new RegExp(nombre) }).first().click();

	await page.getByRole('button', { name: 'Quitar foto', exact: true }).click();

	await expect(page.getByText('Foto quitada.')).toBeVisible();
	await expect(page.getByRole('img', { name: 'Foto actual' })).toHaveCount(0);
});

// Sin JavaScript no hay marco de encuadre: el servidor recorta el centro (RF-273, DEC-137).
test('CA-273: sin JavaScript, la foto de la cápsula se recorta al cuadrado central', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Sin JS centro');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3', foto: await fotoDosMitades() });
	await page.getByRole('link', { name: new RegExp(nombre) }).first().click();

	const foto = page.getByRole('img', { name: 'Foto actual' });
	const respuesta = await page.request.get(new URL((await foto.getAttribute('src')) ?? '', servidor.url).toString());
	const { ancho, alto, izquierda, derecha } = await leerMitades(await respuesta.body());
	expect(ancho).toBe(alto);
	expect(izquierda.r).toBeGreaterThan(200);
	expect(derecha.b).toBeGreaterThan(200);
});
