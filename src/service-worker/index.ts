import { self } from '$app/service-worker';
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';

// Service worker (plan D8, RF-015, RNF-013). Precarga la aplicación compilada, sirve la última pantalla principal guardada
// cuando no hay red y revalida las fotos. No envía la cola de consumos: lo hace la página (plan D5) y no guarda datos
// fuera de su caché (constitución V). Al cerrar sesión borra su caché para no dejar la pantalla de una persona (riesgo residual).

const PREFIJO = 'becafe-';
const CACHE = `${PREFIJO}${version}`;
// Las rutas de `$app/manifest` son relativas a la ruta base de la aplicación.
const ESTATICOS = [...immutable, ...assets].map((recurso) => `/${recurso.path}`);

const HTML_SIN_CONEXION = `<!doctype html><html lang="es-ES"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión · beCafé</title></head><body><main style="font-family:sans-serif;padding:24px"><h1>Sin conexión</h1><p>Esta página no está disponible sin red. Vuelve a intentarlo cuando tengas cobertura.</p></main></body></html>`;

self.addEventListener('install', (evento) => {
	evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ESTATICOS)));
});

self.addEventListener('activate', (evento) => {
	evento.waitUntil(
		(async () => {
			for (const nombre of await caches.keys()) {
				if (nombre.startsWith(PREFIJO) && nombre !== CACHE) await caches.delete(nombre);
			}
		})(),
	);
});

self.addEventListener('fetch', (evento) => {
	const { request } = evento;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	if (request.method === 'POST' && url.pathname === '/logout') {
		evento.respondWith(cerrarSesion(request));
		return;
	}
	if (request.method !== 'GET') return;

	if (request.mode === 'navigate') {
		evento.respondWith(navegar(request, url));
	} else if (url.pathname.startsWith('/fotos/')) {
		evento.respondWith(revalidar(request));
	}
});

/** Envía el cierre de sesión y borra todas las cachés de la aplicación, también sin JavaScript en la página. */
async function cerrarSesion(request: Request): Promise<Response> {
	const respuesta = await fetch(request);
	for (const nombre of await caches.keys()) {
		if (nombre.startsWith(PREFIJO)) await caches.delete(nombre);
	}
	return respuesta;
}

/** Red primero. La pantalla principal se guarda para poder tocar cápsulas sin conexión (plan D8). */
async function navegar(request: Request, url: URL): Promise<Response> {
	const cache = await caches.open(CACHE);
	try {
		const respuesta = await fetch(request);
		if (url.pathname === '/' && respuesta.ok) await cache.put('/', respuesta.clone());
		return respuesta;
	} catch {
		const guardada = url.pathname === '/' ? await cache.match('/') : undefined;
		if (guardada) return guardada;
		return new Response(HTML_SIN_CONEXION, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } });
	}
}

/** Sirve la copia de la caché y actualízala con la respuesta de la red. */
async function revalidar(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);
	const copia = await cache.match(request);
	const red = fetch(request).then(async (respuesta) => {
		if (respuesta.ok) await cache.put(request, respuesta.clone());
		return respuesta;
	});
	return copia ?? red;
}
