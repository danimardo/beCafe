import { readFile, writeFile } from 'node:fs/promises';
import { AwsClient } from 'aws4fetch';
import { z } from 'zod';
import type { ConfiguracionS3 } from '#lib/server/plataforma';
import { ErrorCopia, ErrorOperacionCopia } from './errores';
import { leerClave, type TipoCopiaClave } from './dominio/clave-copia';

// Único archivo que importa `aws4fetch` (plan F8 D1, paso 4; plan F14 D1). Nunca devuelve ni registra la URL firmada ni las cabeceras.

export type { ConfiguracionS3 };

/** Tiempo máximo de la subida y de la descarga (plan F8 D1): 10 minutos. */
export const TIEMPO_MAXIMO_SUBIDA_MS = 10 * 60_000;
/** Tiempo máximo del listado del bucket (plan F14 D1). */
export const TIEMPO_MAXIMO_LISTADO_MS = 30_000;
/** Copias que muestra la lista del bucket (RF-253). */
export const LIMITE_COPIAS_BUCKET = 30;
/** Prefijo de todas las copias y de las copias de resguardo (plan F14 D1). */
export const PREFIJO_COPIAS = 'becafe/';
export const PREFIJO_RESGUARDOS = 'becafe/resguardos/';

export type Subidor = (entrada: { clave: string; ruta: string; sha256: string }) => Promise<void>;

/** Copia del bucket tal como la lista S3 (RF-253, data-model.md). */
/** `origen` es `null` en las copias anteriores a F17 (RF-289); `tipo` sale de la clave (RF-287). */
export type CopiaBucket = {
	clave: string;
	tamano: number;
	modificadaEn: string;
	resguardo: boolean;
	origen: string | null;
	tipo: TipoCopiaClave;
};

export type ClienteS3 = {
	subir: Subidor;
	/** Las copias del bucket, la más reciente primero, como máximo 30. */
	listar: () => Promise<CopiaBucket[]>;
	/** Abre `clave` en flujo, sin escribir en disco (descarga del administrador, RF-284). `tamano` es `null` si el bucket no lo dice. */
	abrir: (clave: string) => Promise<{ cuerpo: ReadableStream<Uint8Array>; tamano: number | null }>;
	/** Descarga `clave` en `destino` y devuelve la suma SHA-256 guardada en sus metadatos, o `null` si no la tiene. */
	descargar: (clave: string, destino: string) => Promise<string | null>;
};

/** Clave válida de una copia: solo letras, números, `/`, `.`, `_` y `-` bajo `becafe/`, terminada en `.tar.gz` y sin segmentos `.`, `..` ni vacíos. */
export const esquemaClaveCopia = z
	.string()
	.regex(/^becafe\/[\w/.-]+\.tar\.gz$/)
	.refine((clave) => clave.split('/').every((segmento) => segmento !== '' && segmento !== '.' && segmento !== '..'));

const esquemaContenido = z.object({
	clave: esquemaClaveCopia,
	tamano: z.coerce.number().int().min(0),
	modificadaEn: z.iso.datetime(),
});

/** Extrae las copias de una respuesta XML de `ListObjectsV2`. Ignora los objetos que no son copias (research R3). */
export function analizarListado(xml: string): CopiaBucket[] {
	const copias: CopiaBucket[] = [];
	for (const bloque of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
		const contenido = bloque[1];
		const campo = (nombre: string) => new RegExp(`<${nombre}>([^<]*)</${nombre}>`).exec(contenido)?.[1];
		const leido = esquemaContenido.safeParse({ clave: campo('Key'), tamano: campo('Size'), modificadaEn: campo('LastModified') });
		if (!leido.success) continue;
		const { origen, tipo } = leerClave(leido.data.clave);
		copias.push({ ...leido.data, resguardo: leido.data.clave.startsWith(PREFIJO_RESGUARDOS), origen, tipo });
	}
	return copias.sort((a, b) => b.modificadaEn.localeCompare(a.modificadaEn)).slice(0, LIMITE_COPIAS_BUCKET);
}

function errorDeRespuesta(respuesta: Response): ErrorCopia {
	if (respuesta.status === 401 || respuesta.status === 403) return new ErrorCopia('S3_CREDENCIALES', respuesta.status);
	return new ErrorCopia('S3_RESPUESTA', respuesta.status);
}

/** Crea el cliente del bucket con peticiones firmadas (SigV4, ruta de estilo `endpoint/bucket/clave`). */
export function crearClienteS3(configuracion: ConfiguracionS3): ClienteS3 {
	const cliente = new AwsClient({
		accessKeyId: configuracion.claveAcceso,
		secretAccessKey: configuracion.claveSecreta,
		region: configuracion.region,
		service: 's3',
		// Sin reintentos de la biblioteca: un fallo queda registrado y no se reintenta el mismo día (plan F8 D12-1).
		retries: 0,
	});
	const base = `${configuracion.endpoint}/${configuracion.bucket}`;

	async function pedir(url: string, opciones: RequestInit): Promise<Response> {
		try {
			return await cliente.fetch(url, opciones);
		} catch {
			throw new ErrorCopia('S3_RED');
		}
	}

	return {
		async subir({ clave, ruta, sha256 }) {
			const cuerpo = await readFile(ruta);
			const respuesta = await pedir(`${base}/${clave}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/gzip', 'x-amz-content-sha256': sha256, 'x-amz-meta-sha256': sha256 },
				body: cuerpo,
				signal: AbortSignal.timeout(TIEMPO_MAXIMO_SUBIDA_MS),
			});
			if (!respuesta.ok) throw errorDeRespuesta(respuesta);
		},
		async listar() {
			const respuesta = await pedir(`${base}?list-type=2&prefix=${encodeURIComponent(PREFIJO_COPIAS)}`, {
				method: 'GET',
				signal: AbortSignal.timeout(TIEMPO_MAXIMO_LISTADO_MS),
			});
			if (!respuesta.ok) throw errorDeRespuesta(respuesta);
			return analizarListado(await respuesta.text());
		},
		async abrir(clave) {
			const respuesta = await pedir(`${base}/${clave}`, { method: 'GET', signal: AbortSignal.timeout(TIEMPO_MAXIMO_SUBIDA_MS) });
			if (respuesta.status === 404) throw new ErrorOperacionCopia('NO_ENCONTRADA');
			if (!respuesta.ok) throw errorDeRespuesta(respuesta);
			if (!respuesta.body) throw new ErrorCopia('S3_RESPUESTA', respuesta.status);
			const longitud = Number(respuesta.headers.get('content-length'));
			return {
				cuerpo: respuesta.body,
				tamano: Number.isInteger(longitud) && longitud >= 0 && respuesta.headers.has('content-length') ? longitud : null,
			};
		},
		async descargar(clave, destino) {
			const respuesta = await pedir(`${base}/${clave}`, { method: 'GET', signal: AbortSignal.timeout(TIEMPO_MAXIMO_SUBIDA_MS) });
			if (!respuesta.ok) throw errorDeRespuesta(respuesta);
			await writeFile(destino, Buffer.from(await respuesta.arrayBuffer()));
			return respuesta.headers.get('x-amz-meta-sha256');
		},
	};
}

/** Crea la función que sube un archivo (copia diaria, plan F8 D1). */
export function crearSubidaS3(configuracion: ConfiguracionS3): Subidor {
	return crearClienteS3(configuracion).subir;
}
