import { createECDH } from 'node:crypto';
import webpush, { WebPushError } from 'web-push';

// Único archivo que importa `web-push` (plan F6 D6, ARCHITECTURE.md §11). Devuelve solo el código HTTP:
// nunca propaga el endpoint, las claves ni el cuerpo de la respuesta (constitución XVI).

export type SuscripcionEnvio = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Resultado de un envío: el código HTTP, o `0` si no hubo respuesta (red o tiempo agotado). */
export type EnviarPush = (suscripcion: SuscripcionEnvio, mensaje: string) => Promise<{ estado: number }>;

/** Vida máxima del mensaje en el servicio push: 24 horas (plan D6). */
const TTL_SEGUNDOS = 86_400;
const TIEMPO_MAXIMO_MS = 10_000;

/**
 * Deriva la clave pública VAPID (punto P-256 sin comprimir, en base64url) de la privada. Así el servidor no necesita
 * una segunda variable con la misma clave: el secreto se declara una vez.
 */
export function clavePublicaDesde(privada: string): string {
	const ecdh = createECDH('prime256v1');
	ecdh.setPrivateKey(Buffer.from(privada, 'base64url'));
	return ecdh.getPublicKey().toString('base64url');
}

export function crearEnvioWebPush({ publica, privada, sujeto }: { publica: string; privada: string; sujeto: string }): EnviarPush {
	webpush.setVapidDetails(sujeto, publica, privada);
	return async (suscripcion, mensaje) => {
		try {
			const respuesta = await webpush.sendNotification(suscripcion, mensaje, {
				TTL: TTL_SEGUNDOS,
				urgency: 'normal',
				timeout: TIEMPO_MAXIMO_MS,
			});
			return { estado: respuesta.statusCode };
		} catch (causa) {
			return { estado: causa instanceof WebPushError ? causa.statusCode : 0 };
		}
	};
}
