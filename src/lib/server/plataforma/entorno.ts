// Único archivo de servidor que lee `$app/env/private` (ARCHITECTURE.md §8). Lo importan solo las raíces de composición:
// `hooks.server.ts` y `arranque.ts`. No se reexporta desde `plataforma/index.ts` para que las pruebas no dependan del entorno.
import {
	ADMIN_INICIAL_EMAIL,
	ADMIN_INICIAL_NOMBRE,
	DIRECTORIO_DATOS,
	LOG_LEVEL,
	ORIGIN,
	S3_ACCESS_KEY,
	S3_BUCKET,
	S3_ENDPOINT,
	S3_REGION,
	S3_SECRET_KEY,
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
	/** Copias S3 (plan F8 D8): solo si están las cinco variables. Sin ellas, la copia diaria no se registra. */
	s3:
		S3_ENDPOINT && S3_BUCKET && S3_REGION && S3_ACCESS_KEY && S3_SECRET_KEY
			? { endpoint: S3_ENDPOINT, bucket: S3_BUCKET, region: S3_REGION, claveAcceso: S3_ACCESS_KEY, claveSecreta: S3_SECRET_KEY }
			: undefined,
});
