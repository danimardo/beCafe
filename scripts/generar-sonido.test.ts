import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// `scripts/generar-sonido.mjs` contra un servidor ElevenLabs falso: sin red, sin clave real y sin coste (RF-243, plan F12 R5).
const SCRIPT = resolve(process.cwd(), 'scripts/generar-sonido.mjs');
const hayFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
const CLAVE = 'clave-falsa-no-imprimir';
const esquemaPeticion = z.strictObject({ text: z.string(), duration_seconds: z.number(), prompt_influence: z.number() });

/** Un WAV de 1 s con un tono de 880 Hz: ffmpeg lo lee igual que un MP3. */
function audioFalso(): Buffer {
	const frecuencia = 8000;
	const datos = Buffer.alloc(frecuencia * 2);
	for (let n = 0; n < frecuencia; n += 1) datos.writeInt16LE(Math.round(8000 * Math.sin((2 * Math.PI * 880 * n) / frecuencia)), n * 2);
	const cabecera = Buffer.alloc(44);
	cabecera.write('RIFF', 0);
	cabecera.writeUInt32LE(36 + datos.length, 4);
	cabecera.write('WAVEfmt ', 8);
	cabecera.writeUInt32LE(16, 16);
	cabecera.writeUInt16LE(1, 20);
	cabecera.writeUInt16LE(1, 22);
	cabecera.writeUInt32LE(frecuencia, 24);
	cabecera.writeUInt32LE(frecuencia * 2, 28);
	cabecera.writeUInt16LE(2, 32);
	cabecera.writeUInt16LE(16, 34);
	cabecera.write('data', 36);
	cabecera.writeUInt32LE(datos.length, 40);
	return Buffer.concat([cabecera, datos]);
}

describe('generar-sonido (RF-243)', () => {
	let servidor: Server;
	let url: string;
	let estado: number;
	let peticiones: { ruta: string; clave: string | undefined; cuerpo: string }[];
	let directorio: string;

	beforeEach(async () => {
		estado = 200;
		peticiones = [];
		directorio = mkdtempSync(join(tmpdir(), 'sonido-'));
		servidor = createServer((peticion, respuesta) => {
			let cuerpo = '';
			peticion.on('data', (trozo) => (cuerpo += String(trozo)));
			peticion.on('end', () => {
				const clave = peticion.headers['xi-api-key'];
				peticiones.push({ ruta: peticion.url ?? '', clave: typeof clave === 'string' ? clave : undefined, cuerpo });
				respuesta.statusCode = estado;
				respuesta.setHeader('content-type', 'audio/mpeg');
				respuesta.end(estado === 200 ? audioFalso() : `error con ${CLAVE}`);
			});
		});
		await new Promise<void>((listo) => servidor.listen(0, '127.0.0.1', listo));
		const direccion = servidor.address();
		url = typeof direccion === 'object' && direccion ? `http://127.0.0.1:${direccion.port}` : '';
	});

	afterEach(async () => {
		await new Promise((listo) => servidor.close(listo));
		rmSync(directorio, { recursive: true, force: true });
	});

	function ejecutar(argumentos: string[], conClave = true): Promise<{ salida: string; codigo: number | null }> {
		return new Promise((listo, fallo) => {
			const entorno = { ...process.env, ELEVENLABS_API_URL: url, ELEVENLABS_API_KEY: conClave ? CLAVE : '' };
			const proceso = spawn(process.execPath, [SCRIPT, ...argumentos], { cwd: directorio, env: entorno });
			let salida = '';
			proceso.stdout.on('data', (trozo) => (salida += String(trozo)));
			proceso.stderr.on('data', (trozo) => (salida += String(trozo)));
			proceso.on('error', fallo);
			proceso.on('close', (codigo) => listo({ salida, codigo }));
		});
	}

	const candidatos = () => (existsSync(join(directorio, '.local/sonidos')) ? readdirSync(join(directorio, '.local/sonidos')).sort() : []);

	it('pide cada candidato a la API de efectos de sonido con la clave en la cabecera y nunca la imprime', async () => {
		const { salida, codigo } = await ejecutar(['--intentos', '2']);

		expect(codigo).toBe(0);
		expect(peticiones).toHaveLength(2);
		for (const peticion of peticiones) {
			expect(peticion.ruta).toBe('/v1/sound-generation');
			expect(peticion.clave).toBe(CLAVE);
			const cuerpo = esquemaPeticion.parse(JSON.parse(peticion.cuerpo));
			expect(cuerpo.duration_seconds).toBe(1.2);
			expect(cuerpo.text).toContain('celebration');
		}
		expect(candidatos()).toEqual(['candidato-01.mp3', 'candidato-02.mp3']);
		expect(salida).not.toContain(CLAVE);
	});

	it('sin clave no llama a la API', async () => {
		const { salida, codigo } = await ejecutar(['--intentos', '1'], false);

		expect(codigo).toBe(1);
		expect(peticiones).toHaveLength(0);
		expect(salida).toContain('Falta ELEVENLABS_API_KEY');
	});

	it('un error de la API se explica sin el cuerpo de la respuesta ni la clave y no deja candidatos', async () => {
		estado = 401;

		const { salida, codigo } = await ejecutar(['--intentos', '1']);

		expect(codigo).toBe(1);
		expect(salida).toContain('Error HTTP 401 al generar el sonido');
		expect(salida).not.toContain(CLAVE);
		expect(candidatos()).toEqual([]);
	});

	it('rechaza un número de candidatos fuera de rango sin llamar a la API', async () => {
		const { codigo } = await ejecutar(['--intentos', '9']);

		expect(codigo).toBe(1);
		expect(peticiones).toHaveLength(0);
	});

	it.runIf(hayFfmpeg)('elige un candidato: lo guarda en static/mascota/sonidos en 30 KB o menos', async () => {
		await ejecutar(['--intentos', '1']);

		const { salida, codigo } = await ejecutar(['--elegir', '1']);

		const destino = join(directorio, 'static/mascota/sonidos/celebracion.mp3');
		expect(codigo).toBe(0);
		expect(existsSync(destino)).toBe(true);
		expect(statSync(destino).size).toBeLessThanOrEqual(30 * 1024);
		expect(salida).toContain('static/mascota/sonidos/celebracion.mp3');
	});

	it('elegir un candidato que no existe falla sin crear el archivo final', async () => {
		const { salida, codigo } = await ejecutar(['--elegir', '7']);

		expect(codigo).toBe(1);
		expect(salida).toContain('No existe el candidato');
		expect(existsSync(join(directorio, 'static/mascota/sonidos/celebracion.mp3'))).toBe(false);
	});
});
