import { redirect } from '@sveltejs/kit';
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { arrancar } from './lib/server/arranque';
import { entorno } from './lib/server/plataforma/entorno';
import { NOMBRE_COOKIE, crearActor, opcionesCookie, resolverSesion } from '#lib/server/auth';
import { cerrarRegistro, conOperacion, operacionActual, registrar, respuestaError, type Ambiente } from '#lib/server/plataforma';
import { privacidadPendiente } from '#lib/server/usuarios';
import { VERSION_PRIVACIDAD } from '#lib/shared/privacidad';
import { decidirPuertaPrivacidad } from '#lib/shared/puerta-privacidad';
import { textos } from '#lib/shared/textos';

// Raíz de la petición (research R10, R15, R5). Resuelve la sesión, aplica la puerta de privacidad y añade las cabeceras.
// Un entorno no válido se registra (`app.entorno_invalido`), se vacía el registro y el proceso termina con código 1, sin traza.
let ambiente: Ambiente;
try {
	ambiente = await arrancar({
		origen: entorno.origen,
		directorioDatos: entorno.directorioDatos,
		nivelLog: entorno.nivelLog,
		adminInicialEmail: entorno.adminInicialEmail,
		adminInicialNombre: entorno.adminInicialNombre,
		version: __APP_VERSION__,
		commit: __APP_COMMIT__,
		desarrollo: import.meta.env.DEV,
		carpetaMigraciones: `${process.cwd()}/drizzle`,
		vapid: entorno.vapid,
	});
} catch (error) {
	if (!(error instanceof Error && error.message === 'ENTORNO_NO_VALIDO')) throw error;
	await cerrarRegistro();
	process.exit(1);
}

const CABECERAS_BASE: Record<string, string> = {
	'X-Robots-Tag': 'noindex, nofollow',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function anadirCabeceras(cabeceras: Headers): void {
	for (const [nombre, valor] of Object.entries(CABECERAS_BASE)) cabeceras.set(nombre, valor);
	if (entorno.origen.startsWith('https:')) cabeceras.set('Strict-Transport-Security', 'max-age=31536000');
}

function respuestaRobots(): Response {
	const cabeceras = new Headers({ 'Content-Type': 'text/plain; charset=utf-8' });
	anadirCabeceras(cabeceras);
	return new Response('User-agent: *\nDisallow: /\n', { headers: cabeceras });
}

export const handle: Handle = ({ event, resolve }) =>
	conOperacion(async () => {
		const inicio = performance.now();
		if (event.url.pathname === '/robots.txt') return respuestaRobots();

		event.locals.ambiente = ambiente;
		const token = event.cookies.get(NOMBRE_COOKIE);
		if (token) {
			const sesion = resolverSesion(ambiente.db, token, ambiente.reloj.ahora());
			if (sesion) {
				event.locals.sesion = sesion;
				event.locals.actor = crearActor(sesion);
				if (sesion.renovada) event.cookies.set(NOMBRE_COOKIE, token, opcionesCookie(entorno.origen));
			} else {
				event.locals.tokenNoValido = token;
				event.cookies.delete(NOMBRE_COOKIE, { path: '/' });
			}
		}

		const pendiente = event.locals.sesion !== undefined && privacidadPendiente(event.locals.sesion.usuario, VERSION_PRIVACIDAD);
		const decision = decidirPuertaPrivacidad(event.url.pathname, event.request.method, pendiente);
		if (decision === 'redirigir') redirect(303, '/aceptar-privacidad');
		if (decision === 'rechazar') {
			const respuesta = respuestaError(403, 'PRIVACIDAD_PENDIENTE');
			anadirCabeceras(respuesta.headers);
			return respuesta;
		}

		const respuesta = await resolve(event);
		anadirCabeceras(respuesta.headers);
		registrar('peticion.completada', {
			metodo: event.request.method,
			rutaId: event.route.id ?? 'desconocida',
			estado: respuesta.status,
			duracionMs: Math.round(performance.now() - inicio),
		});
		return respuesta;
	});

// Solo un error no previsto (`kind: 'unknown'`) recibe el texto genérico y el código de incidencia. Un rechazo esperado
// (`error(403, mensaje)`, `error(404)`) conserva su propio mensaje (constitución XIII).
export const handleError: HandleServerError = (entrada) => {
	if (entrada.kind !== 'unknown') return undefined;
	const { error } = entrada;
	registrar('app.error_no_previsto', {
		tipo: error instanceof Error ? error.name : 'desconocido',
		pila: error instanceof Error ? (error.stack ?? '') : '',
	});
	return { message: textos.errorNoPrevisto, codigo: operacionActual() };
};
