import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { esquemaPistaLipSync } from '../src/lib/shared/contratos/apariencia';
import { CATALOGO_AYUDA } from '../src/lib/shared/ayuda/pantallas';
import { PASOS_TOUR } from '../src/lib/shared/ayuda/tour';
import { FRASES_REGISTRO, FRASES_SALUDO } from '../src/lib/shared/mascota/frases';

// Menú de `voces.sh` / `voces.ps1` (scripts/voces-interactivo.mjs) contra un servidor ElevenLabs falso: sin red, sin clave real y sin coste.
const SCRIPT = resolve(process.cwd(), 'scripts/voces-interactivo.mjs');
const AUDIO_FALSO = Buffer.from('audio-falso').toString('base64');

describe('menú interactivo de voces', () => {
	let servidor: Server;
	let url: string;
	let peticiones: string[];
	let estado: number;
	let directorio: string;

	beforeEach(async () => {
		peticiones = [];
		estado = 200;
		directorio = mkdtempSync(join(tmpdir(), 'voces-'));
		servidor = createServer((peticion, respuesta) => {
			let cuerpo = '';
			peticion.on('data', (trozo) => (cuerpo += String(trozo)));
			peticion.on('end', () => {
				peticiones.push(cuerpo);
				respuesta.statusCode = estado;
				respuesta.setHeader('content-type', 'application/json');
				respuesta.end(
					JSON.stringify({
						audio_base64: AUDIO_FALSO,
						alignment: {
							characters: ['h', 'o', 'l', 'a'],
							character_start_times_seconds: [0, 0.1, 0.2, 0.3],
							character_end_times_seconds: [0.1, 0.2, 0.3, 0.4],
						},
					}),
				);
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

	/** Lanza el menú y contesta cada pregunta (todas acaban en «: ») con la siguiente respuesta. */
	function ejecutar(respuestas: string[], conClave = true): Promise<string> {
		return new Promise((listo, fallo) => {
			const pendientes = [...respuestas];
			const entorno = { ...process.env, ELEVENLABS_API_URL: url, ELEVENLABS_API_KEY: conClave ? 'clave-falsa' : '' };
			const proceso = spawn(process.execPath, [SCRIPT], { cwd: directorio, env: entorno });
			let salida = '';
			proceso.stdout.on('data', (trozo) => {
				salida += String(trozo);
				if (String(trozo).endsWith(': ')) {
					const siguiente = pendientes.shift();
					if (siguiente !== undefined) proceso.stdin.write(`${siguiente}\n`);
					else proceso.stdin.end();
				}
			});
			proceso.on('error', fallo);
			proceso.on('close', () => listo(salida));
		});
	}

	const carpeta = () => join(directorio, 'static/mascota/voces');
	const archivos = () => (existsSync(carpeta()) ? readdirSync(carpeta()).sort() : []);

	it('muestra el estado del catálogo y nunca la clave', async () => {
		const salida = await ejecutar(['1', '0']);

		expect(salida).toContain('0 de 217 generadas');
		expect(salida).toContain('✘ intro_01');
		expect(salida).toContain('Clave de ElevenLabs: encontrada');
		expect(salida).not.toContain('clave-falsa');
	});

	it('genera un grupo tras confirmar con el número de caracteres, y escribe el MP3 y su pista', async () => {
		const salida = await ejecutar(['2', '2', '1', 'n', 's', '0']);

		expect(salida).toMatch(/Se enviarán 8 locuciones a ElevenLabs \(\d+ caracteres/);
		expect(peticiones).toHaveLength(8);
		expect(archivos()).toHaveLength(16);
		expect(salida).toContain('Completado: 8 generadas');
		// La pista generada la acepta el mismo esquema con el que la lee la aplicación (RF-187).
		const pista = esquemaPistaLipSync.parse(JSON.parse(readFileSync(join(carpeta(), 'intro_01.json'), 'utf8')));
		expect(pista.audio).toBe('intro_01.mp3');
		expect(pista.cues.length).toBeGreaterThan(0);
	});

	it('si no se confirma, no llama a la API ni escribe nada', async () => {
		const salida = await ejecutar(['2', '1', 'n', '0']);

		expect(salida).toContain('Cancelado: no se ha llamado a la API');
		expect(peticiones).toHaveLength(0);
		expect(archivos()).toEqual([]);
	});

	it('sin clave avisa y no genera aunque se confirme', async () => {
		const salida = await ejecutar(['2', '1', '0'], false);

		expect(salida).toContain('Falta ELEVENLABS_API_KEY');
		expect(peticiones).toHaveLength(0);
	});

	it('regenerar guarda antes una copia de lo que sustituye', async () => {
		mkdirSync(carpeta(), { recursive: true });
		writeFileSync(join(carpeta(), 'intro_01.mp3'), 'viejo');
		writeFileSync(join(carpeta(), 'intro_01.json'), '{}');

		const salida = await ejecutar(['2', '3', '1', 's', 's', '0']);

		expect(salida).toContain('ya existe: se guarda una copia');
		expect(peticiones).toHaveLength(1);
		const copias = readdirSync(join(directorio, '.local/voces-copia'));
		expect(copias).toHaveLength(1);
		expect(readFileSync(join(directorio, '.local/voces-copia', copias[0] ?? '', 'intro_01.mp3'), 'utf8')).toBe('viejo');
		expect(readFileSync(join(carpeta(), 'intro_01.mp3'), 'utf8')).toBe('audio-falso');
	});

	it('sin regenerar, lo que ya existe no se envía', async () => {
		mkdirSync(carpeta(), { recursive: true });
		writeFileSync(join(carpeta(), 'intro_01.mp3'), 'viejo');
		writeFileSync(join(carpeta(), 'intro_01.json'), '{}');

		const salida = await ejecutar(['2', '3', '1', 'n', '0']);

		expect(salida).toContain('No hay nada que generar');
		expect(peticiones).toHaveLength(0);
	});

	it('un error de la API detiene la generación y deja intacto lo que había', async () => {
		mkdirSync(carpeta(), { recursive: true });
		writeFileSync(join(carpeta(), 'intro_01.mp3'), 'viejo');
		writeFileSync(join(carpeta(), 'intro_01.json'), '{}');
		estado = 500;

		const salida = await ejecutar(['2', '3', '1', 's', 's', '0']);

		expect(salida).toContain('Error HTTP 500 al generar intro_01');
		expect(salida).toContain('Me detengo: 0 de 1 generadas');
		expect(readFileSync(join(carpeta(), 'intro_01.mp3'), 'utf8')).toBe('viejo');
	});

	it('una selección no válida no genera nada', async () => {
		const salida = await ejecutar(['2', '3', '9999', '0']);

		expect(salida).toContain('Selección no válida');
		expect(peticiones).toHaveLength(0);
	});
});

const esquemaCatalogo = z.strictObject({ ids: z.array(z.string()), grupos: z.array(z.string()) });

describe('catálogo de locuciones de F11 (RF-237)', () => {
	// Los .mjs no llevan tipos: se leen en un proceso de Node, como hace el menú.
	const programa = `const { LOCUCIONES } = await import('./scripts/generar-voces.mjs');
const { grupoDe } = await import('./scripts/voces-interactivo.mjs');
console.log(JSON.stringify({ ids: LOCUCIONES.map((i) => i.id), grupos: [...new Set(LOCUCIONES.map((i) => grupoDe(i.id)))] }));`;
	const { ids, grupos } = esquemaCatalogo.parse(
		JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', programa], { cwd: process.cwd(), encoding: 'utf8' })),
	);

	it('CA-237: los identificadores son únicos y entran 196 locuciones nuevas', () => {
		expect(new Set(ids).size).toBe(ids.length);
		const nuevas = ids.filter((id) => /^(registro|saludo|tour|ayuda)_/.test(id));
		expect(nuevas).toHaveLength(FRASES_REGISTRO.length + FRASES_SALUDO.length + PASOS_TOUR.length + Object.keys(CATALOGO_AYUDA).length);
		expect(nuevas).toHaveLength(196);
	});

	it('CA-237: cada frase, paso del tour y pantalla de ayuda tiene su locución', () => {
		for (const frase of [...FRASES_REGISTRO, ...FRASES_SALUDO]) expect(ids).toContain(frase.id);
		for (const paso of PASOS_TOUR) expect(ids).toContain(paso.id);
		for (const pantalla of Object.keys(CATALOGO_AYUDA)) expect(ids).toContain(`ayuda_${pantalla}`);
	});

	it('CA-237: se retiran las locuciones de café apuntado y de invitado anteriores', () => {
		expect(ids.filter((id) => /^consumo_(confirmado|invitado)_/.test(id))).toEqual([]);
	});

	it('CA-237: el menú ofrece los grupos registro, saludo, tour y ayuda', () => {
		for (const grupo of ['registro', 'saludo', 'tour', 'ayuda']) expect(grupos).toContain(grupo);
	});
});
