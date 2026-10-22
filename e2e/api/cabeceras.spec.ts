import { test, expect } from '../fixtures/errores-navegador';

// RNF-016 (no indexar, cabeceras de seguridad) y RNF-006 (un POST desde otro origen se rechaza).

test('RNF-016: /robots.txt impide indexar la aplicación y lleva X-Robots-Tag', async ({ request, servidor }) => {
	const respuesta = await request.get(`${servidor.url}/robots.txt`);

	expect(respuesta.ok()).toBe(true);
	expect(await respuesta.text()).toContain('Disallow: /');
	expect(respuesta.headers()['x-robots-tag']).toBe('noindex, nofollow');
});

test('RNF-016: las páginas llevan X-Robots-Tag, CSP y Referrer-Policy', async ({ request, servidor }) => {
	const respuesta = await request.get(`${servidor.url}/login`);
	const cabeceras = respuesta.headers();

	expect(cabeceras['x-robots-tag']).toBe('noindex, nofollow');
	expect(cabeceras['referrer-policy']).toBe('strict-origin');
	expect(cabeceras['content-security-policy']).toContain("script-src 'self'");
});

test('RNF-006: un POST desde otro origen recibe 403', async ({ request, servidor }) => {
	const respuesta = await request.post(`${servidor.url}/logout`, {
		headers: { origin: 'https://atacante.example', 'content-type': 'application/x-www-form-urlencoded' },
		data: 'accion=salir',
	});

	expect(respuesta.status()).toBe(403);
});

test('la salud responde 200 con la versión cuando la base responde', async ({ request, servidor }) => {
	const respuesta = await request.get(`${servidor.url}/api/salud`);

	expect(respuesta.status()).toBe(200);
	expect(await respuesta.json()).toMatchObject({ estado: 'ok' });
});

test('RNF-016: /perfil con sesión lleva X-Robots-Tag', async ({ request, servidor }) => {
	const entrada = await request.post(`${servidor.url}/login`, {
		headers: { origin: servidor.url },
		form: { email: servidor.siembra.correos.miembro, contrasena: servidor.siembra.contrasena },
		maxRedirects: 0,
	});
	const cookie = /becafe_sesion=([^;]+)/.exec(entrada.headers()['set-cookie'] ?? '');
	expect(cookie?.[1]).toBeTruthy();

	const perfil = await request.get(`${servidor.url}/perfil`, {
		headers: { cookie: `becafe_sesion=${cookie?.[1] ?? ''}` },
		maxRedirects: 0,
	});

	expect(perfil.status()).toBe(200);
	expect(perfil.headers()['x-robots-tag']).toBe('noindex, nofollow');
});
