// Montaje final de la versión HTML (plan.md §6): une los siete planos con su locución, mezcla la banda sonora,
// y escribe los subtítulos VTT, la transcripción, la portada y la lámina de fotogramas.
// Requisitos: entrega/planos/plano-01…07.mp4 (capturar-plano.mjs) y audio/banda-sonora-planos.mp3 (banda-sonora.mjs).
// Uso: node docs/diseno/corto-capsulito/html/montar-corto.mjs
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const corto = resolve(aqui, '..');
const entrega = join(corto, 'entrega');
const PLANOS = ['01', '02', '03', '04', '05', '06', '07'];
const clips = PLANOS.map((n) => join(entrega, 'planos', `plano-${n}.mp4`));
const musica = join(corto, 'audio/banda-sonora-planos.mp3');
for (const f of [...clips, musica]) if (!existsSync(f)) throw new Error(`Falta ${f}`);

/** Lo que pasa en cada plano, para la transcripción (guion.md). */
const ACCION = [
  'Capsulito llega andando con sueño, bosteza y saluda a la cafetera, que le responde con una luz y un poco de vapor. Abre el armario.',
  'En el hueco del Ristretto queda una sola cápsula. Capsulito saca el papel de apuntes, que dice «quedan 6». Intenta señalar la cápsula y esta se esconde al fondo.',
  'Capsulito investiga con una lupa enorme. Aparecen tazas fantasma que alguien se bebe y las cápsulas Suave se van solas a la cafetera sin que nadie lo apunte.',
  'Capsulito tira la lupa y aparece beCafé en un móvil. Toca «+1» en la tarjeta de Intenso: aparece «Registrado» y el contador pasa de 4 a 3. La cafetera prepara el café y el hueco de Intenso muestra las mismas 3 cápsulas.',
  'La tarjeta de Ristretto avisa: «Quedan pocas». Capsulito lo anuncia con un megáfono diminuto. Caen dos cajas, Capsulito registra la compra, la hucha paga y el hueco del Ristretto se llena.',
  'Dos fichas: «Café → tu saldo» y «Aportación → hucha, y suma a tu saldo». Capsulito echa una moneda y la hucha se pone contenta. Después echa granos de café: la hucha se los escupe y le rebotan en la cabeza.',
  'Capsulito despide el papel de una patada; la bola cierra el armario. La taza salta de la cafetera, Capsulito la recoge y la levanta. Aparece la marca beCafé y Capsulito guiña un ojo.',
];

const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
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
const url = (n, t) => `http://127.0.0.1:${direccion.port}/docs/diseno/corto-capsulito/html/plano-${n}.html?t=${t}`;

function ejecutar(argumentos, error) {
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...argumentos], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(error);
}

let navegador;
try {
  navegador = await chromium.launch({ headless: true });
  const pagina = await navegador.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });

  // Duración y subtítulos de cada plano, leídos de la propia página.
  const planos = [];
  for (const n of PLANOS) {
    await pagina.goto(url(n, 0));
    // El código del navegador va como texto: ESLint no conoce `window` ni `document`.
    await pagina.waitForFunction('window.listo === true');
    planos.push(await pagina.evaluate('({ duracion: window.DURACION, subtitulos: window.SUBTITULOS })'));
  }
  let inicio = 0;
  for (const p of planos) {
    p.inicio = inicio;
    inicio += p.duracion;
  }
  const total = inicio;

  // Vídeo: concatena los planos con su voz y mezcla la banda sonora por debajo.
  const salida = join(entrega, 'el-misterio-de-la-ultima-capsula.mp4');
  const entradas = clips.flatMap((c) => ['-i', c]);
  // Cada voz se rellena con silencio hasta la duración de su plano: si no, las voces siguientes se adelantan.
  const rellenos = planos.map((p, i) => `[${i}:a]apad=whole_dur=${p.duracion},atrim=0:${p.duracion}[r${i}]`).join(';');
  const union = `${rellenos};${clips.map((_, i) => `[${i}:v][r${i}]`).join('')}concat=n=${clips.length}:v=1:a=1[v][voz]`;
  const mezcla = `[${clips.length}:a]volume=0.55,apad=whole_dur=${total}[m];[voz][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.92[a]`;
  ejecutar(
    [...entradas, '-i', musica, '-filter_complex', `${union};${mezcla}`, '-map', '[v]', '-map', '[a]', '-t', String(total),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', salida],
    'No se pudo montar el corto',
  );

  // Subtítulos VTT con los mismos textos y tiempos que se ven en pantalla.
  const hora = (s) => {
    const ms = Math.round(s * 1000);
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor(ms / 60000) % 60).padStart(2, '0');
    const sg = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
    return `${h}:${m}:${sg}.${String(ms % 1000).padStart(3, '0')}`;
  };
  const cues = planos.flatMap((p) => p.subtitulos.map(([a, b, texto]) => `${hora(p.inicio + a)} --> ${hora(p.inicio + Math.min(b, p.duracion))}\n${texto}`));
  writeFileSync(join(entrega, 'subtitulos.vtt'), `WEBVTT\n\n${cues.join('\n\n')}\n`);

  // Transcripción: acción de cada plano y locución completa.
  const textos = PLANOS.map((n) => JSON.parse(readFileSync(join(corto, `audio/locuciones/corto_${n}.json`), 'utf8')).texto);
  const transcripcion = [
    '# Transcripción del corto «El misterio de la última cápsula»',
    '',
    ...ACCION.flatMap((accion, i) => [accion, '', `**Capsulito:** ${textos[i]}`, '']),
    `Esta transcripción describe la acción y reproduce la locución del montaje de ${Math.round(total)} segundos.`,
    '',
  ].join('\n');
  writeFileSync(join(entrega, 'transcripcion.md'), transcripcion);

  // Portada: el ojo gigante tras la lupa, con el título del corto.
  await pagina.goto(url('03', 3.9));
  await pagina.waitForFunction('window.listo === true');
  await pagina.evaluate(`
    document.getElementById('titulo').textContent = 'El misterio de la última cápsula';
    document.getElementById('subtitulo').replaceChildren();
  `);
  await pagina.locator('#escenario').screenshot({ path: join(entrega, 'portada.png') });

  // Lámina: un fotograma representativo por plano.
  const momentos = [7.0, 9.0, 3.9, 4.6, 3.0, 8.65, 6.6];
  const selector = momentos.map((t, i) => `eq(n\\,${Math.round((planos[i].inicio + t) * 30)})`).join('+');
  ejecutar(
    ['-i', salida, '-vf', `select='${selector}',scale=300:-1,tile=7x1`, '-frames:v', '1', '-vsync', 'vfr', join(entrega, 'lamina-final.png')],
    'No se pudo montar la lámina',
  );
  process.stdout.write(`${salida}\nDuración: ${total.toFixed(1)} s\n`);
} finally {
  await navegador?.close();
  servidor.close();
}
