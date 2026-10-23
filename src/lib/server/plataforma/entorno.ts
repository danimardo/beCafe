// Único archivo de servidor que lee `$app/env/private` (ARCHITECTURE.md §8). Lo importan solo las raíces de composición:
// `hooks.server.ts` y `arranque.ts`. No se reexporta desde `plataforma/index.ts` para que las pruebas no dependan del entorno.
import {
	ADMIN_INICIAL_EMAIL,
	ADMIN_INICIAL_NOMBRE,
	DIRECTORIO_DATOS,
	LOG_LEVEL,
	ORIGIN,
	VAPID_PRIVATE_KEY,
	VAPID_SUBJECT,
} from '$app/env/private';

export const entorno = Object.freeze({
	origen: ORIGIN,
	directorioDatos: DIRECTORIO_DATOS,
	nivelLog: LOG_LEVEL,
	adminInicialEmail: ADMIN_INICIAL_EMAIL,
	adminInicialNombre: ADMIN_INICIAL_NOMBRE,
	/** Push desactivado si falta alguna de las dos variables (plan F6 D6). La clave pública la deriva el servidor de la privada. */
	vapid: VAPID_PRIVATE_KEY && VAPID_SUBJECT ? { privada: VAPID_PRIVATE_KEY, sujeto: VAPID_SUBJECT } : undefined,
});
