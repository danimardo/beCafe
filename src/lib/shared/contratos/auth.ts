import { z } from 'zod';
import { esquemaCorreo } from './comunes';

// Contratos de los formularios de acceso (RF-131 a RF-137). Son `strictObject`: un campo extra es un error de validación.
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

export const esquemaInicioSesion = z.strictObject({
	email: esquemaCorreo,
	contrasena: z.string({ error: 'Escribe tu contraseña' }).min(1, { error: 'Escribe tu contraseña' }).max(256),
});

const esquemaContrasenaNueva = z.string({ error: 'Escribe una contraseña' }).max(256, { error: 'La contraseña es demasiado larga' });

export const esquemaDefinirContrasena = z
	.strictObject({
		contrasena: esquemaContrasenaNueva,
		repeticion: esquemaContrasenaNueva,
	})
	.refine((datos) => datos.contrasena === datos.repeticion, {
		path: ['repeticion'],
		error: 'Las dos contraseñas no coinciden.',
	});

export const esquemaCambioContrasena = z
	.strictObject({
		contrasenaActual: esquemaContrasenaNueva,
		contrasenaNueva: esquemaContrasenaNueva,
		repeticion: esquemaContrasenaNueva,
	})
	.refine((datos) => datos.contrasenaNueva === datos.repeticion, {
		path: ['repeticion'],
		error: 'Las dos contraseñas no coinciden.',
	});

/** Token de un enlace de acceso: 43 caracteres base64url. */
export const esquemaToken = z.string().regex(TOKEN);
