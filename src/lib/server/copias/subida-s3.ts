import { readFile } from 'node:fs/promises';
import { AwsClient } from 'aws4fetch';
import { ErrorCopia } from './errores';

// Único archivo que importa `aws4fetch` (plan F8 D1, paso 4). Nunca devuelve ni registra la URL firmada ni las cabeceras.

export type ConfiguracionS3 = {
	endpoint: string;
	bucket: string;
	region: string;
	claveAcceso: string;
	claveSecreta: string;
};

/** Tiempo máximo de la subida (plan F8 D1): 10 minutos. */
export const TIEMPO_MAXIMO_SUBIDA_MS = 10 * 60_000;

export type Subidor = (entrada: { clave: string; ruta: string; sha256: string }) => Promise<void>;

/** Crea la función que sube un archivo con `PUT` firmado (SigV4, ruta de estilo `endpoint/bucket/clave`). */
export function crearSubidaS3(configuracion: ConfiguracionS3): Subidor {
	const cliente = new AwsClient({
		accessKeyId: configuracion.claveAcceso,
		secretAccessKey: configuracion.claveSecreta,
		region: configuracion.region,
		service: 's3',
		// Sin reintentos de la biblioteca: un fallo queda registrado y no se reintenta el mismo día (plan F8 D12-1).
		retries: 0,
	});

	return async ({ clave, ruta, sha256 }) => {
		const cuerpo = await readFile(ruta);
		let respuesta: Response;
		try {
			respuesta = await cliente.fetch(`${configuracion.endpoint}/${configuracion.bucket}/${clave}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/gzip', 'x-amz-content-sha256': sha256, 'x-amz-meta-sha256': sha256 },
				body: cuerpo,
				signal: AbortSignal.timeout(TIEMPO_MAXIMO_SUBIDA_MS),
			});
		} catch {
			throw new ErrorCopia('S3_RED');
		}
		if (respuesta.ok) return;
		if (respuesta.status === 401 || respuesta.status === 403) throw new ErrorCopia('S3_CREDENCIALES', respuesta.status);
		throw new ErrorCopia('S3_RESPUESTA', respuesta.status);
	};
}
