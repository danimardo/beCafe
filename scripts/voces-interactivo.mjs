import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { cargarDotEnv, escribirLocucion, generarLocucion, LOCUCIONES, VOZ_POR_DEFECTO } from './generar-voces.mjs';

// Menú interactivo para generar las locuciones de Capsulito con ElevenLabs (RF-187, DEC-115, ADR-0006).
// Lo lanzan `voces.sh` y `voces.ps1`, o `npm run voces`. Usa el mismo catálogo y la misma generación que
// `scripts/generar-voces.mjs`. Nunca muestra la clave de la API.

const DIR_VOCES = 'static/mascota/voces';
// `.local/` está fuera de Git (AGENTS.md §8): ahí se guarda la copia de lo que se regenera.
const DIR_COPIAS = '.local/voces-copia';

/** Grupo de una locución: su identificador sin el número final (`intro_03` → `intro`); toda la ayuda es un grupo. */
export function grupoDe(id) {
	if (id.startsWith('ayuda_')) return 'ayuda';
	return id.replace(/_\d+$/, '');
}

export function estaGenerada(dirSalida, id) {
	return existsSync(resolve(dirSalida, `${id}.mp3`)) && existsSync(resolve(dirSalida, `${id}.json`));
}

/** Grupos del catálogo, en orden de aparición, con cuántas locuciones tienen generadas. */
export function resumirGrupos(locuciones, generada) {
	const grupos = new Map();
	for (const item of locuciones) {
		const nombre = grupoDe(item.id);
		const grupo = grupos.get(nombre) ?? { nombre, total: 0, generadas: 0 };
		grupo.total += 1;
		if (generada(item.id)) grupo.generadas += 1;
		grupos.set(nombre, grupo);
	}
	return [...grupos.values()];
}

/**
 * Qué se enviaría a la API: sin `regenerar`, solo las que faltan; con `regenerar`, todas las elegidas.
 * Los caracteres son los del texto con etiquetas de voz, que es lo que ElevenLabs cobra.
 */
export function planificar(elegidas, generada, regenerar) {
	const aGenerar = elegidas.filter((item) => regenerar || !generada(item.id));
	return {
		aGenerar,
		aRegenerar: aGenerar.filter((item) => generada(item.id)),
		caracteres: aGenerar.reduce((suma, item) => suma + item.textoVoz.length, 0),
	};
}

/** Interpreta «1,3,5-7» como posiciones de 1 a `maximo`. Devuelve `null` si algo no es válido. */
export function interpretarSeleccion(texto, maximo) {
	const posiciones = new Set();
	for (const parte of texto.split(',').map((p) => p.trim())) {
		const rango = /^(\d+)(?:-(\d+))?$/.exec(parte);
		if (!rango) return null;
		const desde = Number(rango[1]);
		const hasta = Number(rango[2] ?? rango[1]);
		if (desde < 1 || hasta > maximo || desde > hasta) return null;
		for (let n = desde; n <= hasta; n += 1) posiciones.add(n);
	}
	return [...posiciones].sort((a, b) => a - b);
}

function escribir(texto = '') {
	process.stdout.write(`${texto}\n`);
}

function sello() {
	return new Date().toISOString().replace(/[:.]/g, '-');
}

function guardarCopia(dirSalida, aRegenerar) {
	if (aRegenerar.length === 0) return null;
	const destino = resolve(process.cwd(), DIR_COPIAS, sello());
	mkdirSync(destino, { recursive: true });
	for (const item of aRegenerar) {
		for (const extension of ['mp3', 'json'])
			copyFileSync(resolve(dirSalida, `${item.id}.${extension}`), resolve(destino, `${item.id}.${extension}`));
	}
	return destino;
}

function mostrarEstado(dirSalida) {
	const generada = (id) => estaGenerada(dirSalida, id);
	escribir('\nLocuciones del catálogo:');
	LOCUCIONES.forEach((item, indice) => {
		const marca = generada(item.id) ? '✔' : '✘';
		escribir(`  ${String(indice + 1).padStart(2)}. ${marca} ${item.id.padEnd(28)} ${item.textoVoz.length} car.`);
	});
	const generadas = LOCUCIONES.filter((item) => generada(item.id)).length;
	escribir(`\n${generadas} de ${LOCUCIONES.length} generadas (✔ existe, ✘ falta).`);
}

async function elegir(lector, dirSalida) {
	const generada = (id) => estaGenerada(dirSalida, id);
	escribir('\n¿Qué quieres generar?');
	escribir('  1) Las que faltan');
	escribir('  2) Un grupo');
	escribir('  3) Locuciones concretas');
	escribir('  4) Todas (regenerar)');
	escribir('  0) Volver');
	const opcion = (await lector.question('Opción: ')).trim();
	if (opcion === '1') return { elegidas: LOCUCIONES, regenerar: false };
	if (opcion === '4') return { elegidas: LOCUCIONES, regenerar: true };
	if (opcion === '2') {
		const grupos = resumirGrupos(LOCUCIONES, generada);
		grupos.forEach((g, i) => escribir(`  ${i + 1}) ${g.nombre} (${g.generadas}/${g.total} generadas)`));
		const posiciones = interpretarSeleccion((await lector.question('Grupo(s), por ejemplo 1 o 1,3: ')).trim(), grupos.length);
		if (!posiciones) return escribir('Selección no válida.');
		const nombres = new Set(posiciones.map((n) => grupos[n - 1].nombre));
		const elegidas = LOCUCIONES.filter((item) => nombres.has(grupoDe(item.id)));
		const regenerar = /^s/i.test((await lector.question('¿Regenerar también las que ya existen? (s/N): ')).trim());
		return { elegidas, regenerar };
	}
	if (opcion === '3') {
		mostrarEstado(dirSalida);
		const posiciones = interpretarSeleccion((await lector.question('Números, por ejemplo 1,3,5-7: ')).trim(), LOCUCIONES.length);
		if (!posiciones) return escribir('Selección no válida.');
		const elegidas = posiciones.map((n) => LOCUCIONES[n - 1]);
		const regenerar = /^s/i.test((await lector.question('¿Regenerar también las que ya existen? (s/N): ')).trim());
		return { elegidas, regenerar };
	}
	return undefined;
}

async function generar(lector, entorno, dirSalida) {
	const seleccion = await elegir(lector, dirSalida);
	if (!seleccion) return;
	const { aGenerar, aRegenerar, caracteres } = planificar(seleccion.elegidas, (id) => estaGenerada(dirSalida, id), seleccion.regenerar);
	if (aGenerar.length === 0) return escribir('\nNo hay nada que generar: todo lo elegido ya existe.');

	escribir(`\nSe enviarán ${aGenerar.length} locuciones a ElevenLabs (${caracteres} caracteres, que son los que se cobran):`);
	for (const item of aGenerar)
		escribir(`  - ${item.id}${aRegenerar.includes(item) ? '  (ya existe: se guarda una copia y se sustituye)' : ''}`);
	if (!entorno.apiKey) return escribir('\nFalta ELEVENLABS_API_KEY en .env o en el entorno. No se genera nada.');
	if (!/^s/i.test((await lector.question('\n¿Generar ahora? (s/N): ')).trim())) return escribir('Cancelado: no se ha llamado a la API.');

	const copia = guardarCopia(dirSalida, aRegenerar);
	if (copia) escribir(`Copia de lo que se sustituye en ${copia}`);
	mkdirSync(dirSalida, { recursive: true });
	let hechas = 0;
	for (const item of aGenerar) {
		try {
			const resultado = await generarLocucion(item, entorno);
			escribirLocucion(dirSalida, item, resultado);
			hechas += 1;
			escribir(`  ✔ ${item.id} (${resultado.audio.length} B, ${resultado.cues.length} cues, ${resultado.duration}s)`);
		} catch (causa) {
			escribir(`  ✘ ${causa instanceof Error ? causa.message : String(causa)}`);
			escribir(`Me detengo: ${hechas} de ${aGenerar.length} generadas. Lo que no se llegó a sustituir sigue como estaba.`);
			return;
		}
	}
	escribir(`\nCompletado: ${hechas} generadas en ${DIR_VOCES}/.`);
}

async function principal() {
	const envArchivo = cargarDotEnv();
	const entorno = {
		apiKey: process.env.ELEVENLABS_API_KEY || envArchivo.ELEVENLABS_API_KEY,
		voiceId: process.env.ELEVENLABS_VOICE_ID || envArchivo.ELEVENLABS_VOICE_ID || VOZ_POR_DEFECTO,
		urlApi: process.env.ELEVENLABS_API_URL || undefined,
	};
	const dirSalida = resolve(process.cwd(), DIR_VOCES);
	const lector = createInterface({ input: process.stdin, output: process.stdout });
	// Con la entrada cerrada (Ctrl+D o una tubería agotada) las preguntas pendientes no se resuelven: se sale en limpio.
	let cerrado = false;
	lector.on('close', () => {
		cerrado = true;
	});

	escribir('beCafé · locuciones de Capsulito');
	escribir(`Voz: ${entorno.voiceId} · Clave de ElevenLabs: ${entorno.apiKey ? 'encontrada' : 'NO encontrada'}`);
	try {
		while (!cerrado) {
			escribir('\nMenú');
			escribir('  1) Ver el estado de las locuciones');
			escribir('  2) Generar locuciones');
			escribir('  0) Salir');
			const opcion = (await lector.question('Opción: ')).trim();
			if (opcion === '1') mostrarEstado(dirSalida);
			else if (opcion === '2') await generar(lector, entorno, dirSalida);
			else if (opcion === '0') break;
			else escribir('Opción no válida.');
		}
	} catch (causa) {
		// `readline` rechaza la pregunta pendiente al cerrarse la entrada.
		if (!cerrado) throw causa;
	} finally {
		lector.close();
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await principal();
