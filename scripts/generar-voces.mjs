import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Generador local de locuciones MP3 y pistas de sincronización labial JSON con ElevenLabs v3 (RF-187, DEC-115, ADR-0006).
// Uso: `npm run voces:generar` (o `node scripts/generar-voces.mjs [--force]`).
// Lee ELEVENLABS_API_KEY y ELEVENLABS_VOICE_ID desde `.env` o variables de entorno, sin exponer nunca la clave.

const ETIQUETAS_RISA = new Set(['laughs', 'laughing', 'chuckles', 'giggles', 'risas', 'risa']);

/** Catálogo de locuciones pregeneradas en `static/mascota/voces/`. */
const LOCUCIONES = [
	{
		id: 'intro_01',
		texto: '¡Hola! Soy Capsulito, tu compañero de café en el departamento.',
		textoVoz: '[excited] ¡Hola! [chuckles] Soy Capsulito, tu compañero de café en el departamento.',
	},
	{
		id: 'intro_02',
		texto: 'Sin cápsulas no hay servicio. ¡Vamos a vigilar las reservas!',
		textoVoz: '[surprised] ¡Sin cápsulas no hay servicio! [excited] ¡Vamos a vigilar las reservas!',
	},
	{
		id: 'intro_03',
		texto: 'Elige tu cápsula y registra el consumo con un toque. ¿Te equivocaste? Pulsa «Deshacer».',
		textoVoz: '[cheerful] Elige tu cápsula y registra el consumo con un toque. Comprueba que quede confirmado.',
	},
	{
		id: 'intro_04',
		texto: 'Cuando lleguen nuevas cápsulas, registra la compra para actualizar las existencias.',
		textoVoz: '[cheerful] Cuando lleguen nuevas cápsulas, registra la compra para actualizar las existencias.',
	},
	{
		id: 'intro_05',
		texto: 'Cada café cuenta. ¡Y las cuentas también! Consulta tus aportaciones y tu saldo.',
		textoVoz: '[excited] Cada café cuenta. [chuckles] ¡Y las cuentas también! Consulta tus aportaciones y tu saldo.',
	},
	{
		id: 'intro_06',
		texto: 'Si rellenas el depósito de la cafetera, registra el agua con un toque.',
		textoVoz: '[cheerful] Si rellenas el depósito, registra el agua en la aplicación.',
	},
	{
		id: 'intro_07',
		texto: 'Cada mes damos las gracias al aguador del mes. ¡Ovación para quien nos salva de la sequía!',
		textoVoz: '[excited] También damos las gracias al aguador del mes. [laughs] ¡Ovación para quien nos salva de la sequía!',
	},
	{
		id: 'intro_08',
		texto: 'Cápsulas controladas, cuentas claras… ¡a por el café!',
		textoVoz: '[excited] Cápsulas controladas, cuentas claras... [cheerful] ¡a por el café!',
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

function cargarDotEnv() {
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

async function principal() {
	const envArchivo = cargarDotEnv();
	const apiKey = process.env.ELEVENLABS_API_KEY || envArchivo.ELEVENLABS_API_KEY;
	const voiceId = process.env.ELEVENLABS_VOICE_ID || envArchivo.ELEVENLABS_VOICE_ID || 'TfkjFyM0u8G2kDTCi1Qi';
	const forzar = process.argv.includes('--force');

	if (!apiKey) {
		process.stderr.write('Falta ELEVENLABS_API_KEY en .env o en el entorno.\n');
		process.exit(1);
	}

	const dirSalida = resolve(process.cwd(), 'static/mascota/voces');
	mkdirSync(dirSalida, { recursive: true });

	let generadas = 0;
	let omitidas = 0;

	for (const item of LOCUCIONES) {
		const rutaMp3 = resolve(dirSalida, `${item.id}.mp3`);
		const rutaJson = resolve(dirSalida, `${item.id}.json`);
		if (!forzar && existsSync(rutaMp3) && existsSync(rutaJson)) {
			omitidas += 1;
			continue;
		}

		const respuesta = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
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

		if (!respuesta.ok) {
			process.stderr.write(`Error HTTP ${respuesta.status} al generar ${item.id}\n`);
			process.exit(1);
		}

		const datos = await respuesta.json();
		const bufferAudio = Buffer.from(datos.audio_base64, 'base64');
		const alineacion = datos.normalized_alignment ?? datos.alignment;
		const cues = alineacion ? construirCuesLipSync(alineacion) : [];
		const ends = alineacion?.character_end_times_seconds ?? [];
		const duration = ends.length > 0 ? redondearTiempo(ends[ends.length - 1]) : 0;

		writeFileSync(rutaMp3, bufferAudio);
		writeFileSync(
			rutaJson,
			`${JSON.stringify(
				{
					version: 1,
					audio: `${item.id}.mp3`,
					texto: item.texto,
					duration,
					cues,
				},
				null,
				'\t',
			)}\n`,
		);
		generadas += 1;
		process.stdout.write(`Generada locución ${item.id} (${bufferAudio.length} B, ${cues.length} cues, ${duration}s)\n`);
	}

	process.stdout.write(`Completado: ${generadas} generadas, ${omitidas} ya existentes en static/mascota/voces/.\n`);
}

await principal();
