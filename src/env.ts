import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

// Esquemas de las variables de entorno (ARCHITECTURE.md §8). Son la única declaración.
// Los comandos fuera de SvelteKit los importan y validan `process.env` con ellos.

/** ORIGIN: https, o http solo con localhost o 127.0.0.1 (contrato entorno-y-eventos, aclaración 10). */
export const esquemaOrigin = z.url({ protocol: /^https?$/ }).refine(
	(valor) => {
		const url = new URL(valor);
		return url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
	},
	{ error: 'ORIGIN debe usar https, o http solo con localhost o 127.0.0.1' },
);

export const esquemaDirectorioDatos = z.string().trim().min(1, { error: 'DIRECTORIO_DATOS no puede estar vacío' });

export const esquemaNivelLog = z
	.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'], { error: 'LOG_LEVEL no es un nivel válido' })
	.default('info');

export const esquemaEmailAdminInicial = z.email({ error: 'ADMIN_INICIAL_EMAIL no es un correo válido' }).optional();

export const esquemaNombreAdminInicial = z
	.string({ error: 'ADMIN_INICIAL_NOMBRE no es texto' })
	.trim()
	.min(1, { error: 'ADMIN_INICIAL_NOMBRE no puede estar vacío' })
	.max(80, { error: 'ADMIN_INICIAL_NOMBRE supera los 80 caracteres' })
	.optional();

export const esquemaZonaHoraria = z.literal('Europe/Madrid', { error: 'TZ debe ser Europe/Madrid' });

/** Clave privada VAPID (secreto, solo servidor). Sin ella y sin asunto, el envío push queda desactivado (plan F6 D6). */
export const esquemaClavePrivadaVapid = z.string().trim().min(1, { error: 'VAPID_PRIVATE_KEY no puede estar vacía' }).optional();

/** Asunto VAPID: `mailto:` o una URL `https`. */
export const esquemaAsuntoVapid = z
	.string()
	.trim()
	.refine((valor) => /^(mailto:[^\s@]+@[^\s@]+|https:\/\/\S+)$/.test(valor), { error: 'VAPID_SUBJECT debe ser mailto: o una URL https' })
	.optional();

/** Clave pública VAPID: el navegador la necesita para suscribirse. Es la única variable pública de notificaciones. */
export const esquemaClavePublicaVapid = z.string().trim().min(1, { error: 'PUBLIC_VAPID_KEY no puede estar vacía' }).optional();

export const esquemasEntorno = {
	ORIGIN: esquemaOrigin,
	DIRECTORIO_DATOS: esquemaDirectorioDatos,
	LOG_LEVEL: esquemaNivelLog,
	ADMIN_INICIAL_EMAIL: esquemaEmailAdminInicial,
	ADMIN_INICIAL_NOMBRE: esquemaNombreAdminInicial,
	TZ: esquemaZonaHoraria,
	VAPID_PRIVATE_KEY: esquemaClavePrivadaVapid,
	VAPID_SUBJECT: esquemaAsuntoVapid,
	PUBLIC_VAPID_KEY: esquemaClavePublicaVapid,
} as const;

export const variables = defineEnvVars({
	ORIGIN: { schema: esquemaOrigin, public: false, static: false },
	DIRECTORIO_DATOS: { schema: esquemaDirectorioDatos, public: false, static: false },
	LOG_LEVEL: { schema: esquemaNivelLog, public: false, static: false },
	ADMIN_INICIAL_EMAIL: { schema: esquemaEmailAdminInicial, public: false, static: false },
	ADMIN_INICIAL_NOMBRE: { schema: esquemaNombreAdminInicial, public: false, static: false },
	TZ: { schema: esquemaZonaHoraria, public: false, static: false },
	VAPID_PRIVATE_KEY: { schema: esquemaClavePrivadaVapid, public: false, static: false },
	VAPID_SUBJECT: { schema: esquemaAsuntoVapid, public: false, static: false },
	PUBLIC_VAPID_KEY: { schema: esquemaClavePublicaVapid, public: true, static: false },
});
