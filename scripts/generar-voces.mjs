import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Generador local de locuciones MP3 y pistas de sincronización labial JSON con ElevenLabs v3 (RF-187, DEC-115, ADR-0006).
// Uso: `npm run voces:generar` (o `node scripts/generar-voces.mjs [--force]`).
// Lee ELEVENLABS_API_KEY y ELEVENLABS_VOICE_ID desde `.env` o variables de entorno, sin exponer nunca la clave.

const ETIQUETAS_RISA = new Set(['laughs', 'laughing', 'chuckles', 'giggles', 'risas', 'risa']);

/** Catálogo de locuciones pregeneradas en `static/mascota/voces/`. */
export const LOCUCIONES = [
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
		id: 'consumo_confirmado_01',
		texto: '¡Cafeína cargada en memoria!',
		textoVoz: '[excited] ¡Cafeína cargada!',
	},
	{
		id: 'consumo_confirmado_02',
		texto: '¡Café apuntado! Latencia cero hasta la taza.',
		textoVoz: '[cheerful] ¡Café apuntado! [chuckles]',
	},
	{
		id: 'consumo_invitado_01',
		texto: '¡Tenemos visita! Café de invitado apuntado.',
		textoVoz: '[excited] ¡Tenemos visita! [chuckles] Café de invitado apuntado.',
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

/**
 * Pide a ElevenLabs la locución y devuelve el audio y su pista JSON de sincronización labial, sin escribir nada.
 * `urlApi` solo cambia en las pruebas.
 */
export async function generarLocucion(item, { apiKey, voiceId, urlApi = 'https://api.elevenlabs.io' }) {
	const respuesta = await fetch(`${urlApi}/v1/text-to-speech/${voiceId}/with-timestamps`, {
		method: 'POST',
		headers: {
			'xi-api-key': apiKey,
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			text: item.textoVoz,
			model_id: 'eleven_v3',
			voice_settings: {
				stability: 0.45,
				similarity_boost: 0.8,
				style: 0.35,
				use_speaker_boost: true,
			},
		}),
	});
	if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status} al generar ${item.id}`);

	const datos = await respuesta.json();
	const audio = Buffer.from(datos.audio_base64, 'base64');
	const alineacion = datos.normalized_alignment ?? datos.alignment;
	const cues = alineacion ? construirCuesLipSync(alineacion) : [];
	const ends = alineacion?.character_end_times_seconds ?? [];
	const duration = ends.length > 0 ? redondearTiempo(ends[ends.length - 1]) : 0;
	return { audio, cues, duration, json: { version: 1, audio: `${item.id}.mp3`, texto: item.texto, duration, cues } };
}

/** Escribe el MP3 y su pista JSON de una locución ya generada. */
export function escribirLocucion(dirSalida, item, resultado) {
	writeFileSync(resolve(dirSalida, `${item.id}.mp3`), resultado.audio);
	writeFileSync(resolve(dirSalida, `${item.id}.json`), `${JSON.stringify(resultado.json, null, '\t')}\n`);
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

	const dirSalida = resolve(process.cwd(), 'static/mascota/voces');
	mkdirSync(dirSalida, { recursive: true });

	let generadas = 0;
	let omitidas = 0;

	for (const item of LOCUCIONES) {
		if (!item.id.startsWith(prefijo)) continue;
		if (!forzar && existsSync(resolve(dirSalida, `${item.id}.mp3`)) && existsSync(resolve(dirSalida, `${item.id}.json`))) {
			omitidas += 1;
			continue;
		}
		let resultado;
		try {
			resultado = await generarLocucion(item, { apiKey, voiceId });
		} catch (causa) {
			process.stderr.write(`${causa instanceof Error ? causa.message : String(causa)}\n`);
			process.exit(1);
		}
		escribirLocucion(dirSalida, item, resultado);
		generadas += 1;
		process.stdout.write(
			`Generada locución ${item.id} (${resultado.audio.length} B, ${resultado.cues.length} cues, ${resultado.duration}s)\n`,
		);
	}

	process.stdout.write(`Completado: ${generadas} generadas, ${omitidas} ya existentes en static/mascota/voces/.\n`);
}

// Solo se ejecuta al lanzarlo directamente: `scripts/voces-interactivo.mjs` importa el catálogo y la generación.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await principal();
