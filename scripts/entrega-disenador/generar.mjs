// Genera la copia estática de las pantallas para el diseñador (docs/diseno/entrega-disenador/).
// Levanta la aplicación con datos ficticios y con una base vacía, recorre sus rutas con Playwright como cada persona
// y guarda el HTML ya renderizado, con su CSS y sus fuentes en `recursos/`. No cambia el código de la aplicación.
// Uso: node scripts/entrega-disenador/generar.mjs
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, request } from '@playwright/test';

const RAIZ = process.cwd();
const SALIDA = join(RAIZ, 'docs', 'diseno', 'entrega-disenador');
const LOCAL = join(RAIZ, '.local', 'entrega-disenador');
const PUERTO = 4860;
const ORIGEN = `http://127.0.0.1:${PUERTO}`;
// Contraseña y correos de la siembra de prueba (scripts/servidor/sembrar-e2e.ts). Son ficticios.
const CONTRASENA = 'contraseña de prueba e2e';
const CORREOS = { admin: 'ana.prueba@ejemplo.es', miembro: 'luis.prueba@ejemplo.es' };
const TIPOS = ['Ristretto demo', 'Intenso demo', 'Descafeinado demo'];
const VISTAS = { movil: { width: 390, height: 844 }, escritorio: { width: 1280, height: 800 } };
const TEMAS = ['claro', 'oscuro'];
const MAX_PAGINAS = 90;
// Rutas que no se recorren: API, recursos internos, acceso por enlace y sesión.
const IGNORAR = /^\/(api|_app|acceso|login|logout)(\/|$)/;
const DATASETS = [
	{ nombre: 'con-datos', conActividad: true },
	{ nombre: 'vacio', conActividad: false },
];

function escribir(texto) {
	process.stdout.write(`${texto}\n`);
}

function entorno(datos) {
	return {
		PATH: process.env.PATH ?? '',
		HOST: '127.0.0.1',
		PORT: String(PUERTO),
		ORIGIN: ORIGEN,
		DIRECTORIO_DATOS: datos,
		ADMIN_INICIAL_EMAIL: CORREOS.admin,
		ADMIN_INICIAL_NOMBRE: 'Administración de prueba',
		LOG_LEVEL: 'warn',
		TZ: 'Europe/Madrid',
	};
}

function ejecutar(args, env) {
	const resultado = spawnSync(process.execPath, args, { cwd: RAIZ, env, stdio: 'inherit' });
	if (resultado.status !== 0) throw new Error(`Falló: node ${args.join(' ')}`);
}

function construir(datos) {
	const env = { ...process.env, ORIGIN: ORIGEN, DIRECTORIO_DATOS: datos, TZ: 'Europe/Madrid' };
	ejecutar(['scripts/generate-tokens.mjs'], env);
	ejecutar(['node_modules/vite/bin/vite.js', 'build'], env);
	ejecutar(['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.comandos.config.ts'], env);
}

function sembrar(datos) {
	ejecutar(['build-scripts/sembrar-e2e.js'], entorno(datos));
}

function arrancar(datos) {
	const proceso = spawn(process.execPath, ['build'], { cwd: RAIZ, env: entorno(datos), stdio: ['ignore', 'pipe', 'pipe'] });
	return new Promise((resolver, rechazar) => {
		let salida = '';
		const limite = setTimeout(() => rechazar(new Error('El servidor no arrancó a tiempo')), 60_000);
		proceso.stdout.on('data', (fragmento) => {
			salida += fragmento;
			if (salida.includes('Listening on')) {
				clearTimeout(limite);
				resolver(proceso);
			}
		});
		proceso.once('exit', (codigo) => {
			clearTimeout(limite);
			rechazar(new Error(`El servidor terminó (código ${codigo})`));
		});
	});
}

// El servidor puede no salir con SIGTERM (las tareas programadas siguen abiertas): tras unos segundos se fuerza el cierre.
function parar(proceso) {
	return new Promise((resolver) => {
		const forzar = setTimeout(() => proceso.kill('SIGKILL'), 5_000);
		proceso.once('exit', () => {
			clearTimeout(forzar);
			resolver();
		});
		proceso.kill();
	});
}

async function sesion(browser, correo, tema, viewport) {
	const ctx = await browser.newContext({ locale: 'es-ES', timezoneId: 'Europe/Madrid', viewport });
	// La preferencia de tema se guarda en el dispositivo (CLAVE_TEMA = becafe-tema): se fija antes de cargar la página.
	await ctx.addInitScript((valor) => {
		try {
			localStorage.setItem('becafe-tema', valor);
		} catch {
			// Sin almacenamiento, la página usa el tema del sistema.
		}
	}, tema);
	const page = await ctx.newPage();
	await entrar(page, correo);
	return { ctx, page };
}

async function entrar(page, correo) {
	await page.goto(`${ORIGEN}/login`);
	await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(correo);
	await page.getByRole('textbox', { name: 'Contraseña', exact: true }).fill(CONTRASENA);
	await page.getByRole('button', { name: 'Entrar', exact: true }).click();
	await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

async function irA(page, ruta) {
	await page.goto(`${ORIGEN}${ruta}`, { waitUntil: 'load' });
	await page.waitForLoadState('networkidle');
}

function escaparRegex(texto) {
	return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Datos de demostración, solo en la base con datos: se crean con la propia interfaz, como lo haría una persona.
async function actividad(browser) {
	const admin = await sesion(browser, CORREOS.admin, 'claro', VISTAS.escritorio);
	for (const nombre of TIPOS) {
		await irA(admin.page, '/admin/capsulas/nueva');
		await admin.page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(nombre);
		await admin.page.getByRole('textbox', { name: 'Marca', exact: true }).fill('Marca de prueba');
		await admin.page.getByRole('combobox', { name: 'Color', exact: true }).selectOption('cap-ristretto');
		await admin.page.getByRole('spinbutton', { name: 'Umbral mínimo (unidades)', exact: true }).fill('3');
		const respuesta = admin.page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/admin/capsulas/nueva'));
		await admin.page.getByRole('button', { name: 'Dar de alta', exact: true }).click();
		await respuesta;
	}
	await admin.ctx.close();

	const miembro = await sesion(browser, CORREOS.miembro, 'claro', VISTAS.escritorio);
	const page = miembro.page;
	await irA(page, '/saldos');
	await page.getByRole('textbox', { name: 'Importe', exact: true }).fill('50');
	await page.getByRole('button', { name: 'Aportar', exact: true }).click();
	await page.getByRole('status').filter({ hasText: 'Aportación registrada' }).first().waitFor();
	for (const nombre of TIPOS) {
		await irA(page, '/compras');
		await page.getByRole('combobox', { name: 'Tipo de cápsula', exact: true }).first().selectOption({ label: nombre });
		await page.getByRole('spinbutton', { name: 'Cantidad', exact: true }).first().fill('1');
		await page.getByRole('textbox', { name: 'Importe', exact: true }).first().fill('3,48');
		await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();
		await page.waitForURL(/\/compras\/[0-9A-Z]{26}$/);
	}
	for (const nombre of TIPOS) {
		for (let i = 0; i < 2; i += 1) {
			await irA(page, '/');
			const boton = page.getByRole('button', { name: new RegExp(`^Registrar ${escaparRegex(nombre)}(?! para un invitado)`) }).first();
			await boton.click();
			await page.waitForLoadState('networkidle');
		}
	}
	await irA(page, '/');
	await page.getByRole('button', { name: 'He rellenado el agua', exact: true }).click();
	await page.getByRole('status').filter({ hasText: 'Relleno registrado' }).first().waitFor();
	await miembro.ctx.close();
}

// Rutas alcanzables desde los enlaces de la propia aplicación, empezando por la pantalla principal.
function normalizarRuta(pathname) {
	return pathname.replace(/\/$/, '') || '/';
}

function rutaDeEnlace(href) {
	if (!href || href.startsWith('#')) return null;
	let url;
	try {
		url = new URL(href, ORIGEN);
	} catch {
		return null;
	}
	if (url.origin !== ORIGEN) return null;
	if (IGNORAR.test(url.pathname)) return null;
	return normalizarRuta(url.pathname);
}

async function descubrir(page) {
	const pendientes = ['/'];
	const vistas = new Set();
	const orden = [];
	while (pendientes.length > 0 && orden.length < MAX_PAGINAS) {
		const ruta = pendientes.shift();
		if (vistas.has(ruta)) continue;
		vistas.add(ruta);
		await irA(page, ruta);
		orden.push(ruta);
		const enlaces = await page.$$eval('a[href]', (anclas) => anclas.map((a) => a.getAttribute('href')));
		for (const href of enlaces) {
			const destino = rutaDeEnlace(href);
			if (destino && !vistas.has(destino)) pendientes.push(destino);
		}
	}
	return orden;
}

function nombreDeRuta(ruta) {
	return ruta === '/'
		? 'inicio'
		: ruta
				.slice(1)
				.replace(/\//g, '_')
				.replace(/[^\w-]/g, '-');
}

// Captura de una persona: cada ruta, en cada tema y en cada vista. Si móvil y escritorio coinciden, se guarda una sola vez.
async function capturarPersona(browser, persona) {
	const correo = CORREOS[persona];
	const { ctx: ctxDescubrir, page: pageDescubrir } = await sesion(browser, correo, 'claro', VISTAS.escritorio);
	const rutas = await descubrir(pageDescubrir);
	await ctxDescubrir.close();
	const entradas = [];

	for (const tema of TEMAS) {
		const { ctx, page } = await sesion(browser, correo, tema, VISTAS.escritorio);
		for (const ruta of rutas) {
			const htmlPorVista = {};
			for (const vista of Object.keys(VISTAS)) {
				await page.setViewportSize(VISTAS[vista]);
				await irA(page, ruta);
				htmlPorVista[vista] = await page.content();
			}
			const iguales = htmlPorVista.movil === htmlPorVista.escritorio;
			if (iguales) {
				entradas.push({ persona, tema, ruta, vista: 'unica', html: htmlPorVista.escritorio });
			} else {
				for (const vista of Object.keys(VISTAS)) {
					entradas.push({ persona, tema, ruta, vista, html: htmlPorVista[vista] });
				}
			}
		}
		if (persona === 'miembro' && tema === 'claro') {
			// Estado sin conexión: la tarjeta de agua pasa a su texto de «sin conexión» cuando el navegador lo notifica.
			await page.setViewportSize(VISTAS.movil);
			await irA(page, '/');
			await ctx.setOffline(true);
			await page.waitForFunction(() => navigator.onLine === false);
			entradas.push({ persona, tema, ruta: '/estado-sin-conexion', vista: 'unica', html: await page.content() });
			await ctx.setOffline(false);
		}
		if (persona === 'admin' && tema === 'claro') {
			await page.setViewportSize(VISTAS.escritorio);
			await page.goto(`${ORIGEN}/ruta-que-no-existe`);
			await page.waitForLoadState('networkidle');
			entradas.push({ persona, tema, ruta: '/estado-no-encontrada', vista: 'unica', html: await page.content() });
		}
		await ctx.close();
	}
	return entradas;
}

// Quita el JavaScript de la página: la copia se mira sin servidor y no debe intentar hidratarse.
// La compilación fija el origen en las URL (kit.paths.origin) y SvelteKit usa rutas `./`: ambas se convierten en
// rutas del sitio (`/...`) para resolverlas igual que en el servidor.
function limpiarHtml(html) {
	return html
		.replaceAll(ORIGEN, '')
		.replace(/(src|href|srcset)="\.\//g, '$1="/')
		.replace(/url\((["']?)\.\//g, 'url($1/')
		.replace(/<script\b[\s\S]*?<\/script>/g, '')
		.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '');
}

function aplanar(ruta) {
	return ruta
		.replace(/^\/+/, '')
		.split(/[?#]/)[0]
		.replace(/[^\w.-]/g, '_');
}

function reescribirEnlaces(html, entrada, mapa) {
	return html.replace(/<a\b([^>]*?)\shref="([^"]*)"/g, (completo, atributos, href) => {
		if (href.startsWith('#')) return completo;
		const ruta = rutaDeEnlace(href);
		if (!ruta) return href.startsWith('http') ? completo : `<a${atributos} href="#"`;
		const archivos = mapa.get(`${entrada.persona}|${entrada.tema}|${ruta}`);
		const archivo = archivos?.[entrada.vista];
		return `<a${atributos} href="${archivo ?? '#'}"`;
	});
}

function recursosDeHtml(html) {
	const rutas = new Set();
	for (const coincidencia of html.matchAll(/(?:src|href|srcset)="(\/[^"]+)"/g)) rutas.add(coincidencia[1].split(/[?#]/)[0]);
	for (const coincidencia of html.matchAll(/url\((?:&quot;|["'])?(\/[^"')&\s]+)/g)) rutas.add(coincidencia[1].split(/[?#]/)[0]);
	return rutas;
}

function recursosDeCss(texto) {
	const rutas = new Set();
	for (const coincidencia of texto.matchAll(/url\((["']?)\/([^"')\s]+)\1\)/g)) rutas.add(`/${coincidencia[2].split(/[?#]/)[0]}`);
	return rutas;
}

async function descargarRecursos(api, rutasIniciales, carpeta) {
	const hechas = new Set();
	const pendientes = [...rutasIniciales];
	let fallos = 0;
	while (pendientes.length > 0) {
		const ruta = pendientes.shift();
		if (hechas.has(ruta)) continue;
		hechas.add(ruta);
		const respuesta = await api.get(`${ORIGEN}${ruta}`);
		if (!respuesta.ok()) {
			fallos += 1;
			continue;
		}
		const cuerpo = await respuesta.body();
		const nombre = aplanar(ruta);
		if (nombre.endsWith('.css')) {
			// Las `url(./x)` del CSS son relativas a su propio directorio: se resuelven antes de aplanar las rutas.
			const dir = ruta.slice(0, ruta.lastIndexOf('/') + 1);
			const texto = cuerpo
				.toString('utf8')
				.replaceAll(ORIGEN, '')
				.replace(/url\((["']?)\.\//g, (_, comilla) => `url(${comilla}${dir}`);
			for (const dependencia of recursosDeCss(texto)) pendientes.push(dependencia);
			const reescrito = texto.replace(
				/url\((["']?)\/([^"')\s]+)\1\)/g,
				(_, comilla, resto) => `url(${comilla}./${aplanar(`/${resto}`)}${comilla})`,
			);
			await writeFile(join(carpeta, nombre), reescrito, 'utf8');
		} else {
			await writeFile(join(carpeta, nombre), cuerpo);
		}
	}
	return fallos;
}

function reescribirRecursos(html) {
	return html
		.replace(/(src|href|srcset)="(\/[^"]+)"/g, (_, atributo, ruta) => `${atributo}="../recursos/${aplanar(ruta)}"`)
		.replace(/url\((&quot;|["'])?\/([^"')&\s]+)/g, (_, comilla = '', resto) => `url(${comilla}../recursos/${aplanar(`/${resto}`)}`);
}

async function escribirDataset(browser, nombre, personas) {
	const carpeta = join(SALIDA, nombre);
	await mkdir(carpeta, { recursive: true });
	const entradas = [];
	for (const persona of personas) entradas.push(...(await capturarPersona(browser, persona)));

	// Nombre de archivo y mapa de enlaces: `persona|tema|ruta` → archivo por vista.
	const mapa = new Map();
	for (const entrada of entradas) {
		const archivo = `${entrada.persona}--${nombreDeRuta(entrada.ruta)}--${entrada.tema}--${entrada.vista}.html`;
		entrada.archivo = archivo;
		const clave = `${entrada.persona}|${entrada.tema}|${entrada.ruta}`;
		const actual = mapa.get(clave) ?? {};
		if (entrada.vista === 'unica') {
			actual.movil = archivo;
			actual.escritorio = archivo;
			actual.unica = archivo;
		} else {
			actual[entrada.vista] = archivo;
		}
		mapa.set(clave, actual);
	}

	const procesadas = entradas.map((entrada) => ({ ...entrada, salida: reescribirEnlaces(limpiarHtml(entrada.html), entrada, mapa) }));
	const rutasRecursos = new Set();
	for (const pagina of procesadas) for (const ruta of recursosDeHtml(pagina.salida)) rutasRecursos.add(ruta);

	const api = await request.newContext({ baseURL: ORIGEN });
	const fallos = await descargarRecursos(api, rutasRecursos, join(SALIDA, 'recursos'));
	await api.dispose();

	for (const pagina of procesadas) {
		await writeFile(join(carpeta, pagina.archivo), reescribirRecursos(pagina.salida), 'utf8');
	}
	return { paginas: procesadas.length, fallos, mapa, procesadas };
}

function indice(resultados) {
	const filas = [];
	for (const { nombre, procesadas } of resultados) {
		const grupos = new Map();
		for (const p of procesadas) {
			const clave = `${p.persona}|${p.ruta}|${p.tema}`;
			if (!grupos.has(clave)) grupos.set(clave, { ...p, vistas: new Set() });
			grupos.get(clave).vistas.add(p.vista);
		}
		for (const grupo of grupos.values()) {
			const etiqueta = `${grupo.persona === 'admin' ? 'Administradora de prueba' : 'Miembro de prueba'} · ${grupo.tema} · ${grupo.ruta}`;
			filas.push(`<li><a href="${nombre}/${grupo.archivo}">${etiqueta}</a></li>`);
		}
	}
	return `<!doctype html>
<html lang="es" data-theme="claro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>beCafé · pantallas estáticas para diseño</title>
</head>
<body>
<main style="font-family: system-ui, sans-serif; max-width: 960px; margin: 0 auto; padding: 24px;">
<h1>beCafé · pantallas estáticas para diseño</h1>
<p>Copia de las pantallas de la aplicación, sin servidor ni conexión. Cada enlace abre una pantalla en un tema y una persona concretos.</p>
<p>Carpetas: <strong>con-datos</strong> (datos ficticios: cápsulas, compras, consumos, aportaciones y un relleno) y <strong>vacio</strong> (base sin actividad). Los nombres de archivo indican persona, pantalla, tema y vista (móvil o escritorio; «unica» si ambas coinciden).</p>
<p>Estados sin capturar: «cargando», porque la copia se toma cuando la página ya está cargada, y el error de servidor, que no se provoca.</p>
<ul>
${filas.join('\n')}
</ul>
</main>
</body>
</html>
`;
}

async function main() {
	await mkdir(LOCAL, { recursive: true });
	const datosBuild = await mkdtemp(join(LOCAL, 'build-'));
	escribir('Construyendo la aplicación para la copia...');
	construir(datosBuild);
	await rm(join(SALIDA, 'recursos'), { recursive: true, force: true });
	await mkdir(join(SALIDA, 'recursos'), { recursive: true });

	const navegador = await chromium.launch();
	const resultados = [];
	try {
		for (const { nombre, conActividad } of DATASETS) {
			const datos = await mkdtemp(join(LOCAL, `${nombre}-`));
			escribir(`Sembrando ${nombre}...`);
			sembrar(datos);
			const proceso = await arrancar(datos);
			try {
				if (conActividad) {
					escribir('Creando cápsulas, compras, aportaciones, consumos y un relleno...');
					await actividad(navegador);
				}
				escribir(`Capturando ${nombre}...`);
				const resultado = await escribirDataset(navegador, nombre, ['admin', 'miembro']);
				resultados.push({ nombre, ...resultado });
				escribir(`${nombre}: ${resultado.paginas} páginas, ${resultado.fallos} recursos no descargados.`);
			} finally {
				await parar(proceso);
				await rm(datos, { recursive: true, force: true });
			}
		}
	} finally {
		await navegador.close();
		await rm(datosBuild, { recursive: true, force: true });
	}
	await writeFile(join(SALIDA, 'index.html'), indice(resultados), 'utf8');
	escribir(`Listo: ${join('docs', 'diseno', 'entrega-disenador')}`);
}

await main();
