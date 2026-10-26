// Música y efectos originales sintetizados para la versión HTML del corto (plan.md §6). No usa librerías ni
// recursos de terceros. Los instantes de los efectos son los de cada plano más el comienzo del plano.
// Uso: node docs/diseno/corto-capsulito/html/banda-sonora.mjs
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const temporal = join(raiz, '.local/corto-capsulito');
mkdirSync(temporal, { recursive: true });
const wav = join(temporal, 'banda-sonora-planos.wav');
const mp3 = resolve(aqui, '../audio/banda-sonora-planos.mp3');

/** Duración de cada plano (s), igual que `DURACION` en plano-NN.js. */
const DURACIONES = [9.6, 10.2, 10.6, 10.4, 10.2, 12.4, 9.0];
const INICIO = DURACIONES.map((_, i) => DURACIONES.slice(0, i).reduce((a, b) => a + b, 0));
const TOTAL = DURACIONES.reduce((a, b) => a + b, 0);
const en = (plano, t) => INICIO[plano - 1] + t;

const tasa = 44100;
const datos = new Float32Array(Math.ceil(tasa * TOTAL));
let semilla = 197311;
function azar() {
  semilla = (1664525 * semilla + 1013904223) >>> 0;
  return semilla / 0x100000000;
}

function tono(inicio, duracion, hzInicio, hzFin, amp, caida = 5) {
  const desde = Math.round(inicio * tasa);
  const n = Math.min(Math.round(duracion * tasa), datos.length - desde);
  let fase = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / tasa;
    const hz = hzInicio + (hzFin - hzInicio) * Math.min(1, t / duracion);
    fase += (2 * Math.PI * hz) / tasa;
    const ataque = Math.min(1, t / 0.012);
    const env = ataque * Math.exp((-caida * t) / Math.max(0.15, duracion));
    datos[desde + i] += amp * env * (Math.sin(fase) + 0.23 * Math.sin(2 * fase));
  }
}
function soplo(inicio, duracion, amp, brillo = 0.13) {
  const desde = Math.round(inicio * tasa);
  const n = Math.min(Math.round(duracion * tasa), datos.length - desde);
  let previo = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / tasa;
    previo = (1 - brillo) * previo + brillo * (azar() * 2 - 1);
    datos[desde + i] += amp * Math.sin((Math.PI * t) / duracion) ** 2 * previo;
  }
}
const golpe = (t, amp = 0.2) => {
  tono(t, 0.18, 120, 55, amp, 7);
  soplo(t, 0.06, amp * 0.6, 0.4);
};
const pip = (t, hz = 880, amp = 0.1) => tono(t, 0.14, hz, hz, amp, 7);
const zas = (t, amp = 0.07) => {
  tono(t, 0.25, 300, 900, amp, 4);
  soplo(t, 0.22, amp * 0.6, 0.3);
};
const moneda = (t) => {
  tono(t, 0.3, 1568, 1568, 0.08, 6);
  tono(t + 0.05, 0.4, 2093, 2093, 0.07, 6);
};

// Música: ostinato de misterio en la menor del plano 2 al 3; tema luminoso en do mayor del plano 4 al final.
const misterio = [110, 130.81, 164.81, 130.81, 110, 146.83, 164.81, 196];
const claro = [130.81, 164.81, 196, 164.81, 174.61, 220, 196, 164.81];
for (let pulso = 0; pulso * 0.5 < TOTAL - 0.5; pulso += 1) {
  const t = pulso * 0.5;
  const enMisterio = t >= INICIO[1] - 0.5 && t < INICIO[3];
  const notas = enMisterio ? misterio : claro;
  const suave = t < INICIO[1] - 0.5 ? 0.6 : 1;
  tono(t, 0.31, notas[pulso % 8], notas[pulso % 8], 0.04 * suave, 8);
  if (pulso % 4 === 0) tono(t, 0.66, notas[0] / 2, notas[0] / 2, 0.045 * suave, 5);
  if (pulso % 2 === 1) soplo(t, 0.08, 0.016 * suave, 0.5);
}

// Plano 1: pasos, la cafetera responde, puerta y sorpresa.
for (let k = 0; k < 7; k += 1) golpe(en(1, 0.35 + k * 0.38), 0.05);
pip(en(1, 5.45), 660, 0.08);
pip(en(1, 5.6), 990, 0.08);
soplo(en(1, 5.6), 1.4, 0.05, 0.05);
tono(en(1, 7.15), 0.6, 240, 350, 0.1, 4);
tono(en(1, 8.25), 0.45, 520, 310, 0.12, 5);
// Plano 2: papel, la cápsula se escapa y resonancia cómica.
soplo(en(2, 3.15), 0.45, 0.08, 0.5);
zas(en(2, 6.85), 0.06);
tono(en(2, 8.0), 1.0, 196, 98, 0.12, 3);
// Plano 3: lupa, ojo gigante, tazas fantasma y cápsulas que se van.
tono(en(3, 0.4), 0.2, 500, 900, 0.07, 6);
tono(en(3, 3.3), 0.5, 220, 660, 0.08, 4);
for (const t of [5.0, 5.2, 5.4]) tono(en(3, t), 0.2, 900, 1300, 0.05, 6);
for (const t of [7.5, 7.75, 8.0, 8.25]) zas(en(3, t), 0.045);
tono(en(3, 8.95), 0.5, 330, 247, 0.08, 4);
// Plano 4: lupa fuera, móvil, toque confirmado, cápsula y café.
zas(en(4, 0.35), 0.06);
golpe(en(4, 2.15), 0.16);
pip(en(4, 4.2), 680, 0.09);
tono(en(4, 4.3), 0.17, 680, 880, 0.12, 8);
golpe(en(4, 5.3), 0.08);
soplo(en(4, 5.7), 1.6, 0.06, 0.08);
// Plano 5: aviso, megáfono, cajas, compra registrada, moneda y reposición.
pip(en(5, 0.5), 540, 0.09);
pip(en(5, 0.78), 720, 0.09);
tono(en(5, 2.6), 0.6, 440, 470, 0.05, 2);
golpe(en(5, 4.75), 0.18);
golpe(en(5, 5.15), 0.15);
tono(en(5, 6.85), 0.17, 680, 880, 0.12, 8);
moneda(en(5, 7.0));
for (const t of [8.3, 8.48, 8.66]) pip(en(5, t), 1200, 0.05);
// Plano 6: fichas, moneda en la hucha, granos, escupitajo, rebote y resoplido.
pip(en(6, 0.95), 760, 0.06);
pip(en(6, 3.15), 760, 0.06);
moneda(en(6, 5.6));
soplo(en(6, 7.35), 0.3, 0.05, 0.3);
tono(en(6, 7.9), 0.3, 200, 120, 0.1, 4);
tono(en(6, 8.25), 0.2, 300, 700, 0.1, 5);
tono(en(6, 8.6), 0.64, 540, 210, 0.16, 4);
soplo(en(6, 8.9), 0.5, 0.09, 0.2);
// Plano 7: patada, portazo, taza al vuelo y campanilla final.
soplo(en(7, 1.45), 0.2, 0.08, 0.4);
golpe(en(7, 2.35), 0.22);
tono(en(7, 2.5), 0.25, 700, 1000, 0.06, 6);
tono(en(7, 5.0), 0.36, 523.25, 523.25, 0.12, 4);
tono(en(7, 5.29), 0.42, 659.25, 659.25, 0.12, 4);
tono(en(7, 5.62), 0.76, 783.99, 783.99, 0.12, 4);

// Fundido de salida en el último segundo.
const finFundido = datos.length;
const inicioFundido = finFundido - tasa;
for (let i = inicioFundido; i < finFundido; i += 1) datos[i] *= (finFundido - i) / tasa;

const pcm = Buffer.alloc(44 + datos.length * 2);
pcm.write('RIFF', 0);
pcm.writeUInt32LE(pcm.length - 8, 4);
pcm.write('WAVEfmt ', 8);
pcm.writeUInt32LE(16, 16);
pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(1, 22);
pcm.writeUInt32LE(tasa, 24);
pcm.writeUInt32LE(tasa * 2, 28);
pcm.writeUInt16LE(2, 32);
pcm.writeUInt16LE(16, 34);
pcm.write('data', 36);
pcm.writeUInt32LE(datos.length * 2, 40);
for (let i = 0; i < datos.length; i += 1) pcm.writeInt16LE(Math.round(Math.tanh(datos[i]) * 32767), 44 + i * 2);
writeFileSync(wav, pcm);
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-q:a', '4', mp3], { stdio: 'inherit' });
if (r.status !== 0) throw new Error('No se pudo codificar la banda sonora');
process.stdout.write(`${mp3}\n`);
