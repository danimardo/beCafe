import { entornoCliente } from './entorno';
import { registrarEnCliente } from './registro';

// Suscripción push en el navegador (plan F6 D10, RF-105). Pide el permiso solo desde un clic del usuario.
// Único lugar del cliente que llama a `PushManager`. Un fallo se registra con su código y no bloquea nada.

export type EstadoPush = 'no_compatible' | 'denegado' | 'activado' | 'sin_activar';

const RUTA_SUSCRIPCION = '/api/push/suscripcion';

function compatible(): boolean {
	return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Estado de este dispositivo: soporte, permiso y si hay una suscripción activa en el service worker. */
export async function estadoPush(): Promise<EstadoPush> {
	if (!compatible()) return 'no_compatible';
	if (Notification.permission === 'denied') return 'denegado';
	const registro = await navigator.serviceWorker.getRegistration();
	const suscripcion = await registro?.pushManager.getSubscription();
	return suscripcion ? 'activado' : 'sin_activar';
}

/** Pide el permiso, se suscribe con la clave pública VAPID y envía la suscripción al servidor. Llamar solo desde un clic. */
export async function activarPush(): Promise<EstadoPush> {
	const clave = entornoCliente.clavePublicaVapid;
	if (!compatible() || clave === undefined) {
		registrarEnCliente(evento('sin_soporte'));
		return 'no_compatible';
	}
	if ((await Notification.requestPermission()) !== 'granted') {
		registrarEnCliente(evento('sin_permiso'));
		return 'denegado';
	}
	try {
		const registro = await navigator.serviceWorker.ready;
		const suscripcion = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveABytes(clave) });
		const datos = suscripcion.toJSON();
		if (!datos.endpoint || !datos.keys?.p256dh || !datos.keys.auth) throw new Error('SUSCRIPCION_INCOMPLETA');
		const respuesta = await fetch(RUTA_SUSCRIPCION, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ version: 1, endpoint: datos.endpoint, claves: { p256dh: datos.keys.p256dh, auth: datos.keys.auth } }),
		});
		if (!respuesta.ok) throw new Error('SERVIDOR_RECHAZA');
		return 'activado';
	} catch (causa) {
		registrarEnCliente(evento(causa instanceof TypeError ? 'red' : 'servidor'));
		return 'sin_activar';
	}
}

/** Quita la suscripción de este dispositivo en el navegador y en el servidor. */
export async function desactivarPush(): Promise<EstadoPush> {
	try {
		const registro = await navigator.serviceWorker.getRegistration();
		const suscripcion = await registro?.pushManager.getSubscription();
		if (!suscripcion) return 'sin_activar';
		await fetch(RUTA_SUSCRIPCION, {
			method: 'DELETE',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ version: 1, endpoint: suscripcion.endpoint }),
		});
		await suscripcion.unsubscribe();
		return 'sin_activar';
	} catch (causa) {
		registrarEnCliente(evento(causa instanceof TypeError ? 'red' : 'servidor'));
		return 'activado';
	}
}

function evento(motivo: 'sin_permiso' | 'sin_soporte' | 'red' | 'servidor') {
	return { codigo: 'cliente.push_suscripcion_fallida' as const, instante: new Date().toISOString(), campos: { motivo } };
}

/** Convierte la clave VAPID pública (base64url) en bytes para `applicationServerKey`. */
export function claveABytes(clave: string): Uint8Array<ArrayBuffer> {
	const base64 = clave
		.replace(/-/g, '+')
		.replace(/_/g, '/')
		.padEnd(Math.ceil(clave.length / 4) * 4, '=');
	const binario = atob(base64);
	return Uint8Array.from(binario, (letra) => letra.charCodeAt(0));
}
