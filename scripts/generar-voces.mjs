import { spawnSync, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOGO_AYUDA } from '../src/lib/shared/ayuda/pantallas.ts';
import { PASOS_TOUR } from '../src/lib/shared/ayuda/tour.ts';
import { FRASES_REGISTRO, FRASES_SALUDO } from '../src/lib/shared/mascota/frases.ts';

// Generador local de locuciones MP3 y pistas de sincronización labial JSON con ElevenLabs v3 (RF-187, DEC-115, ADR-0006).
// Uso: `npm run voces:generar` (o `node scripts/generar-voces.mjs [--force]`).
// Lee ELEVENLABS_API_KEY y ELEVENLABS_VOICE_ID desde `.env` o variables de entorno, sin exponer nunca la clave.
// Necesita `ffmpeg` en el PATH. ElevenLabs v3 recorta a veces el principio y el final de cada audio, así que no se pide
// una locución por llamada: se piden en tandas de 3 con una frase de relleno a cada extremo (que absorbe el recorte) y
// cada frase se corta después por un silencio real (docs/adr/0006, apartado «Generación en tandas»).

const ETIQUETAS_RISA = new Set(['laughs', 'laughing', 'chuckles', 'giggles', 'risas', 'risa']);

/** Catálogo de locuciones pregeneradas en `static/mascota/voces/`. */
const LOCUCIONES_BASE = [
	{
		id: 'intro_01',
		texto: 'Soy tu compañero de café en el departamento. Te ayudo a saber qué cápsulas quedan y cómo va nuestra hucha común.',
		textoVoz:
			'[excited] ¡Hola! [chuckles] Soy Capsulito. Soy tu compañero de café en el departamento. Te ayudo a saber qué cápsulas quedan y cómo va nuestra hucha común.',
	},
	{
		id: 'intro_02',
		texto: 'Sin cápsulas no hay servicio. Cada tarjeta muestra cuántas unidades quedan y avisa cuando un tipo entra en stock bajo.',
		textoVoz:
			'[surprised] Sin cápsulas no hay servicio. [cheerful] Cada tarjeta muestra cuántas unidades quedan y avisa cuando un tipo entra en stock bajo.',
	},
	{
		id: 'intro_03',
		texto:
			'Toca la cápsula que te pones y queda apuntada al instante. ¿Invitas a alguien? Usa el botón de invitado. ¿Te equivocaste? Pulsa «Deshacer».',
		textoVoz:
			'[cheerful] Toca la cápsula que te pones y queda apuntada al instante. ¿Invitas a alguien? Usa el botón de invitado. ¿Te equivocaste? Pulsa «Deshacer».',
	},
	{
		id: 'intro_04',
		texto: 'Cuando alguien trae cajas nuevas, registra la compra para sumar las existencias y actualizar el coste medio.',
		textoVoz: '[cheerful] Cuando alguien trae cajas nuevas, registra la compra para sumar las existencias y actualizar el coste medio.',
	},
	{
		id: 'intro_09',
		texto:
			'La hucha común paga las cápsulas. Tú pones dinero con una aportación y cada café descuenta de tu saldo lo que cuesta. De vez en cuando, los administradores cuentan la caja para que todo cuadre.',
		textoVoz:
			'[cheerful] La hucha común paga las cápsulas. [excited] Tú pones dinero con una aportación y cada café descuenta de tu saldo lo que cuesta. [cheerful] De vez en cuando, los administradores cuentan la caja para que todo cuadre.',
	},
	{
		id: 'intro_05',
		texto: 'Cada café descuenta su precio de tu saldo. Cuando estés en negativo, haz una aportación a la hucha y regístrala.',
		textoVoz:
			'[excited] Cada café descuenta su precio de tu saldo. [cheerful] Cuando estés en negativo, haz una aportación a la hucha y regístrala.',
	},
	{
		id: 'intro_06',
		texto: 'Si rellenas el depósito de la cafetera, pulsa «He rellenado el agua». No mueve dinero, pero queda reconocido.',
		textoVoz: '[cheerful] Si rellenas el depósito de la cafetera, pulsa «He rellenado el agua». No mueve dinero, pero queda reconocido.',
	},
	{
		id: 'intro_07',
		texto: 'El día 1 de cada mes damos las gracias a quien más veces rellenó el depósito el mes anterior.',
		textoVoz:
			'[excited] El día 1 de cada mes damos las gracias a quien más veces rellenó el depósito el mes anterior. [laughs] ¡Ovación para el aguador!',
	},
	{
		id: 'intro_08',
		texto: 'Cápsulas controladas, cuentas claras y agua lista. Puedes volver a ver esta guía o apagarme cuando quieras desde Perfil.',
		textoVoz:
			'[excited] Cápsulas controladas, cuentas claras y agua lista. [cheerful] Puedes volver a ver esta guía o apagarme cuando quieras desde Perfil.',
	},
	{
		id: 'consumo_pendiente_01',
		texto: 'Lo tengo en cola local. Se enviará en cuanto vuelva la red.',
		textoVoz: '[sighs] Lo tengo en espera. Todavía falta enviarlo.',
	},
	{
		id: 'consumo_sincronizado_01',
		texto: '¡Paquete entregado! Tus cafés pendientes ya están en el servidor.',
		textoVoz: '[excited] ¡Paquete entregado! Tus cafés pendientes ya están sincronizados.',
	},
	{
		id: 'consumo_anulado_01',
		texto: 'Registro anulado. Todo vuelve a su sitio.',
		textoVoz: 'Registro anulado. Todo vuelve a su sitio.',
	},
	{
		id: 'stock_bajo_01',
		texto: 'Quedan pocas cápsulas de algún tipo. Echa un vistazo a las existencias.',
		textoVoz: '[surprised] Quedan pocas cápsulas. Echa un vistazo a las existencias.',
	},
	{
		id: 'stock_negativo_01',
		texto: 'El consumo está registrado, pero hay un descuadre de existencias.',
		textoVoz: 'El consumo está registrado, pero hay un descuadre de existencias.',
	},
	{
		id: 'compra_confirmada_01',
		texto: '¡Llegaron refuerzos! Cápsulas nuevas en la despensa.',
		textoVoz: '[excited] ¡Llegaron refuerzos! Cápsulas nuevas en la despensa.',
	},
	{
		id: 'aportacion_confirmada_01',
		texto: '¡La hucha respira! Gracias por tu aportación.',
		textoVoz: '[excited] ¡La hucha respira! [chuckles] Gracias por tu aportación.',
	},
	{
		id: 'agua_confirmada_01',
		texto: '¡Un héroe sin capa! Gracias por rellenar el agua.',
		textoVoz: '[excited] ¡Un héroe sin capa! [chuckles] Gracias por rellenar el agua.',
	},
	{
		id: 'agua_rechazada_reciente_01',
		texto: 'El depósito se ha rellenado hace poco. Consulta el aviso.',
		textoVoz: 'El depósito se ha rellenado hace poco. Consulta el aviso.',
	},
	{
		id: 'aguador_mes_01',
		texto: '¡Ovación al aguador del mes!',
		textoVoz: '[excited] ¡Ovación al aguador del mes!',
	},
	{
		id: 'aguadores_mes_01',
		texto: '¡Ovación a los aguadores del mes!',
		textoVoz: '[excited] ¡Ovación a los aguadores del mes!',
	},
	{
		id: 'conexion_perdida_01',
		texto: 'Estamos sin conexión. Tus cafés se guardan en la cola local.',
		textoVoz: '[sighs] Estamos sin conexión. Consulta qué operaciones quedan pendientes.',
	},
	{
		id: 'operacion_rechazada_01',
		texto: 'No se ha podido registrar un consumo pendiente. Revisa el aviso.',
		textoVoz: 'No se ha podido completar la operación. Consulta el aviso.',
	},
];

// Un único enunciado por texto (constitución I): las frases, el tour y la ayuda se leen de sus catálogos (RF-237).
const deFrase = (frase) => ({ id: frase.id, texto: frase.texto, textoVoz: frase.textoVoz });
const deTour = (paso) => ({ id: paso.id, texto: `${paso.titulo}. ${paso.texto}`, textoVoz: `[cheerful] ${paso.titulo}. ${paso.texto}` });
const deAyuda = ([pantalla, entrada]) => ({
	id: `ayuda_${pantalla}`,
	texto: entrada.proposito,
	textoVoz: `[cheerful] ${entrada.proposito}`,
});

export const LOCUCIONES = [
	...LOCUCIONES_BASE,
	...FRASES_REGISTRO.map(deFrase),
	...FRASES_SALUDO.map(deFrase),
	...PASOS_TOUR.map(deTour),
	...Object.entries(CATALOGO_AYUDA).map(deAyuda),
];

export function cargarDotEnv() {
	const rutaEnv = resolve(process.cwd(), '.env');
	const mapa = {};
	if (!existsSync(rutaEnv)) return mapa;
	const contenido = readFileSync(rutaEnv, 'utf8');
	for (const linea of contenido.split(/\r?\n/)) {
		const limpia = linea.trim();
		if (!limpia || limpia.startsWith('#')) continue;
		const idx = limpia.indexOf('=');
		if (idx <= 0) continue;
		const clave = limpia.slice(0, idx).trim();
		const valor = limpia
			.slice(idx + 1)
			.trim()
			.replace(/^['"]|['"]$/g, '');
		mapa[clave] = valor;
	}
	return mapa;
}

function formaDeCaracter(caracter) {
	const limpio = caracter
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
	if (!limpio || /[\s.,;:¡!¿?…"«»()—\-']/.test(limpio)) return 0;
	if ('mbp'.includes(limpio)) return 7;
	if ('fv'.includes(limpio)) return 5;
	if ('a'.includes(limpio)) return 2;
	if ('ei'.includes(limpio) || limpio === 'y') return 1;
	if ('o'.includes(limpio)) return 3;
	if ('uw'.includes(limpio)) return 4;
	if ('lrdtnszcjgqkxñ'.includes(limpio)) return 6;
	return 0;
}

function redondearTiempo(segundos) {
	return Math.round(segundos * 1000) / 1000;
}

function construirCuesLipSync(alineacion) {
	const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = alineacion;
	const crudos = [];
	const total = Math.min(characters.length, starts.length, ends.length);

	let indice = 0;
	while (indice < total) {
		const ch = characters[indice] ?? '';
		if (ch === '[') {
			let cierre = indice + 1;
			let contenido = '';
			while (cierre < total && characters[cierre] !== ']') {
				contenido += characters[cierre] ?? '';
				cierre += 1;
			}
			const etiqueta = contenido.trim().toLowerCase();
			const inicioEtiqueta = starts[indice] ?? 0;
			const finEtiqueta = ends[Math.min(cierre, total - 1)] ?? inicioEtiqueta;
			if (ETIQUETAS_RISA.has(etiqueta) && finEtiqueta > inicioEtiqueta) {
				crudos.push({ start: inicioEtiqueta, end: finEtiqueta, value: 2 });
			}
			indice = cierre + 1;
			continue;
		}

		const boca = formaDeCaracter(ch);
		const inicio = starts[indice] ?? 0;
		const fin = ends[indice] ?? inicio;
		if (boca !== 0 && fin > inicio) {
			crudos.push({ start: inicio, end: fin, value: boca });
		}
		indice += 1;
	}

	const agrupados = [];
	for (const cue of crudos) {
		const anterior = agrupados[agrupados.length - 1];
		if (anterior && anterior.value === cue.value && cue.start - anterior.end < 0.04) {
			anterior.end = cue.end;
		} else {
			agrupados.push({ ...cue });
		}
	}

	return agrupados
		.filter((cue) => cue.end - cue.start >= 0.02)
		.map((cue) => ({
			start: redondearTiempo(cue.start),
			end: redondearTiempo(cue.end),
			value: cue.value,
		}));
}

export const VOZ_POR_DEFECTO = 'TfkjFyM0u8G2kDTCi1Qi';

/** Perfil «natural» elegido tras comparar seis perfiles de expresividad (en v3, `stability` solo distingue 0, 0,5 y 1). */
export const AJUSTES_VOZ = Object.freeze({ stability: 0.5, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true });
export const TAMANO_TANDA = 3;
/** Cuántas veces se vuelve a pedir una frase cuyo corte no es limpio, antes de darla por fallida. */
export const INTENTOS_POR_FRASE = 3;

// La respiración y el suspiro envuelven cada frase para que el recorte de ElevenLabs se los coma a ellos y no a la frase.
const ANTES = '[inhales] ... ';
const DESPUES = ' ... [sighs]';
const SEPARADOR = ' [short pause] ';
const RELLENO_INICIO = '[cheerful] Vamos con la tanda de frases. ...';
const ANTES_RELLENO_FINAL = '... [cheerful] ';
const RELLENO_FINAL = `${ANTES_RELLENO_FINAL}Y esto es todo por ahora.`;
const NIVEL_SILENCIO = '-45dB';

/** Longitud de las etiquetas `[...]` con que empieza un texto, con sus espacios. */
const etiquetasIniciales = (texto) => texto.match(/^(\[[^\]]+\]\s*)*/)[0].length;

/** Agrupa las locuciones, en orden, en tandas de `tamano`. */
export function agruparEnTandas(items, tamano = TAMANO_TANDA) {
	const tandas = [];
	for (let i = 0; i < items.length; i += tamano) tandas.push(items.slice(i, i + tamano));
	return tandas;
}

/**
 * Texto que se envía por una tanda y dónde está cada frase dentro de él.
 * `inicio` es la posición del `textoVoz` y `hablado` la de su primera palabra (tras sus etiquetas).
 */
export function construirTanda(items) {
	let texto = RELLENO_INICIO + SEPARADOR;
	const partes = items.map((item) => {
		const inicio = texto.length + ANTES.length;
		texto += ANTES + item.textoVoz + DESPUES + SEPARADOR;
		return { item, inicio, hablado: inicio + etiquetasIniciales(item.textoVoz) };
	});
	const hablado = texto.length + ANTES_RELLENO_FINAL.length;
	texto += RELLENO_FINAL;
	return { texto, partes, habladoFinal: hablado };
}

/**
 * Dónde cortar cada frase de una tanda, a partir de las marcas de tiempo de sus palabras y de los silencios del audio.
 * Las marcas de las etiquetas (`[inhales]`, `[sighs]`…) no son fiables, así que no se usan. El principio va en el último
 * silencio anterior a la primera palabra; el final, en el silencio más largo antes de la frase siguiente (la pausa del
 * separador). Una frase sin silencio en alguno de los dos lados no se corta: se devuelve con `ok: false`.
 */
export function planificarCortes(tanda, alineacion, silencios) {
	if (alineacion.characters.join('') !== tanda.texto) throw new Error('La alineación de ElevenLabs no coincide con el texto enviado.');
	const inicio = (c) => alineacion.character_start_times_seconds[c];
	const fin = (c) => alineacion.character_end_times_seconds[c];
	return tanda.partes.map(({ item, inicio: posicion, hablado }, i) => {
		const palabraIni = inicio(hablado);
		const palabraFin = fin(posicion + item.textoVoz.length - 1);
		const siguiente = inicio(i < tanda.partes.length - 1 ? tanda.partes[i + 1].hablado : tanda.habladoFinal);
		const antes = silencios.filter(([, e]) => e <= palabraIni + 0.2 && e >= palabraIni - 0.8).at(-1);
		const despues = silencios
			.filter(([s, e]) => s >= Math.max(palabraIni + 0.5, palabraFin - 1.8) && e <= siguiente + 0.1)
			.sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
		if (!antes) return { item, ok: false, motivo: 'no hay silencio antes de la primera palabra' };
		if (!despues) return { item, ok: false, motivo: 'no hay silencio después de la última palabra' };
		return {
			item,
			ok: true,
			posicion,
			desde: Math.max(antes[0], antes[1] - 0.3),
			hasta: despues[0] + Math.min(0.35, (despues[1] - despues[0]) / 2),
		};
	});
}

/**
 * La pista de sincronización labial de una frase, con los tiempos medidos desde el principio de su corte.
 * ElevenLabs puede dar a las etiquetas del final (`[laughs]`…) tiempos que caen más allá del corte: esos cues se
 * descartan o se recortan para que ninguno pase de la duración del audio.
 */
export function pistaDeFrase(alineacion, posicion, longitud, desde, hasta) {
	const trozo = (lista) => lista.slice(posicion, posicion + longitud);
	const desplazar = (lista) => trozo(lista).map((t) => Math.max(0, t - desde));
	const duration = redondearTiempo(hasta - desde);
	const cues = construirCuesLipSync({
		characters: trozo(alineacion.characters),
		character_start_times_seconds: desplazar(alineacion.character_start_times_seconds),
		character_end_times_seconds: desplazar(alineacion.character_end_times_seconds),
	})
		.filter((cue) => cue.start < duration)
		.map((cue) => ({ ...cue, end: Math.min(cue.end, duration) }));
	return { cues, duration };
}

/** `ffmpeg` real. Se pasa como parámetro para poder probar el resto sin él. */
export const herramientasFfmpeg = {
	disponible: () => spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0,
	abrir(audio) {
		const dir = mkdtempSync(join(tmpdir(), 'voces-'));
		const ruta = join(dir, 'tanda.audio');
		writeFileSync(ruta, audio);
		return {
			silencios() {
				const r = spawnSync(
					'ffmpeg',
					['-hide_banner', '-i', ruta, '-af', `silencedetect=noise=${NIVEL_SILENCIO}:d=0.05`, '-f', 'null', '-'],
					{
						encoding: 'utf8',
						maxBuffer: 1 << 26,
					},
				);
				const lista = [];
				let desde = null;
				for (const linea of r.stderr.split('\n')) {
					const a = /silence_start: ([\d.]+)/.exec(linea);
					if (a) desde = Number(a[1]);
					const b = /silence_end: ([\d.]+)/.exec(linea);
					if (b && desde !== null) {
						lista.push([desde, Number(b[1])]);
						desde = null;
					}
				}
				return lista;
			},
			cortar(desde, hasta) {
				const destino = join(dir, 'corte.mp3');
				execFileSync('ffmpeg', [
					'-y',
					'-loglevel',
					'error',
					'-i',
					ruta,
					'-ss',
					String(desde),
					'-to',
					String(hasta),
					'-c:a',
					'libmp3lame',
					'-q:a',
					'2',
					destino,
				]);
				return readFileSync(destino);
			},
			cerrar: () => rmSync(dir, { recursive: true, force: true }),
		};
	},
};

/**
 * Pide a ElevenLabs una tanda de locuciones en una sola llamada y corta cada una por un silencio real.
 * Devuelve un resultado por frase (`ok` con su `audio` y su `json` de sincronización labial, o `ok: false` con el `motivo`)
 * y el audio y las marcas de tiempo sin cortar (`crudo`), para poder recortar de nuevo sin volver a pagar.
 * `urlApi` solo cambia en las pruebas. Lanza si la API responde con un error.
 */
export async function generarTanda(items, { apiKey, voiceId, urlApi = 'https://api.elevenlabs.io', herramientas = herramientasFfmpeg }) {
	const tanda = construirTanda(items);
	const respuesta = await fetch(`${urlApi}/v1/text-to-speech/${voiceId}/with-timestamps`, {
		method: 'POST',
		headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' },
		body: JSON.stringify({ text: tanda.texto, model_id: 'eleven_v3', voice_settings: AJUSTES_VOZ }),
	});
	if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status} al generar ${items.map((item) => item.id).join(', ')}`);

	const datos = await respuesta.json();
	const audio = Buffer.from(datos.audio_base64, 'base64');
	const alineacion = datos.alignment ?? datos.normalized_alignment;
	const crudo = { texto: tanda.texto, audio, alineacion };
	if (!alineacion)
		return { crudo, resultados: items.map((item) => ({ item, ok: false, motivo: 'ElevenLabs no devolvió marcas de tiempo' })) };

	const trabajo = herramientas.abrir(audio);
	try {
		let cortes;
		try {
			cortes = planificarCortes(tanda, alineacion, trabajo.silencios());
		} catch (causa) {
			const motivo = causa instanceof Error ? causa.message : String(causa);
			return { crudo, resultados: items.map((item) => ({ item, ok: false, motivo })) };
		}
		const resultados = cortes.map((corte) => {
			if (!corte.ok) return corte;
			const { item, posicion, desde, hasta } = corte;
			const { cues, duration } = pistaDeFrase(alineacion, posicion, item.textoVoz.length, desde, hasta);
			return {
				item,
				ok: true,
				audio: trabajo.cortar(desde, hasta),
				cues,
				duration,
				json: { version: 1, audio: `${item.id}.mp3`, texto: item.texto, duration, cues },
			};
		});
		return { crudo, resultados };
	} finally {
		trabajo.cerrar();
	}
}

/** Escribe el MP3 y su pista JSON de una locución ya generada. */
export function escribirLocucion(dirSalida, item, resultado) {
	writeFileSync(resolve(dirSalida, `${item.id}.mp3`), resultado.audio);
	writeFileSync(resolve(dirSalida, `${item.id}.json`), `${JSON.stringify(resultado.json, null, '\t')}\n`);
}

/** Guarda el audio de una tanda sin cortar y sus marcas de tiempo, fuera de Git, para recortar de nuevo sin volver a pagar. */
function guardarCrudo(dirCrudos, numero, crudo) {
	mkdirSync(dirCrudos, { recursive: true });
	const nombre = `tanda_${String(numero).padStart(3, '0')}`;
	writeFileSync(resolve(dirCrudos, `${nombre}.mp3`), crudo.audio);
	writeFileSync(resolve(dirCrudos, `${nombre}.json`), JSON.stringify({ texto: crudo.texto, alineacion: crudo.alineacion }));
}

/**
 * Genera las locuciones en tandas y escribe cada una en `dirSalida`. Una frase cuyo corte no es limpio se vuelve a pedir
 * (hasta `INTENTOS_POR_FRASE` veces) y, si sigue sin serlo, no se escribe: lo que había sigue como estaba.
 * Si la API falla, se detiene. Devuelve `{ hechas, falladas, error }`.
 */
export async function generarLocuciones(items, entorno, { dirSalida, dirCrudos, avisar = () => {} }) {
	const hechas = [];
	const falladas = new Map();
	let numero = 0;
	for (const grupo of agruparEnTandas(items)) {
		let restantes = grupo;
		for (let intento = 1; intento <= INTENTOS_POR_FRASE && restantes.length > 0; intento += 1) {
			let tanda;
			try {
				tanda = await generarTanda(restantes, entorno);
			} catch (causa) {
				return { hechas, falladas, error: causa instanceof Error ? causa.message : String(causa) };
			}
			numero += 1;
			if (dirCrudos) guardarCrudo(dirCrudos, numero, tanda.crudo);
			restantes = [];
			for (const resultado of tanda.resultados) {
				if (resultado.ok) {
					escribirLocucion(dirSalida, resultado.item, resultado);
					hechas.push(resultado.item.id);
					falladas.delete(resultado.item.id);
					avisar(`  ✔ ${resultado.item.id} (${resultado.audio.length} B, ${resultado.cues.length} cues, ${resultado.duration}s)`);
				} else {
					restantes.push(resultado.item);
					falladas.set(resultado.item.id, resultado.motivo);
					avisar(`  … ${resultado.item.id}: ${resultado.motivo}${intento < INTENTOS_POR_FRASE ? '; se vuelve a pedir' : ''}`);
				}
			}
		}
	}
	return { hechas, falladas, error: undefined };
}

async function principal() {
	const envArchivo = cargarDotEnv();
	const apiKey = process.env.ELEVENLABS_API_KEY || envArchivo.ELEVENLABS_API_KEY;
	const voiceId = process.env.ELEVENLABS_VOICE_ID || envArchivo.ELEVENLABS_VOICE_ID || VOZ_POR_DEFECTO;
	const forzar = process.argv.includes('--force');
	// `--prefijo=intro_` limita la generación a las locuciones cuyo identificador empieza así.
	const prefijo = process.argv.find((a) => a.startsWith('--prefijo='))?.slice('--prefijo='.length) ?? '';

	if (!apiKey) {
		process.stderr.write('Falta ELEVENLABS_API_KEY en .env o en el entorno.\n');
		process.exit(1);
	}
	if (!herramientasFfmpeg.disponible()) {
		process.stderr.write('Falta ffmpeg en el PATH: se necesita para cortar cada frase de su tanda. No se ha llamado a la API.\n');
		process.exit(1);
	}

	const dirSalida = resolve(process.cwd(), 'static/mascota/voces');
	mkdirSync(dirSalida, { recursive: true });
	const yaGenerada = (id) => existsSync(resolve(dirSalida, `${id}.mp3`)) && existsSync(resolve(dirSalida, `${id}.json`));
	const pendientes = LOCUCIONES.filter((item) => item.id.startsWith(prefijo) && (forzar || !yaGenerada(item.id)));
	const omitidas = LOCUCIONES.filter((item) => item.id.startsWith(prefijo)).length - pendientes.length;

	const dirCrudos = resolve(process.cwd(), '.local/voces-tandas', new Date().toISOString().replace(/[:.]/g, '-'));
	const { hechas, falladas, error } = await generarLocuciones(
		pendientes,
		{ apiKey, voiceId },
		{ dirSalida, dirCrudos, avisar: (linea) => process.stdout.write(`${linea}\n`) },
	);
	if (error) {
		process.stderr.write(`${error}\n`);
		process.exit(1);
	}
	for (const [id, motivo] of falladas) process.stderr.write(`No se pudo cortar bien ${id}: ${motivo}.\n`);
	process.stdout.write(`Completado: ${hechas.length} generadas, ${omitidas} ya existentes en static/mascota/voces/.\n`);
	if (falladas.size > 0) process.exit(1);
}

// Solo se ejecuta al lanzarlo directamente: `scripts/voces-interactivo.mjs` importa el catálogo y la generación.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await principal();
