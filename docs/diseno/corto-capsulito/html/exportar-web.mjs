// Versión web del corto (plan.md §7): reduce el montaje de 1080 × 1920 a 720 × 1280 y copia portada y subtítulos a `static/corto/` (la portada en JPEG: el ffmpeg habitual no trae WebP).
// La aplicación solo descarga el vídeo cuando la persona pulsa «Ver el corto». No entra en la precarga de la PWA.
// Requisito: entrega/el-misterio-de-la-ultima-capsula.mp4 (montar-corto.mjs) y ffmpeg en el PATH.
// Uso: node docs/diseno/corto-capsulito/html/exportar-web.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const entrega = join(aqui, '..', 'entrega');
export const DESTINO = join(raiz, 'static/corto');
/** Tope de la versión web (plan §7: de 4 a 6 MB). */
export const TAMANO_MAXIMO = 6 * 1024 * 1024;
export const ANCHO = 720;
export const ALTO = 1280;

/** Argumentos de `ffmpeg`: H.264 de calidad constante, AAC mono a 80 kbps y `faststart` para empezar a verlo sin bajarlo entero. */
export function argumentosDeVideo(entrada, salida, crf = 29) {
	return [
		'-y',
		'-loglevel',
		'error',
		'-i',
		entrada,
		'-vf',
		`scale=${ANCHO}:${ALTO}:flags=lanczos`,
		'-c:v',
		'libx264',
		'-preset',
		'slow',
		'-crf',
		String(crf),
		'-pix_fmt',
		'yuv420p',
		'-c:a',
		'aac',
		'-ac',
		'1',
		'-b:a',
		'80k',
		'-movflags',
		'+faststart',
		salida,
	];
}

function ffmpeg(argumentos) {
	const r = spawnSync('ffmpeg', argumentos, { encoding: 'utf8' });
	if (r.status !== 0) throw new Error(`ffmpeg falló: ${r.stderr.trim().split('\n').slice(-3).join(' | ')}`);
}

export function exportarWeb({ crf = 29 } = {}) {
	const origen = join(entrega, 'el-misterio-de-la-ultima-capsula.mp4');
	for (const f of [origen, join(entrega, 'portada.png')]) {
		if (!existsSync(f)) throw new Error(`Falta ${f}`);
	}
	mkdirSync(DESTINO, { recursive: true });
	const video = join(DESTINO, 'el-misterio-de-la-ultima-capsula.mp4');
	ffmpeg(argumentosDeVideo(origen, video, crf));
	ffmpeg(['-y', '-loglevel', 'error', '-i', join(entrega, 'portada.png'), '-vf', `scale=${ANCHO}:${ALTO}:flags=lanczos`, '-q:v', '4', join(DESTINO, 'portada.jpg')]);
	return { video, bytes: statSync(video).size };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		const { bytes } = exportarWeb();
		process.stdout.write(`Versión web en static/corto/ (${(bytes / 1024 / 1024).toFixed(2)} MB).\n`);
	} catch (causa) {
		process.stderr.write(`${causa instanceof Error ? causa.message : 'Error desconocido'}\n`);
		process.exitCode = 1;
	}
}
