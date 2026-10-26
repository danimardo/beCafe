import { execFileSync, spawn, spawnSync } from 'node:child_process';
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
const hayFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
const esquemaPeticion = z.looseObject({
	text: z.string(),
	model_id: z.string(),
	voice_settings: z.strictObject({
		stability: z.number(),
		similarity_boost: z.number(),
		style: z.number(),
		use_speaker_boost: z.boolean(),
	}),
});

const MUESTRAS_POR_CARACTER = 400;
const FRECUENCIA = 8000;

/** Qué caracteres suenan: lo que va entre corchetes, los puntos y los espacios junto a ellos son silencio. Es 1 muestra de 0,05 s por carácter. */
function caracteresMudos(unidades: string[]): boolean[] {
	let dentro = false;
	const base = unidades.map((c) => {
		if (c === '[') dentro = true;
		const mudo = dentro || c === '.';
		if (c === ']') dentro = false;
		return mudo;
	});
	const vecino = (k: number) => k >= 0 && k < base.length && base[k];
	return unidades.map((c, i) => base[i] || (c === ' ' && (vecino(i - 1) || vecino(i + 1))));
}

/** Un WAV con un tono por cada carácter que suena y silencio por el resto: ffmpeg lo lee igual que un MP3. */
function audioDe(mudos: boolean[]): Buffer {
	const datos = Buffer.alloc(mudos.length * MUESTRAS_POR_CARACTER * 2);
	mudos.forEach((mudo, i) => {
		if (mudo) return;
		for (let k = 0; k < MUESTRAS_POR_CARACTER; k += 1) {
			const n = i * MUESTRAS_POR_CARACTER + k;
			datos.writeInt16LE(Math.round(8000 * Math.sin((2 * Math.PI * 440 * n) / FRECUENCIA)), n * 2);
		}
	});
	const cabecera = Buffer.alloc(44);
	cabecera.write('RIFF', 0);
	cabecera.writeUInt32LE(36 + datos.length, 4);
	cabecera.write('WAVEfmt ', 8);
	cabecera.writeUInt32LE(16, 16);
	cabecera.writeUInt16LE(1, 20);
	cabecera.writeUInt16LE(1, 22);
	cabecera.writeUInt32LE(FRECUENCIA, 24);
	cabecera.writeUInt32LE(FRECUENCIA * 2, 28);
	cabecera.writeUInt16LE(2, 32);
	cabecera.writeUInt16LE(16, 34);
	cabecera.write('data', 36);
	cabecera.writeUInt32LE(datos.length, 40);
	return Buffer.concat([cabecera, datos]);
}

/** Lo que devolvería ElevenLabs para un texto: su audio y la hora de cada carácter. `sinSilencios` lo hace sonar todo. */
function respuestaFalsa(texto: string, sinSilencios: boolean) {
	const unidades = texto.split('');
	const mudos = sinSilencios ? unidades.map(() => false) : caracteresMudos(unidades);
	return {
		audio_base64: audioDe(mudos).toString('base64'),
		alignment: {
			characters: unidades,
			character_start_times_seconds: unidades.map((_, i) => i * 0.05),
			character_end_times_seconds: unidades.map((_, i) => (i + 1) * 0.05),
		},
	};
}

describe('menú interactivo de voces', () => {
	let servidor: Server;
	let url: string;
	let peticiones: string[];
	let estado: number;
	let sinSilencios: boolean;
	let directorio: string;

	beforeEach(async () => {
		peticiones = [];
		estado = 200;
		sinSilencios = false;
		directorio = mkdtempSync(join(tmpdir(), 'voces-'));
		servidor = createServer((peticion, respuesta) => {
			let cuerpo = '';
			peticion.on('data', (trozo) => (cuerpo += String(trozo)));
			peticion.on('end', () => {
				peticiones.push(cuerpo);
				respuesta.statusCode = estado;
				respuesta.setHeader('content-type', 'application/json');
				respuesta.end(JSON.stringify(respuestaFalsa(esquemaPeticion.parse(JSON.parse(cuerpo)).text, sinSilencios)));
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
	function ejecutar(respuestas: string[], conClave = true, extra: Record<string, string> = {}): Promise<string> {
		return new Promise((listo, fallo) => {
			const pendientes = [...respuestas];
			const entorno = { ...process.env, ELEVENLABS_API_URL: url, ELEVENLABS_API_KEY: conClave ? 'clave-falsa' : '', ...extra };
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

		expect(salida).toContain('0 de 218 generadas');
		expect(salida).toContain('✘ intro_01');
		expect(salida).toContain('Clave de ElevenLabs: encontrada');
		expect(salida).not.toContain('clave-falsa');
	});

	it.runIf(hayFfmpeg)(
		'genera un grupo en tandas de 3 tras confirmar con el número de caracteres, y escribe el MP3 y su pista',
		async () => {
			const salida = await ejecutar(['2', '2', '1', 'n', 's', '0']);

			expect(salida).toMatch(/Se enviarán 9 locuciones a ElevenLabs en 3 tandas \(\d+ caracteres/);
			expect(peticiones).toHaveLength(3);
			expect(archivos()).toHaveLength(18);
			expect(salida).toContain('Completado: 9 generadas');
			// Perfil «natural» de v3 y cada frase envuelta por la respiración y el suspiro que absorben el recorte.
			const primera = esquemaPeticion.parse(JSON.parse(peticiones[0] ?? '{}'));
			expect(primera.model_id).toBe('eleven_v3');
			expect(primera.voice_settings).toEqual({ stability: 0.5, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true });
			expect(primera.text).toContain('[inhales] ... ');
			expect(primera.text).toContain(' ... [sighs]');
			// El audio de cada tanda sin cortar queda aparte para recortarlo de nuevo sin volver a pagar.
			const tandas = readdirSync(join(directorio, '.local/voces-tandas'));
			expect(tandas).toHaveLength(1);
			expect(readdirSync(join(directorio, '.local/voces-tandas', tandas[0] ?? ''))).toHaveLength(6);
			// La pista generada la acepta el mismo esquema con el que la lee la aplicación (RF-187).
			const pista = esquemaPistaLipSync.parse(JSON.parse(readFileSync(join(carpeta(), 'intro_01.json'), 'utf8')));
			expect(pista.audio).toBe('intro_01.mp3');
			expect(pista.cues.length).toBeGreaterThan(0);
		},
	);

	it.runIf(hayFfmpeg)('si no se confirma, no llama a la API ni escribe nada', async () => {
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

	it.runIf(hayFfmpeg)('regenerar guarda antes una copia de lo que sustituye', async () => {
		mkdirSync(carpeta(), { recursive: true });
		writeFileSync(join(carpeta(), 'intro_01.mp3'), 'viejo');
		writeFileSync(join(carpeta(), 'intro_01.json'), '{}');

		const salida = await ejecutar(['2', '3', '1', 's', 's', '0']);

		expect(salida).toContain('ya existe: se guarda una copia');
		expect(peticiones).toHaveLength(1);
		const copias = readdirSync(join(directorio, '.local/voces-copia'));
		expect(copias).toHaveLength(1);
		expect(readFileSync(join(directorio, '.local/voces-copia', copias[0] ?? '', 'intro_01.mp3'), 'utf8')).toBe('viejo');
		// Lo escrito es el corte de la tanda, no el audio viejo.
		expect(readFileSync(join(carpeta(), 'intro_01.mp3')).length).toBeGreaterThan(1000);
		expect(readFileSync(join(carpeta(), 'intro_01.mp3'), 'utf8')).not.toBe('viejo');
	});

	it.runIf(hayFfmpeg)('una frase cuyo corte no sale limpio se vuelve a pedir y, si sigue mal, no sustituye lo que había', async () => {
		mkdirSync(carpeta(), { recursive: true });
		writeFileSync(join(carpeta(), 'intro_01.mp3'), 'viejo');
		writeFileSync(join(carpeta(), 'intro_01.json'), '{}');
		sinSilencios = true;

		const salida = await ejecutar(['2', '3', '1', 's', 's', '0']);

		expect(peticiones).toHaveLength(3);
		expect(salida).toContain('intro_01: no hay silencio antes de la primera palabra; se vuelve a pedir');
		expect(salida).toContain('✘ intro_01: no hay silencio antes de la primera palabra. Sigue como estaba.');
		expect(salida).toContain('Completado: 0 generadas');
		expect(readFileSync(join(carpeta(), 'intro_01.mp3'), 'utf8')).toBe('viejo');
	});

	it('sin ffmpeg avisa y no llama a la API aunque se confirme', async () => {
		const vacio = mkdtempSync(join(tmpdir(), 'sin-ffmpeg-'));
		try {
			const salida = await ejecutar(['2', '1', 's', '0'], true, { PATH: vacio, Path: vacio });

			expect(salida).toContain('Falta ffmpeg en el PATH');
			expect(peticiones).toHaveLength(0);
			expect(archivos()).toEqual([]);
		} finally {
			rmSync(vacio, { recursive: true, force: true });
		}
	});

	it('sin regenerar, lo que ya existe no se envía', async () => {
		mkdirSync(carpeta(), { recursive: true });
		writeFileSync(join(carpeta(), 'intro_01.mp3'), 'viejo');
		writeFileSync(join(carpeta(), 'intro_01.json'), '{}');

		const salida = await ejecutar(['2', '3', '1', 'n', '0']);

		expect(salida).toContain('No hay nada que generar');
		expect(peticiones).toHaveLength(0);
	});

	it.runIf(hayFfmpeg)('un error de la API detiene la generación y deja intacto lo que había', async () => {
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

const esquemaCorte = z.strictObject({
	colocacion: z.array(z.boolean()),
	hablados: z.array(z.string()),
	cortes: z.array(z.strictObject({ ok: z.boolean(), desde: z.number().optional(), hasta: z.number().optional() })),
	colados: z.array(z.boolean()),
	sinSilencio: z.array(z.string().optional()),
	desajuste: z.string(),
	pista: z.strictObject({
		primerCue: z.number(),
		duracion: z.number(),
		cuesEnteros: z.number(),
		cuesCortos: z.number(),
		finMaximoCorto: z.number(),
		duracionCorta: z.number(),
	}),
});

describe('tandas y corte por silencio', () => {
	// Los .mjs no llevan tipos: la lógica pura se ejecuta en un proceso de Node y se lee su resultado, como hace el catálogo.
	const programa = `const { construirTanda, planificarCortes, pistaDeFrase } = await import('./scripts/generar-voces.mjs');
const items = [
	{ id: 'a', texto: 'A', textoVoz: '[excited] ¡Hola! Soy una frase de prueba bastante larga.' },
	{ id: 'b', texto: 'B', textoVoz: 'Segunda frase sin etiquetas, con una coma.' },
	{ id: 'c', texto: 'C', textoVoz: '[cheerful] Tercera frase.' },
];
const tanda = construirTanda(items);
const unidades = tanda.texto.split('');
let dentro = false;
const base = unidades.map((c) => { if (c === '[') dentro = true; const m = dentro || c === '.'; if (c === ']') dentro = false; return m; });
const mudo = unidades.map((c, i) => base[i] === true || (c === ' ' && (base[i - 1] === true || base[i + 1] === true)));
const alineacion = { characters: unidades, character_start_times_seconds: unidades.map((_, i) => i * 0.05), character_end_times_seconds: unidades.map((_, i) => (i + 1) * 0.05) };
const silencios = [];
let desde = null;
mudo.forEach((m, i) => { if (m && desde === null) desde = i * 0.05; if (!m && desde !== null) { silencios.push([desde, i * 0.05]); desde = null; } });
const cortes = planificarCortes(tanda, alineacion, silencios);
const colados = cortes.map((corte, i) => {
	const { inicio } = tanda.partes[i];
	const propio = [inicio, inicio + items[i].textoVoz.length];
	return unidades.some((_, k) => !mudo[k] && (k + 0.5) * 0.05 > corte.desde && (k + 0.5) * 0.05 < corte.hasta && (k < propio[0] || k >= propio[1]));
});
let desajuste = '';
try { planificarCortes(tanda, { ...alineacion, characters: alineacion.characters.slice(1) }, silencios); } catch (e) { desajuste = e.message; }
const corto = pistaDeFrase(alineacion, tanda.partes[1].inicio, items[1].textoVoz.length, cortes[1].desde, cortes[1].desde + 1);
const entera = pistaDeFrase(alineacion, tanda.partes[1].inicio, items[1].textoVoz.length, cortes[1].desde, cortes[1].hasta);
console.log(JSON.stringify({
	colocacion: tanda.partes.map((p, i) => tanda.texto.slice(p.inicio, p.inicio + items[i].textoVoz.length) === items[i].textoVoz),
	hablados: tanda.partes.map((p) => tanda.texto[p.hablado]),
	cortes: cortes.map((c) => ({ ok: c.ok, desde: c.desde, hasta: c.hasta })),
	colados,
	sinSilencio: planificarCortes(tanda, alineacion, []).map((c) => c.motivo),
	desajuste,
	pista: { primerCue: entera.cues[0].start, duracion: entera.duration, cuesEnteros: entera.cues.length, cuesCortos: corto.cues.length, finMaximoCorto: Math.max(...corto.cues.map((c) => c.end)), duracionCorta: corto.duration },
}));`;
	const resultado = esquemaCorte.parse(
		JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', programa], { cwd: process.cwd(), encoding: 'utf8' })),
	);

	it('cada frase queda donde dice la tanda y su primera palabra es la que sigue a sus etiquetas', () => {
		expect(resultado.colocacion).toEqual([true, true, true]);
		expect(resultado.hablados).toEqual(['¡', 'S', 'T']);
	});

	it('corta las tres frases por un silencio, en orden, sin que se cuele audio de otra frase', () => {
		expect(resultado.cortes.every((corte) => corte.ok)).toBe(true);
		const [a, b, c] = resultado.cortes;
		expect(a.desde).toBeLessThan(a.hasta ?? 0);
		expect(a.hasta).toBeLessThanOrEqual(b.desde ?? 0);
		expect(b.hasta).toBeLessThanOrEqual(c.desde ?? 0);
		expect(resultado.colados).toEqual([false, false, false]);
	});

	it('una frase sin silencio alrededor no se corta y dice por qué', () => {
		expect(resultado.sinSilencio).toEqual(Array(3).fill('no hay silencio antes de la primera palabra'));
	});

	it('si la alineación no coincide con el texto enviado, se rechaza', () => {
		expect(resultado.desajuste).toBe('La alineación de ElevenLabs no coincide con el texto enviado.');
	});

	it('la pista de labios se mide desde el principio del corte y ningún cue pasa de la duración del audio', () => {
		const { pista } = resultado;
		expect(pista.primerCue).toBeGreaterThanOrEqual(0);
		expect(pista.cuesEnteros).toBeGreaterThan(pista.cuesCortos);
		expect(pista.cuesCortos).toBeGreaterThan(0);
		expect(pista.finMaximoCorto).toBeLessThanOrEqual(pista.duracionCorta);
	});
});
