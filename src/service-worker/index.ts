import { self } from '$app/service-worker';
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';
import { z } from 'zod';
import { esquemaMensajePush } from '#lib/shared/contratos/push';

const esquemaDatosAviso = z.object({ enlace: esquemaMensajePush.shape.enlace });

// Service worker (plan D8, RF-015, RNF-013). Precarga la aplicación compilada, sirve la última pantalla principal guardada
// cuando no hay red y revalida las fotos. No envía la cola de consumos: lo hace la página (plan D5) y no guarda datos
// fuera de su caché (constitución V). Al cerrar sesión borra su caché para no dejar la pantalla de una persona (riesgo residual).

const PREFIJO = 'becafe-';
const CACHE = `${PREFIJO}${version}`;
// Las rutas de `$app/manifest` son relativas a la ruta base de la aplicación.
// Se excluyen las imágenes de 1024 px, la biblioteca fuente de Rive y las locuciones MP3 opcionales para no inflar la precarga inicial (plan F9 D12).
const ESTATICOS = [
	...immutable,
	...assets.filter(
		(recurso) =>
			!recurso.path.endsWith('-1024.webp') &&
			!recurso.path.endsWith('capsulito-biblioteca.riv') &&
			!recurso.path.endsWith('rive.wasm') &&
			!recurso.path.startsWith('mascota/voces/'),
	),
].map((recurso) => `/${recurso.path}`);

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

// Avisos push (plan F6 D10, RF-105). El mensaje se valida antes de mostrarlo; lo que no cumple el contrato se descarta.
self.addEventListener('push', (evento) => {
	evento.waitUntil(mostrarAviso(evento.data));
});

self.addEventListener('notificationclick', (evento) => {
	evento.notification.close();
	const datos = esquemaDatosAviso.safeParse(evento.notification.data);
	if (!datos.success) return;
	evento.waitUntil(abrirEnlace(datos.data.enlace));
});

async function mostrarAviso(datos: PushMessageData | null): Promise<void> {
	let contenido: unknown;
	try {
		contenido = datos?.json();
	} catch {
		return;
	}
	const resultado = esquemaMensajePush.safeParse(contenido);
	if (!resultado.success) return;
	const mensaje = resultado.data;
	await self.registration.showNotification(mensaje.titulo, {
		body: mensaje.texto,
		icon: '/icon-192.png',
		badge: '/badge-96.png',
		tag: mensaje.tipo,
		data: { enlace: mensaje.enlace },
	});
}

/** Enfoca una ventana de la aplicación abierta y la lleva al enlace; si no hay ninguna, abre una nueva. */
async function abrirEnlace(enlace: string): Promise<void> {
	const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
	const abierta = ventanas.find((ventana) => new URL(ventana.url).origin === self.location.origin);
	if (abierta) {
		await abierta.focus();
		await abierta.navigate(enlace);
		return;
	}
	await self.clients.openWindow(enlace);
}

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
