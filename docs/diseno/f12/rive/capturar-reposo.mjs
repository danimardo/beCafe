// Captura los fotogramas clave de cada gesto de `capsulito-reposo.riv` con el runtime web (la CLI de Rive no lanza disparadores).
// Uso, desde la raíz: node docs/diseno/f12/rive/capturar-reposo.mjs
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { chromium } from '@playwright/test';

const RIV = 'docs/diseno/f12/rive/reposo/build/reposo.riv';
const SALIDA = 'docs/diseno/f12/rive/reposo/capturas';
const LIBRERIA = 'node_modules/@rive-app/canvas/rive.js';
const WASM = 'static/mascota/riv/rive.wasm';
rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });

const servidor = createServer((peticion, respuesta) => {
	const archivos = {
		'/rive.js': [LIBRERIA, 'text/javascript'],
		'/rive.wasm': [WASM, 'application/wasm'],
		'/reposo.riv': [RIV, 'application/octet-stream'],
	};
	const entrada = archivos[peticion.url ?? ''];
	if (entrada) {
		respuesta.setHeader('content-type', entrada[1]);
		respuesta.end(readFileSync(entrada[0]));
	} else {
		respuesta.setHeader('content-type', 'text/html');
		respuesta.end('<!doctype html><body style="margin:0;background:#fff7ea"><canvas id="c" width="600" height="600"></canvas></body>');
	}
});
await new Promise((listo) => servidor.listen(0, listo));
const { port } = servidor.address();

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 600, height: 600 } });

/** Carga el `.riv` desde cero: el reloj de la animación vuelve a 0. */
async function cargar() {
	await pagina.goto(`http://localhost:${port}/`);
	await pagina.addScriptTag({ url: '/rive.js' });
	// El código del navegador va como texto: ESLint no conoce `rive`, `window` ni `document`.
	await pagina.evaluate(`(async () => {
		rive.RuntimeLoader.setWasmUrl('/rive.wasm');
		await new Promise((listo, fallo) => {
			window.r = new rive.Rive({
				src: '/reposo.riv',
				canvas: document.getElementById('c'),
				stateMachine: 'Reposo',
				autoBind: true,
				autoplay: true,
				onLoad: () => {
					window.r.resizeDrawingSurfaceToCanvas();
					listo();
				},
				onLoadError: fallo,
			});
		});
		window.vmi = window.r.viewModelInstance;
	})()`);
}

const pausa = (ms) => pagina.waitForTimeout(ms);
const captura = async (nombre) => {
	await pagina.locator('#c').screenshot({ path: `${SALIDA}/${nombre}.png` });
	console.log(nombre);
};
const disparar = (nombre) => pagina.evaluate(`window.vmi.trigger(${JSON.stringify(nombre)}).trigger()`);

await cargar();
await pausa(300);
await captura('0-neutro');

// Parpadeo: el bucle dura 3 s y el cierre cae entre 2,8 s y 2,97 s.
await cargar();
await pausa(2780);
await captura('1a-parpadeo-cerrando');
await captura('1b-parpadeo-cerrado');
await captura('1c-parpadeo-abriendo');

// Cada gesto, desde el neutro, con una captura al principio, a mitad y al final de su recorrido.
await cargar();
await disparar('mirarLados');
await pausa(300);
await captura('2a-mirar-lados-izquierda');
await pausa(500);
await captura('2b-mirar-lados-derecha');
await pausa(700);
await captura('2c-mirar-lados-vuelta');

await disparar('pie');
await pausa(130);
await captura('3a-pie-levantado');
await pausa(200);
await captura('3b-pie-en-el-suelo');
await pausa(300);
await captura('3c-pie-segundo-golpe');
await pausa(900);

// bostezoMano (1,8 s): brazo arriba y boca abierta, la mano tapa la parte baja de la boca y los ojos se entornan.
await disparar('bostezoMano');
await pausa(300);
await captura('4a-bostezo-mano-abriendo');
await pausa(500);
await captura('4b-bostezo-mano-boca-abierta');
await pausa(1100);
await captura('4c-bostezo-mano-vuelta');

// tocarReloj (2 s): el reloj de la muñeca, la mirada hacia él, cuatro golpes con la otra mano y la cara de prisa al final.
// Los instantes se cuentan desde el disparo (cada captura tarda): el primer golpe cae a los 0,62 s y la mano vuelve a subir a los 0,76 s.
const inicioToque = Date.now();
await disparar('tocarReloj');
const enMs = async (ms, nombre) => {
	await pausa(Math.max(0, ms - (Date.now() - inicioToque)));
	await captura(nombre);
};
await enMs(250, '5a-tocar-reloj-mira-el-reloj');
await enMs(640, '5b-tocar-reloj-golpe');
await enMs(800, '5c-tocar-reloj-mano-arriba');
await enMs(1750, '5d-tocar-reloj-mira-al-frente');
await enMs(2400, '5e-tocar-reloj-vuelta');

await disparar('bostezo');
await pausa(500);
await captura('6a-bostezo-abriendo');
await pausa(700);
await captura('6b-bostezo-boca-abierta');
await pausa(1500);
await captura('6c-bostezo-vuelta');

// Cancelar a mitad de un gesto devuelve la figura al neutro de inmediato.
await disparar('tocarReloj');
await pausa(500);
await disparar('cancelar');
await pausa(500);
await captura('7-cancelar-vuelve-al-neutro');

// Movimiento reducido: sin parpadeo ni respiración.
await pagina.evaluate(`window.vmi.boolean('reducedMotion').value = true`);
await pausa(400);
await captura('8-movimiento-reducido');

await navegador.close();
servidor.close();
