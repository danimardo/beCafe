import { createServer, type Server } from 'node:http';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Servidor S3 falso para pruebas (plan F8, docs/pruebas.md §8): nunca un bucket real. Guarda los `PUT` en un directorio temporal.

export type RespuestaFalsa = 'ok' | 403 | 404 | 500 | 'sin-respuesta';

export type S3Falso = {
	endpoint: string;
	/** Peticiones recibidas: método, ruta y si llevaba firma SigV4 (sin valores de cabeceras). */
	peticiones: { metodo: string; ruta: string; firmada: boolean }[];
	responder(respuesta: RespuestaFalsa): void;
	cerrar(): Promise<void>;
	/** Cuerpo guardado de la última subida, o `undefined`. */
	ultimaSubida(): Buffer | undefined;
};

export async function crearS3Falso(): Promise<S3Falso> {
	let respuesta: RespuestaFalsa = 'ok';
	const peticiones: S3Falso['peticiones'] = [];
	let cuerpoUltimo: Buffer | undefined;
	const directorio = await mkdtemp(join(tmpdir(), 's3-falso-'));

	const servidor: Server = createServer((peticion, resultado) => {
		const fragmentos: Buffer[] = [];
		peticion.on('data', (trozo: Buffer) => fragmentos.push(trozo));
		peticion.on('end', () => {
			const firmada = (peticion.headers.authorization ?? '').startsWith('AWS4-HMAC-SHA256');
			peticiones.push({ metodo: peticion.method ?? '', ruta: peticion.url ?? '', firmada });
			if (respuesta === 'sin-respuesta') return;
			if (respuesta === 'ok') {
				cuerpoUltimo = Buffer.concat(fragmentos);
				void writeFile(join(directorio, 'ultima'), cuerpoUltimo);
				resultado.writeHead(200).end();
				return;
			}
			resultado.writeHead(respuesta).end();
		});
	});
	await new Promise<void>((resolver) => servidor.listen(0, '127.0.0.1', () => resolver()));
	const direccion = servidor.address();
	if (direccion === null || typeof direccion === 'string') throw new Error('El servidor falso no tiene puerto');

	return {
		endpoint: `http://127.0.0.1:${direccion.port}`,
		peticiones,
		responder(nueva) {
			respuesta = nueva;
		},
		async cerrar() {
			servidor.closeAllConnections();
			await new Promise<void>((resolver) => servidor.close(() => resolver()));
		},
		ultimaSubida: () => cuerpoUltimo,
	};
}
