import { elegirFoto } from '../fixtures/fotos';
import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { darDeAltaCapsula, fotoDePrueba, fotoDosMitades, leerMitades, nombreUnico } from '../fixtures/capsulas';

// F15 US3 (RF-272): «Quitar foto» deja la cápsula sin foto.

test('CA-272: quitar la foto de una cápsula la deja sin foto y lo confirma', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Quitar foto');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3', foto: await fotoDePrueba() });
	await page
		.getByRole('link', { name: new RegExp(nombre) })
		.first()
		.click();
	await expect(page.getByRole('img', { name: 'Foto actual' })).toBeVisible();

	await page.getByRole('button', { name: 'Quitar foto', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'Foto quitada.' })).toBeVisible();
	await expect(page.getByRole('img', { name: 'Foto actual' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Quitar foto', exact: true })).toHaveCount(0);
});

test('CA-272: una cápsula sin foto no ofrece «Quitar foto»', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Sin foto');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3' });
	await page
		.getByRole('link', { name: new RegExp(nombre) })
		.first()
		.click();

	await expect(page.getByRole('button', { name: 'Quitar foto', exact: true })).toHaveCount(0);
});

// F15 US4 (RF-273, RF-274): el marco de encuadre recorta la zona elegida; el teclado lo maneja.

test('CA-273: la zona elegida con el teclado es la que se guarda en la foto de la cápsula', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Encuadre');
	await page.goto(`${servidor.url}/admin/capsulas/nueva`);
	await page.waitForLoadState('load');
	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(nombre);
	await page.getByRole('textbox', { name: 'Marca', exact: true }).fill('Marca de prueba');
	await page.getByRole('radio', { name: 'Ristretto', exact: true }).check({ force: true });
	await page.getByRole('spinbutton', { name: 'Umbral mínimo (unidades)', exact: true }).fill('3');
	await elegirFoto(page, await fotoDosMitades());

	// Con zoom 125 % y la zona pegada al borde derecho, solo queda la mitad azul.
	await page.getByRole('button', { name: 'Ampliar', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Zoom 125 %' })).toBeVisible();
	await page.getByRole('button', { name: 'Encuadre de la foto' }).focus();
	for (let i = 0; i < 12; i++) await page.keyboard.press('Shift+ArrowRight');

	await page.mouse.move(0, 0);
	await page.getByRole('button', { name: 'Dar de alta', exact: true }).press('Enter');
	await expect(page).toHaveURL(/\/admin\/capsulas\?alta=ok$/);
	await page
		.getByRole('link', { name: new RegExp(nombre) })
		.first()
		.click();

	const foto = page.getByRole('img', { name: 'Foto actual' });
	const respuesta = await page.request.get(new URL((await foto.getAttribute('src')) ?? '', servidor.url).toString());
	const { ancho, alto, izquierda, derecha } = await leerMitades(await respuesta.body());
	expect(ancho).toBe(alto);
	expect(izquierda.b).toBeGreaterThan(200);
	expect(derecha.b).toBeGreaterThan(200);
});

test('CA-273: en Perfil, la foto con encuadre se guarda y el marco muestra la guía redonda', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/perfil`);
	await page.waitForLoadState('load');
	await elegirFoto(page, await fotoDosMitades());

	await expect(page.getByRole('button', { name: 'Encuadre de la foto' })).toBeVisible();
	await expect(page.getByText('La foto se mostrará dentro del círculo.')).toBeVisible();
	await page.getByRole('button', { name: 'Guardar foto', exact: true }).click();
	await expect(page.getByText('Foto guardada.')).toBeVisible();

	// La persona de prueba es compartida con otras pruebas: se deja sin foto.
	await page.getByRole('button', { name: 'Quitar foto', exact: true }).click();
	await expect(page.getByText('Foto quitada.')).toBeVisible();
});

test('CA-274: una zona que no cabe en la foto se rechaza con el error en el campo de la foto', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/perfil`);
	await page.waitForLoadState('load');
	await elegirFoto(page, await fotoDosMitades());
	await expect(page.getByRole('button', { name: 'Encuadre de la foto' })).toBeVisible();
	// Se altera el campo oculto para forzar una zona fuera de la foto: el servidor la vuelve a comprobar.
	await page.evaluate(() => {
		const x = document.querySelector('input[name="encuadreX"]');
		if (x instanceof HTMLInputElement) x.value = '0.95';
	});

	await page.getByRole('button', { name: 'Guardar foto', exact: true }).click();

	await expect(page.getByText('La zona elegida no cabe en la foto. Vuelve a encuadrarla.')).toBeVisible();
});
