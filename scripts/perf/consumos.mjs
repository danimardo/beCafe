// Carga de consumos (RNF-002, plan F3 D11): p95 de la *action* `consumir` con 30 personas, 300 consumos y 5 en paralelo.
// Arranca `node build` con una base temporal, siembra las personas y las cápsulas con SQL directo (solo para preparar
// los datos; la medición pasa por la *action*) y escribe el resultado en `.local/verification/`. Falla si el p95 supera 1 s.
// Uso: `npm run perf:load` después de `npm run build`. No se ejecuta en `verify`; sí en el benchmark (plan D11).
import { createHash, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { ulid } from 'ulid';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const PERSONAS = 30;
const CONSUMOS = 300;
const PARALELO = 5;
const LIMITE_P95_MS = 1000;
// Debe coincidir con el ORIGIN con el que compila `scripts/build-verificacion.mjs`: si no, la protección CSRF rechaza los POST.
const PUERTO = 4300;
const URL_SERVIDOR = `http://127.0.0.1:${PUERTO}`;
const NOMBRE_COOKIE = 'becafe_sesion';
const VERSION_PRIVACIDAD = 1;
const PRECIO_CAPSULA_COSTE = 3483;

const raiz = process.cwd();
const instante = () => new Date().toISOString();
const sha256 = (valor) => createHash('sha256').update(valor).digest('hex');

/** Arranca el servidor con la base temporal y espera la línea que escribe el adaptador (sin bucles de espera). */
function arrancar(directorioDatos) {
	const proceso = spawn(process.execPath, ['build'], {
		cwd: raiz,
		env: {
			PATH: process.env.PATH ?? '',
			HOST: '127.0.0.1',
			PORT: String(PUERTO),
			ORIGIN: URL_SERVIDOR,
			DIRECTORIO_DATOS: directorioDatos,
			ADMIN_INICIAL_EMAIL: 'admin.perf@ejemplo.es',
			ADMIN_INICIAL_NOMBRE: 'Administración de carga',
			LOG_LEVEL: 'warn',
			TZ: 'Europe/Madrid',
		},
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	const arrancado = new Promise((resolver, rechazar) => {
		const plazo = setTimeout(() => rechazar(new Error('El servidor no arrancó en 60 s')), 60_000);
		proceso.stdout.on('data', (chunk) => {
			if (chunk.toString().includes('Listening on')) {
				clearTimeout(plazo);
				resolver();
			}
		});
		proceso.on('exit', (codigo) => rechazar(new Error(`El servidor terminó al arrancar (código ${codigo})`)));
	});
	return { proceso, arrancado };
}

/** Siembra las personas con sesión abierta, privacidad aceptada, una cápsula con coste y su stock. */
function sembrar(directorioDatos) {
	const db = new Database(join(directorioDatos, 'becafe.db'));
	db.pragma('busy_timeout = 5000');
	const sesiones = [];
	const ahora = instante();
	const tipoId = ulid();
	db.prepare(
		"INSERT INTO tipo_capsula (id, nombre, nombre_normalizado, marca, intensidad, color, foto_ruta, estado, creado_en, actualizado_en) VALUES (?, 'Carga', 'carga', 'Marca de carga', 5, 'cap-ristretto', NULL, 'activo', ?, ?)",
	).run(tipoId, ahora, ahora);
	db.prepare('INSERT INTO existencia (tipo_capsula_id, umbral_minimo, stock, coste_medio, en_stock_bajo) VALUES (?, 0, 100000, ?, 0)').run(
		tipoId,
		PRECIO_CAPSULA_COSTE * 10000,
	);
	const insertarUsuario = db.prepare(
		"INSERT INTO usuario (id, nombre, email, rol, estado, privacidad_version, privacidad_leida_en, creado_en) VALUES (?, ?, ?, 'miembro', 'activo', ?, ?, ?)",
	);
	const insertarSesion = db.prepare(
		'INSERT INTO sesion (id_hash, usuario_id, creada_en, ultimo_uso_en, ultima_autenticacion_en) VALUES (?, ?, ?, ?, ?)',
	);
	db.transaction(() => {
		for (let i = 0; i < PERSONAS; i += 1) {
			const id = ulid();
			insertarUsuario.run(id, `Persona ${i + 1}`, `carga-${i + 1}-${id}@ejemplo.es`, VERSION_PRIVACIDAD, ahora, ahora);
			const token = randomBytes(32).toString('hex');
			insertarSesion.run(sha256(token), id, ahora, ahora, ahora);
			sesiones.push(token);
		}
	})();
	db.close();
	return { tipoId, sesiones };
}

/** Un envío de la *action* `consumir` con el formulario de una fila (RF-011), con la sesión de una persona. */
async function consumir(token, tipoId) {
	const cuerpo = new URLSearchParams({ tipoCapsulaId: tipoId, clienteId: ulid(), invitado: '0' });
	const inicio = performance.now();
	const respuesta = await fetch(`${URL_SERVIDOR}/?/consumir`, {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			origin: URL_SERVIDOR,
			cookie: `${NOMBRE_COOKIE}=${token}`,
		},
		body: cuerpo,
		redirect: 'manual',
	});
	const duracion = performance.now() - inicio;
	const texto = await respuesta.text();
	return { duracion, ok: respuesta.status === 200, estado: respuesta.status, fragmento: texto.slice(0, 200) };
}

/** Cuenta los consumos guardados: un 200 de la *action* no basta, hay que comprobar que llegaron a la base. */
function contarConsumos(directorioDatos) {
	const db = new Database(join(directorioDatos, 'becafe.db'), { readonly: true });
	try {
		return db.prepare('SELECT count(*) AS total FROM consumo').get().total;
	} finally {
		db.close();
	}
}

/** Percentil por rango más cercano: el valor que deja al p% de las muestras por debajo. */
function percentil(valores, p) {
	const ordenados = [...valores].sort((a, b) => a - b);
	return ordenados[Math.ceil((p / 100) * ordenados.length) - 1];
}

async function medir(sesiones, tipoId) {
	const resultados = [];
	let siguiente = 0;
	async function trabajador() {
		while (siguiente < CONSUMOS) {
			const indice = siguiente;
			siguiente += 1;
			resultados.push(await consumir(sesiones[indice % sesiones.length], tipoId));
		}
	}
	await Promise.all(Array.from({ length: PARALELO }, trabajador));
	return resultados;
}

async function main() {
	const directorioDatos = await mkdtemp(join(raiz, '.local', 'perf-datos-'));
	const { proceso, arrancado } = arrancar(directorioDatos);
	try {
		await arrancado;
		const { tipoId, sesiones } = sembrar(directorioDatos);
		const resultados = await medir(sesiones, tipoId);
		const tiempos = resultados.map((resultado) => resultado.duracion);
		const errores = resultados.filter((resultado) => !resultado.ok).length;
		const registrados = contarConsumos(directorioDatos);
		const p95 = percentil(tiempos, 95);
		const informe = {
			fecha: instante(),
			personas: PERSONAS,
			consumos: CONSUMOS,
			paralelo: PARALELO,
			limiteP95Ms: LIMITE_P95_MS,
			p50Ms: Math.round(percentil(tiempos, 50)),
			p95Ms: Math.round(p95),
			maximoMs: Math.round(Math.max(...tiempos)),
			errores,
			registrados,
			primerError: resultados.find((resultado) => !resultado.ok) ?? null,
			resultado: errores === 0 && registrados === CONSUMOS && p95 <= LIMITE_P95_MS ? 'ok' : 'fallo',
		};
		const carpeta = join(raiz, '.local', 'verification');
		await mkdir(carpeta, { recursive: true });
		await writeFile(join(carpeta, `perf-consumos-${Date.now()}.json`), `${JSON.stringify(informe, null, 2)}\n`);
		console.log(JSON.stringify(informe, null, 2));
		return informe.resultado === 'ok' ? 0 : 1;
	} finally {
		proceso.kill();
		await rm(directorioDatos, { recursive: true, force: true });
	}
}

process.exitCode = await main();
