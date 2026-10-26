// Captura un plano HTML fotograma a fotograma (1080 × 1920, 30 fps) y lo monta con su locución.
// Uso:
//   node docs/diseno/corto-capsulito/html/capturar-plano.mjs 01                  → entrega/planos/plano-01.mp4
//   node docs/diseno/corto-capsulito/html/capturar-plano.mjs 01 --hoja 0,2,4,6   → hoja de fotogramas en .local/
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const corto = resolve(aqui, '..');
const numero = process.argv[2];
if (!/^\d\d$/.test(numero ?? '')) throw new Error('Indica el número de plano con dos cifras, por ejemplo 01');
const indiceHoja = process.argv.indexOf('--hoja');
const hoja = indiceHoja > 0 ? process.argv[indiceHoja + 1].split(',').map(Number) : null;
const FPS = 30;

const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const servidor = createServer((peticion, respuesta) => {
  const ruta = normalize(join(raiz, decodeURIComponent(new URL(peticion.url, 'http://x').pathname)));
  if (!ruta.startsWith(raiz) || !existsSync(ruta)) {
    respuesta.statusCode = 404;
    respuesta.end();
    return;
  }
  respuesta.setHeader('content-type', tipos[extname(ruta)] ?? 'application/octet-stream');
  respuesta.end(readFileSync(ruta));
});
await new Promise((listo) => servidor.listen(0, '127.0.0.1', listo));
const direccion = servidor.address();
if (!direccion || typeof direccion === 'string') throw new Error('Sin puerto local');

const temporal = join(raiz, '.local/corto-capsulito', `plano-${numero}`);
rmSync(temporal, { recursive: true, force: true });
mkdirSync(temporal, { recursive: true });

let navegador;
try {
  navegador = await chromium.launch({ headless: true });
  const pagina = await navegador.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  const errores = [];
  pagina.on('pageerror', (error) => {
    errores.push(error.message);
    process.stderr.write(`Error del navegador: ${error.message}\n`);
  });
  await pagina.goto(`http://127.0.0.1:${direccion.port}/docs/diseno/corto-capsulito/html/plano-${numero}.html?captura`);
  // El código del navegador va como texto: ESLint no conoce `window` ni `document`.
  await pagina.waitForFunction('window.listo === true');
  await pagina.evaluate('document.fonts.ready');
  const { duracion, voz } = await pagina.evaluate('({ duracion: window.DURACION, voz: window.VOZ })');
  const escenario = pagina.locator('#escenario');

  const instantes = hoja ?? Array.from({ length: Math.round(duracion * FPS) }, (_, i) => i / FPS);
  for (const [i, t] of instantes.entries()) {
    await pagina.evaluate(`window.render(${t})`);
    await escenario.screenshot({ path: join(temporal, `f-${String(i).padStart(5, '0')}.png`) });
  }
  if (errores.length) throw new Error(`Errores del navegador: ${errores.join('; ')}`);

  if (hoja) {
    const salida = join(temporal, 'hoja.png');
    const columnas = Math.min(instantes.length, 5);
    const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(temporal, 'f-%05d.png'), '-vf', `scale=432:-1,tile=${columnas}x${Math.ceil(instantes.length / columnas)}`, '-frames:v', '1', salida], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('No se pudo montar la hoja');
    process.stdout.write(`${salida}\n`);
  } else {
    const destino = join(corto, 'entrega/planos');
    mkdirSync(destino, { recursive: true });
    const salida = join(destino, `plano-${numero}.mp4`);
    // Cada tramo de la locución se recorta y se coloca en su instante del plano.
    const n = voz.tramos.length;
    const tramos = voz.tramos
      .map((tr, i) => `[s${i}]atrim=${tr.desde}:${tr.hasta},asetpts=PTS-STARTPTS,adelay=${Math.round(tr.en * 1000)}:all=1[v${i}]`)
      .join(';');
    const salidas = voz.tramos.map((_, i) => `[s${i}]`).join('');
    const mezcla = voz.tramos.map((_, i) => `[v${i}]`).join('');
    const filtro = `[1:a]asplit=${n}${salidas};${tramos};${mezcla}amix=inputs=${n}:normalize=0,apad=whole_dur=${duracion}[a]`;
    const r = spawnSync('ffmpeg', [
      '-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(temporal, 'f-%05d.png'),
      '-i', join(corto, 'audio/locuciones', voz.archivo),
      '-filter_complex', filtro,
      '-map', '0:v', '-map', '[a]', '-t', String(duracion),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', salida,
    ], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('No se pudo codificar el plano');
    process.stdout.write(`${salida}\n`);
  }
} finally {
  await navegador?.close();
  servidor.close();
}
