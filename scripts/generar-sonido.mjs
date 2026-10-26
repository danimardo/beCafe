import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarDotEnv } from './generar-voces.mjs';

// Sonido de celebración al registrar un café (RF-243, plan F12 R5). Se genera UNA vez con los efectos de sonido de ElevenLabs y se
// guarda como archivo estático: la aplicación nunca llama a la API. Nunca muestra la clave.
//
//   node scripts/generar-sonido.mjs --intentos 4     # pide 4 candidatos y los guarda en .local/sonidos/
//   node scripts/generar-sonido.mjs --elegir 02      # procesa el candidato 02 a static/mascota/sonidos/celebracion.mp3

export const DESTINO = 'static/mascota/sonidos/celebracion.mp3';
export const DIR_CANDIDATOS = '.local/sonidos';
/** Tope de tamaño del archivo final (plan F12, performance goals). */
export const TAMANO_MAXIMO = 30 * 1024;
export const PETICION = Object.freeze({
	text: 'short cheerful cartoon celebration chime with a tiny party popper, bright, friendly, no voice',
	duration_seconds: 1.2,
	prompt_influence: 0.6,
});
/** Fundido de salida, para que el sonido no corte la locución que sigue. */
const FUNDIDO_SEGUNDOS = 0.15;

export function herramientasDisponibles() {
	return spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
}

/** Pide un candidato a la API de efectos de sonido. `urlApi` solo cambia en las pruebas. Lanza si la API responde con un error. */
export async function pedirCandidato({ apiKey, urlApi = 'https://api.elevenlabs.io' }) {
	const respuesta = await fetch(`${urlApi}/v1/sound-generation`, {
		method: 'POST',
		headers: { 'xi-api-key': apiKey, 'content-type': 'application/json', accept: 'audio/mpeg' },
		body: JSON.stringify(PETICION),
	});
	// El mensaje no incluye el cuerpo de la respuesta ni ninguna cabecera: nada que pueda contener la clave.
	if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status} al generar el sonido`);
	return Buffer.from(await respuesta.arrayBuffer());
}

/** Nombre del candidato `n` (1 → `candidato-01.mp3`). */
export function nombreCandidato(n) {
	return `candidato-${String(n).padStart(2, '0')}.mp3`;
}

/** Guarda `intentos` candidatos y devuelve sus rutas. Se detiene en el primer error de la API. */
export async function generarCandidatos({ intentos, entorno, dirSalida, avisar = () => {} }) {
	mkdirSync(dirSalida, { recursive: true });
	const rutas = [];
	for (let n = 1; n <= intentos; n += 1) {
		const audio = await pedirCandidato(entorno);
		const ruta = join(dirSalida, nombreCandidato(n));
		writeFileSync(ruta, audio);
		rutas.push(ruta);
		avisar(`Candidato ${n} de ${intentos}: ${ruta}`);
	}
	return rutas;
}

/** Argumentos de `ffmpeg`: mono, 48 kbps, sin el silencio inicial y con un fundido de salida. */
export function argumentosDeProceso(entrada, destino, duracion) {
	const inicioFundido = Math.max(0, duracion - FUNDIDO_SEGUNDOS);
	const filtro = [
		'silenceremove=start_periods=1:start_threshold=-50dB',
		`afade=t=out:st=${inicioFundido.toFixed(3)}:d=${FUNDIDO_SEGUNDOS}`,
	].join(',');
	return ['-y', '-loglevel', 'error', '-i', entrada, '-ac', '1', '-af', filtro, '-c:a', 'libmp3lame', '-b:a', '48k', destino];
}

function duracionDe(ruta) {
	const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', ruta], { encoding: 'utf8' });
	const valor = Number(r.stdout.trim());
	return Number.isFinite(valor) && valor > 0 ? valor : PETICION.duration_seconds;
}

/** Procesa un candidato y lo deja en `destino`. Falla si no cabe en el tope de tamaño. */
export function elegirCandidato({ candidato, destino }) {
	if (!existsSync(candidato)) throw new Error(`No existe el candidato ${candidato}`);
	const dir = mkdtempSync(join(tmpdir(), 'sonido-'));
	try {
		const temporal = join(dir, 'celebracion.mp3');
		// Se mide antes de quitar el silencio inicial: el fundido va al final del audio ya recortado, que dura algo menos.
		const duracion = duracionDe(candidato);
		execFileSync('ffmpeg', argumentosDeProceso(candidato, temporal, duracion));
		const bytes = statSync(temporal).size;
		if (bytes > TAMANO_MAXIMO) throw new Error(`El sonido ocupa ${bytes} bytes y el tope es ${TAMANO_MAXIMO}`);
		mkdirSync(resolve(destino, '..'), { recursive: true });
		writeFileSync(destino, readFileSync(temporal));
		return { bytes, duracion };
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

function leerArgumentos(argv) {
	const valor = (nombre) => {
		const i = argv.indexOf(nombre);
		return i >= 0 ? argv[i + 1] : undefined;
	};
	return { intentos: valor('--intentos'), elegir: valor('--elegir') };
}

async function principal() {
	const { intentos, elegir } = leerArgumentos(process.argv.slice(2));
	const dirCandidatos = resolve(process.cwd(), DIR_CANDIDATOS);
	if (elegir) {
		if (!herramientasDisponibles()) return fallar('Falta ffmpeg en el PATH.');
		const candidato = join(dirCandidatos, nombreCandidato(Number(elegir)));
		const { bytes } = elegirCandidato({ candidato, destino: resolve(process.cwd(), DESTINO) });
		return escribir(`Sonido guardado en ${DESTINO} (${bytes} bytes).`);
	}
	if (intentos) {
		const entorno = leerEntorno();
		if (!entorno.apiKey) return fallar('Falta ELEVENLABS_API_KEY en .env o en el entorno. No se genera nada.');
		const n = Number(intentos);
		if (!Number.isInteger(n) || n < 1 || n > 8) return fallar('--intentos admite de 1 a 8 candidatos.');
		const rutas = await generarCandidatos({ intentos: n, entorno, dirSalida: dirCandidatos, avisar: escribir });
		return escribir(`${rutas.length} candidatos en ${DIR_CANDIDATOS}/. Escúchalos y elige uno con --elegir NN.`);
	}
	const existentes = existsSync(dirCandidatos) ? readdirSync(dirCandidatos).length : 0;
	escribir(`Uso: node scripts/generar-sonido.mjs --intentos N | --elegir NN   (candidatos ya guardados: ${existentes})`);
}

function leerEntorno() {
	const archivo = cargarDotEnv();
	return {
		apiKey: process.env.ELEVENLABS_API_KEY || archivo.ELEVENLABS_API_KEY,
		urlApi: process.env.ELEVENLABS_API_URL || undefined,
	};
}

function escribir(texto) {
	process.stdout.write(`${texto}\n`);
}

function fallar(texto) {
	process.stderr.write(`${texto}\n`);
	process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		await principal();
	} catch (causa) {
		fallar(causa instanceof Error ? causa.message : 'Error desconocido');
	}
}
