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

export const esquemasEntorno = {
	ORIGIN: esquemaOrigin,
	DIRECTORIO_DATOS: esquemaDirectorioDatos,
	LOG_LEVEL: esquemaNivelLog,
	ADMIN_INICIAL_EMAIL: esquemaEmailAdminInicial,
	ADMIN_INICIAL_NOMBRE: esquemaNombreAdminInicial,
	TZ: esquemaZonaHoraria,
} as const;

export const variables = defineEnvVars({
	ORIGIN: { schema: esquemaOrigin, public: false, static: false },
	DIRECTORIO_DATOS: { schema: esquemaDirectorioDatos, public: false, static: false },
	LOG_LEVEL: { schema: esquemaNivelLog, public: false, static: false },
	ADMIN_INICIAL_EMAIL: { schema: esquemaEmailAdminInicial, public: false, static: false },
	ADMIN_INICIAL_NOMBRE: { schema: esquemaNombreAdminInicial, public: false, static: false },
	TZ: { schema: esquemaZonaHoraria, public: false, static: false },
});
