// Decisión de la puerta del texto de privacidad (RF-160, research R10). Pura: los hooks la llaman con la petición.

/** Rutas que no pasan por la puerta: la pantalla que bloquea, el cierre de sesión, la salud, el registro y `robots.txt`. */
const RUTAS_LIBRES = new Set(['/aceptar-privacidad', '/logout', '/api/salud', '/api/registro-cliente', '/robots.txt']);

export type DecisionPrivacidad = 'continuar' | 'redirigir' | 'rechazar';

/**
 * Con privacidad pendiente, una página en GET redirige a `/aceptar-privacidad`. Cualquier otro método y cualquier `/api/*`
 * reciben 403 `PRIVACIDAD_PENDIENTE`.
 */
export function decidirPuertaPrivacidad(ruta: string, metodo: string, pendiente: boolean): DecisionPrivacidad {
	if (!pendiente || RUTAS_LIBRES.has(ruta)) return 'continuar';
	if (metodo === 'GET' && !ruta.startsWith('/api/')) return 'redirigir';
	return 'rechazar';
}
