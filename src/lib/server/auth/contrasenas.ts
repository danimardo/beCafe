import { hash, verify } from '@node-rs/argon2';
import listaComunes from './contrasenas-comunes.txt?raw';

// Contraseñas (RN-047, RN-053, RNF-004; research R6). Argon2id (algoritmo por defecto de @node-rs/argon2) en formato PHC.
// Lo aísla este archivo (ARCHITECTURE.md §11).
const OPCIONES = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

const LONGITUD_MINIMA = 15;
const LONGITUD_MAXIMA = 256;

// Lista de bloqueo, de solo lectura: se carga una vez y no cambia en ejecución.
const COMUNES: ReadonlySet<string> = new Set(listaComunes.split('\n').filter((linea) => linea !== '' && !linea.startsWith('#')));

// Hash de referencia para correos sin persona: el tiempo de respuesta no revela si el correo existe (RF-133).
const HASH_REFERENCIA = '$argon2id$v=19$m=19456,t=2,p=1$7xe6Lcu7RyF31BsCwCrQzw$c9piVUbceGKwwZHsUKUS0dgIRIQqKFUGQH5XwfISfhw';

function normalizar(texto: string): string {
	return texto.normalize('NFC');
}

/** RN-053: de 15 a 256 puntos de código tras NFC, sin reglas de composición y fuera de la lista de bloqueo. */
export function contrasenaAceptable(texto: string): boolean {
	const normal = normalizar(texto);
	const longitud = Array.from(normal).length;
	if (longitud < LONGITUD_MINIMA || longitud > LONGITUD_MAXIMA) return false;
	return !COMUNES.has(normal.toLowerCase());
}

export function hashContrasena(texto: string): Promise<string> {
	return hash(normalizar(texto), OPCIONES);
}

/** Comprueba una contraseña contra su hash. Un hash mal formado cuenta como incorrecto. */
export async function verificarContrasena(hashGuardado: string, texto: string): Promise<boolean> {
	try {
		return await verify(hashGuardado, normalizar(texto));
	} catch {
		return false;
	}
}

/** Gasta el mismo tiempo que una verificación real cuando el correo no existe. Siempre devuelve falso. */
export async function verificarReferencia(texto: string): Promise<false> {
	await verificarContrasena(HASH_REFERENCIA, texto);
	return false;
}
