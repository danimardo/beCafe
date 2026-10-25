import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { CAPSULA_DE_PRUEBA, RUTAS_API_PROTEGIDAS, RUTAS_DE_ADMINISTRACION, RUTAS_PROTEGIDAS } from './rutas';

// EV-050: sin sesión, cada ruta protegida lleva a la entrada; un miembro no entra en la administración.
for (const ruta of RUTAS_PROTEGIDAS) {
	test(`EV-050: sin sesión, ${ruta} lleva a la entrada`, async ({ page, servidor }) => {
		await page.goto(`${servidor.url}${ruta}`);
		await expect(page).toHaveURL(`${servidor.url}/login`);
	});
}

for (const ruta of RUTAS_DE_ADMINISTRACION) {
	test(`EV-050: un miembro no puede ver ${ruta}`, async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}${ruta}`);
		await expect(page.getByText('No tienes permiso para hacer esto.')).toBeVisible();
	});
}

// EV-050: la foto de un tipo responde 401 sin sesión; no redirige a la entrada porque no es una página.
test('EV-050: sin sesión, la foto de un tipo responde 401', async ({ request, servidor }) => {
	const respuesta = await request.get(`${servidor.url}/fotos/${CAPSULA_DE_PRUEBA}`, { maxRedirects: 0 });
	expect(respuesta.status()).toBe(401);
});

// EV-050: la foto de un ticket también responde 401 sin sesión (F4).
test('EV-050: sin sesión, la foto de un ticket responde 401', async ({ request, servidor }) => {
	const respuesta = await request.get(`${servidor.url}/fotos/compras/${CAPSULA_DE_PRUEBA}`, { maxRedirects: 0 });
	expect(respuesta.status()).toBe(401);
});

// EV-050: la foto de una persona (F10, RF-208) responde 401 sin sesión.
test('EV-050: sin sesión, la foto de una persona responde 401', async ({ request, servidor }) => {
	const respuesta = await request.get(`${servidor.url}/fotos/usuarios/${CAPSULA_DE_PRUEBA}`, { maxRedirects: 0 });
	expect(respuesta.status()).toBe(401);
});

// EV-050: un POST a la API de consumos sin sesión responde 401 y no registra nada (F3, plan D6).
for (const ruta of RUTAS_API_PROTEGIDAS) {
	test(`EV-050: sin sesión, POST ${ruta} responde 401`, async ({ request, servidor }) => {
		const respuesta = await request.post(`${servidor.url}${ruta}`, {
			headers: { 'content-type': 'application/json', origin: servidor.url },
			data: {},
		});
		expect(respuesta.status()).toBe(401);
	});
}
