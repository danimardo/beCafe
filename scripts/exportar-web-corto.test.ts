import { spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';

// Versión web del corto (RF-251, plan F13 §7): `docs/diseno/corto-capsulito/html/exportar-web.mjs` deja el vídeo, la portada y los
// subtítulos en `static/corto/`. La prueba mide los archivos entregados; no vuelve a codificar (tarda más de un minuto).
const DIR = resolve(process.cwd(), 'static/corto');
const TOPE_BYTES = 6 * 1024 * 1024;
const hayFfprobe = spawnSync('ffprobe', ['-version'], { stdio: 'ignore' }).status === 0;
const esquemaSonda = z.object({
	streams: z.array(
		z.object({ codec_type: z.string(), codec_name: z.string(), width: z.number().optional(), height: z.number().optional() }),
	),
	format: z.object({ duration: z.string() }),
});

function sondear(archivo: string) {
	const r = spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', archivo], { encoding: 'utf8' });
	return esquemaSonda.parse(JSON.parse(r.stdout));
}

describe('versión web del corto (RF-251)', () => {
	it('CA-251: el vídeo cabe en 6 MB, mide 720 × 1280 y lleva H.264 con audio', { skip: !hayFfprobe }, () => {
		const archivo = resolve(DIR, 'el-misterio-de-la-ultima-capsula.mp4');
		expect(statSync(archivo).size).toBeLessThanOrEqual(TOPE_BYTES);
		const sonda = sondear(archivo);
		const video = sonda.streams.find((s) => s.codec_type === 'video');
		expect(video).toMatchObject({ codec_name: 'h264', width: 720, height: 1280 });
		expect(sonda.streams.some((s) => s.codec_type === 'audio')).toBe(true);
		expect(Number(sonda.format.duration)).toBeGreaterThan(70);
		expect(Number(sonda.format.duration)).toBeLessThan(75);
	});

	it('CA-251: la portada es un JPEG de 720 × 1280 y de menos de 300 KB', { skip: !hayFfprobe }, () => {
		const archivo = resolve(DIR, 'portada.jpg');
		expect(statSync(archivo).size).toBeLessThan(300 * 1024);
		expect(sondear(archivo).streams[0]).toMatchObject({ width: 720, height: 1280 });
	});

	it('CA-251: los subtítulos son un WebVTT con al menos 10 intervalos', () => {
		const vtt = readFileSync(resolve(DIR, 'subtitulos.vtt'), 'utf8');
		expect(vtt.startsWith('WEBVTT')).toBe(true);
		expect(vtt.match(/ --> /g)?.length ?? 0).toBeGreaterThanOrEqual(10);
	});
});
