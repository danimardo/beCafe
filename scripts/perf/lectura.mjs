// Lectura (RNF-002 y plan F5 D9): p95 de `/saldos`, `/historial` y `/estadisticas?periodo=todo` con sesión, con 30 personas
// y unos tres años de registros (30 000 consumos, 3 000 rellenos de agua, aportaciones, compras y un arqueo al mes). Arranca `node build` con una base
// temporal, siembra con SQL directo (solo para preparar los datos; la medición pasa por las páginas) y escribe el resultado en
// `.local/verification/`. Falla si algún p95 supera 1 s. Uso: `npm run perf:lectura` después de `npm run build:verificacion`.
import { createHash, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { ulid } from 'ulid';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const PERSONAS = 30;
const MESES = 36;
const CONSUMOS = 30_000;
/** Rellenos de agua vigentes: el historial mezcla estos con los movimientos económicos (F8, plan D6). */
const RELLENOS = 3000;
const PETICIONES_POR_PAGINA = 40;
const PARALELO = 5;
const LIMITE_P95_MS = 1000;
// Debe coincidir con el ORIGIN con el que compila `scripts/build-verificacion.mjs`: si no, la protección CSRF rechaza los POST.
const PUERTO = 4300;
const URL_SERVIDOR = `http://127.0.0.1:${PUERTO}`;
const NOMBRE_COOKIE = 'becafe_sesion';
const VERSION_PRIVACIDAD = 1;
const PRECIO = 35;
const COSTE = 3483;
const PAGINAS = ['/saldos', '/historial', '/estadisticas?periodo=todo'];

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

/** Instante ISO (UTC) del día `dia` del mes `indiceMes` contando desde enero de 2024. */
function instanteDe(indiceMes, dia, hora) {
	const anio = 2024 + Math.floor(indiceMes / 12);
	const mes = indiceMes % 12;
	return new Date(Date.UTC(anio, mes, dia, hora, 0, 0)).toISOString();
}

/** Siembra personas con sesión, cápsula con coste, consumos, aportaciones, compras y un arqueo al mes. */
function sembrar(directorioDatos) {
	const db = new Database(join(directorioDatos, 'becafe.db'));
	db.pragma('busy_timeout = 5000');
	const ahora = instante();
	const tipoId = ulid();
	db.prepare(
		"INSERT INTO tipo_capsula (id, nombre, nombre_normalizado, marca, intensidad, color, foto_ruta, estado, creado_en, actualizado_en) VALUES (?, 'Carga lectura', 'carga-lectura', 'Marca de carga', 5, 'cap-ristretto', NULL, 'activo', ?, ?)",
	).run(tipoId, ahora, ahora);
	db.prepare('INSERT INTO existencia (tipo_capsula_id, umbral_minimo, stock, coste_medio, en_stock_bajo) VALUES (?, 0, 100000, ?, 0)').run(
		tipoId,
		COSTE * 10000,
	);
	const insertarUsuario = db.prepare(
		"INSERT INTO usuario (id, nombre, email, rol, estado, privacidad_version, privacidad_leida_en, creado_en) VALUES (?, ?, ?, 'miembro', 'activo', ?, ?, ?)",
	);
	const insertarSesion = db.prepare(
		'INSERT INTO sesion (id_hash, usuario_id, creada_en, ultimo_uso_en, ultima_autenticacion_en) VALUES (?, ?, ?, ?, ?)',
	);
	const sesiones = [];
	const personas = [];
	const admin = db.prepare("SELECT id FROM usuario WHERE rol = 'administrador' LIMIT 1").get()?.id;
	db.transaction(() => {
		for (let i = 0; i < PERSONAS; i += 1) {
			const id = ulid();
			personas.push(id);
			insertarUsuario.run(id, `Persona ${i + 1}`, `carga-lectura-${i + 1}-${id}@ejemplo.es`, VERSION_PRIVACIDAD, ahora, ahora);
			const token = randomBytes(32).toString('hex');
			insertarSesion.run(sha256(token), id, ahora, ahora, ahora);
			sesiones.push(token);
		}
	})();
	const administrador = admin ?? personas[0];

	const insertarConsumo = db.prepare(
		'INSERT INTO consumo (id, cliente_id, usuario_id, tipo_capsula_id, invitado, precio_aplicado, coste_medio_aplicado, hora_gesto, hora_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
	);
	const insertarMovimiento = db.prepare(
		'INSERT INTO movimiento (id, cuenta, usuario_id, tipo, importe, origen_tipo, origen_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
	);
	const insertarAportacion = db.prepare(
		"INSERT INTO aportacion (id, cliente_id, usuario_id, registrada_por, importe, origen, registrada_en) VALUES (?, ?, ?, ?, ?, 'directa', ?)",
	);
	const insertarCompra = db.prepare(
		'INSERT INTO compra (id, cliente_id, usuario_id, importe_total, hucha_negativa_confirmada, registrada_en) VALUES (?, ?, ?, ?, 0, ?)',
	);
	const insertarLinea = db.prepare('INSERT INTO linea_compra (id, compra_id, tipo_capsula_id, cantidad, importe) VALUES (?, ?, ?, ?, ?)');
	const insertarArqueo = db.prepare(
		'INSERT INTO arqueo (id, admin_id, realizado_en, saldo_teorico, contado, diferencia) VALUES (?, ?, ?, 0, 0, 0)',
	);

	const insertarRelleno = db.prepare(
		"INSERT INTO relleno_agua (id, cliente_id, usuario_id, registrado_en, estado, anulado_por, anulado_en, motivo_anulacion) VALUES (?, ?, ?, ?, 'vigente', NULL, NULL, NULL)",
	);

	db.transaction(() => {
		for (let i = 0; i < RELLENOS; i += 1) {
			insertarRelleno.run(ulid(), ulid(), personas[i % PERSONAS], instanteDe(i % MESES, 1 + (i % 27), 9 + (i % 10)));
		}
		for (let i = 0; i < CONSUMOS; i += 1) {
			const usuarioId = personas[i % PERSONAS];
			const hora = instanteDe(i % MESES, 1 + (i % 27), 8 + (i % 12));
			const id = ulid();
			insertarConsumo.run(id, ulid(), usuarioId, tipoId, i % 17 === 0 ? 1 : 0, PRECIO, COSTE, hora, hora);
			insertarMovimiento.run(ulid(), 'persona', usuarioId, 'cargo_consumo', -PRECIO, 'consumo', id, hora);
		}
		for (let mes = 0; mes < MESES; mes += 1) {
			for (const usuarioId of personas) {
				const hora = instanteDe(mes, 2, 10);
				const id = ulid();
				insertarAportacion.run(id, ulid(), usuarioId, usuarioId, 2000, hora);
				insertarMovimiento.run(ulid(), 'persona', usuarioId, 'abono_aportacion', 2000, 'aportacion', id, hora);
			}
			const hora = instanteDe(mes, 3, 11);
			const compraId = ulid();
			insertarCompra.run(compraId, ulid(), personas[mes % PERSONAS], 1200, hora);
			insertarLinea.run(ulid(), compraId, tipoId, 10, 1200);
			insertarMovimiento.run(ulid(), 'hucha', null, 'hucha_compra', -1200, 'compra', compraId, hora);
			insertarArqueo.run(ulid(), administrador, instanteDe(mes, 28, 12));
		}
	})();
	db.close();
	return { sesiones };
}

/** Una página con sesión de una persona. Cuenta como error todo lo que no sea 200. */
async function pedir(token, ruta) {
	const inicio = performance.now();
	const respuesta = await fetch(`${URL_SERVIDOR}${ruta}`, { headers: { cookie: `${NOMBRE_COOKIE}=${token}` }, redirect: 'manual' });
	await respuesta.text();
	return { ruta, duracion: performance.now() - inicio, ok: respuesta.status === 200 };
}

/** Percentil por rango más cercano: el valor que deja al p% de las muestras por debajo. */
function percentil(valores, p) {
	const ordenados = [...valores].sort((a, b) => a - b);
	return ordenados[Math.ceil((p / 100) * ordenados.length) - 1];
}

async function medirPagina(sesiones, ruta) {
	const resultados = [];
	let siguiente = 0;
	async function trabajador() {
		while (siguiente < PETICIONES_POR_PAGINA) {
			const indice = siguiente;
			siguiente += 1;
			resultados.push(await pedir(sesiones[indice % sesiones.length], ruta));
		}
	}
	await Promise.all(Array.from({ length: PARALELO }, trabajador));
	const tiempos = resultados.map((resultado) => resultado.duracion);
	const errores = resultados.filter((resultado) => !resultado.ok).length;
	const p95 = percentil(tiempos, 95);
	return {
		ruta,
		peticiones: resultados.length,
		errores,
		p50Ms: Math.round(percentil(tiempos, 50)),
		p95Ms: Math.round(p95),
		maximoMs: Math.round(Math.max(...tiempos)),
		ok: errores === 0 && p95 <= LIMITE_P95_MS,
	};
}

/** Cuenta lo sembrado: sin esta comprobación una siembra incompleta daría una medida falsamente rápida. */
function contar(directorioDatos) {
	const db = new Database(join(directorioDatos, 'becafe.db'), { readonly: true });
	try {
		return {
			consumos: db.prepare('SELECT count(*) AS total FROM consumo').get().total,
			aportaciones: db.prepare('SELECT count(*) AS total FROM aportacion').get().total,
			compras: db.prepare('SELECT count(*) AS total FROM compra').get().total,
			arqueos: db.prepare('SELECT count(*) AS total FROM arqueo').get().total,
		};
	} finally {
		db.close();
	}
}

async function main() {
	const directorioDatos = await mkdtemp(join(raiz, '.local', 'perf-lectura-'));
	const { proceso, arrancado } = arrancar(directorioDatos);
	try {
		await arrancado;
		const { sesiones } = sembrar(directorioDatos);
		const sembrado = contar(directorioDatos);
		const paginas = [];
		for (const ruta of PAGINAS) {
			paginas.push(await medirPagina(sesiones, ruta));
		}
		const sembradoCompleto = sembrado.consumos === CONSUMOS && sembrado.compras === MESES && sembrado.arqueos === MESES;
		const informe = {
			fecha: instante(),
			personas: PERSONAS,
			meses: MESES,
			consumos: sembrado.consumos,
			aportaciones: sembrado.aportaciones,
			compras: sembrado.compras,
			arqueos: sembrado.arqueos,
			paralelo: PARALELO,
			limiteP95Ms: LIMITE_P95_MS,
			paginas,
			resultado: sembradoCompleto && paginas.every((pagina) => pagina.ok) ? 'ok' : 'fallo',
		};
		const carpeta = join(raiz, '.local', 'verification');
		await mkdir(carpeta, { recursive: true });
		await writeFile(join(carpeta, `perf-lectura-${Date.now()}.json`), `${JSON.stringify(informe, null, 2)}\n`);
		console.log(JSON.stringify(informe, null, 2));
		return informe.resultado === 'ok' ? 0 : 1;
	} finally {
		proceso.kill();
		await rm(directorioDatos, { recursive: true, force: true });
	}
}

process.exitCode = await main();
