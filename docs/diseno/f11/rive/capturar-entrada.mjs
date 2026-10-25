// Captura cada estado de `capulito-entrada.riv` con el runtime web (la CLI de Rive no fija entradas de la máquina de estados).
// Uso, desde la raíz: node docs/diseno/f11/rive/capturar-entrada.mjs
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const RIV = 'docs/diseno/f11/rive/entrada/build/entrada.riv';
const SALIDA = 'docs/diseno/f11/rive/entrada/capturas';
const LIBRERIA = 'node_modules/@rive-app/canvas/rive.js';
const WASM = 'static/mascota/riv/rive.wasm';
mkdirSync(SALIDA, { recursive: true });

const servidor = createServer((peticion, respuesta) => {
	const archivos = {
		'/rive.js': [LIBRERIA, 'text/javascript'],
		'/rive.wasm': [WASM, 'application/wasm'],
		'/entrada.riv': [RIV, 'application/octet-stream'],
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
await pagina.goto(`http://localhost:${port}/`);
await pagina.addScriptTag({ url: '/rive.js' });
// El código del navegador va como texto: ESLint no conoce `rive`, `window` ni `document`.
await pagina.evaluate(`(async () => {
	rive.RuntimeLoader.setWasmUrl('/rive.wasm');
	await new Promise((listo, fallo) => {
		window.r = new rive.Rive({
			src: '/entrada.riv',
			canvas: document.getElementById('c'),
			stateMachine: 'Entrada',
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

const pausa = (ms) => pagina.waitForTimeout(ms);
const captura = async (nombre) => {
	await pagina.locator('#c').screenshot({ path: `${SALIDA}/${nombre}.png` });
	console.log(nombre);
};
const poner = (nombre, valor) => pagina.evaluate(`(typeof ${JSON.stringify(valor)} === 'number' ? window.vmi.number(${JSON.stringify(nombre)}) : window.vmi.boolean(${JSON.stringify(nombre)})).value = ${JSON.stringify(valor)}`);
const disparar = (nombre) => pagina.evaluate(`window.vmi.trigger(${JSON.stringify(nombre)}).trigger()`);

await poner('mirarX', 50);
await pausa(400);
await captura('1-reposo');
await poner('mirarX', 0);
await pausa(300);
await captura('2-mirando-izquierda');
await poner('mirarX', 100);
await pausa(300);
await captura('3-mirando-derecha');
await poner('mirarX', 50);
await poner('taparOjos', true);
await pausa(700);
await captura('4-ojos-tapados');
await poner('taparOjos', false);
await pausa(700);
await disparar('fallo');
await pausa(800);
await captura('5-triste');
await pausa(2500);
await captura('5b-recupera-tras-fallo');
await disparar('exito');
await pausa(380);
await captura('6-celebrando-salto');
await pausa(1000);
await captura('6b-celebrando-final');

await navegador.close();
servidor.close();
