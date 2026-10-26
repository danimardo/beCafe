// Plano 3 · «Los cafés invisibles» (guion.md, plano 3). Capsulito investiga con una lupa enorme: aparecen tazas
// fantasma que alguien se bebe, las cápsulas Suave se van solas a la cafetera y nadie lo apunta.
import { BOCAS, lerp, mezclarBocas, tramo } from './capsulito.js';
import { CARGA, PAPEL_EN_SUELO, SOLA_ESCONDIDA, SUELO_ESCENA, papelSvg, pintarDecorado, posicionCapsula } from './decorado.js';
import { lupaSvg, tazaSvg } from './objetos.js';
import { ESCALA, GENERAL, arco, camaraPorClaves, enMano, grupo, mezclar, montarPlano, parpadeo, pulso, vozEn } from './plano.js';

export const DURACION = 10.6;
/** Reloj: segundos de corto transcurridos antes de este plano. */
const RELOJ = 19.8;
/** Tramos de `corto_03`: el título y las tres frases, con huecos para el gag de la lupa y las tazas. */
const TRAMOS = [
  { desde: 0.45, hasta: 2.4, en: 0.9 },
  { desde: 3.6, hasta: 4.15, en: 5.0 },
  { desde: 4.15, hasta: 5.3, en: 5.9 },
  { desde: 5.3, hasta: 6.7, en: 7.4 },
];
const SUBTITULOS = [
  [0.9, 3.0, 'El misterio de los cafés invisibles.'],
  [4.9, 7.2, 'Se hacen, se disfrutan…'],
  [7.3, 9.6, '… y se olvidan de apuntar.'],
];

const plano = await montarPlano({ numero: '03', titulo: 'Los cafés invisibles', duracion: DURACION, tramos: TRAMOS });
const { camara, decorado, capsulito, delante } = plano;
const papel = grupo(decorado.g);
papel.innerHTML = papelSvg();
papel.setAttribute('transform', PAPEL_EN_SUELO);
const tazas = grupo(delante);
const lupa = grupo(delante);

const X = 440;
const CAMARA = [
  [0, { ...GENERAL }],
  [2.9, { ...GENERAL }],
  [3.45, { z: 2.6, fx: 492, fy: 1194, sy: 900 }],
  [4.6, { z: 2.6, fx: 492, fy: 1194, sy: 900 }],
  [5.1, { ...GENERAL }],
  [8.8, { ...GENERAL }],
  [9.6, { z: 1.3, fx: 540, fy: 1190, sy: 1080 }],
];

/** Tazas fantasma: posición, instante en que aparecen y escala. */
const TAZAS = [
  { x: 1012, y: 1062, aparece: 5.0, escala: 1.25 },
  { x: 800, y: 1024, aparece: 5.2, escala: 1.1 },
  { x: 900, y: 1528, aparece: 5.4, escala: 1.7 },
];
/** Cápsulas Suave que se van solas a la cafetera, con su instante de salida. */
const SUAVES = [
  ['d', 0, 7.5],
  ['d', 1, 7.75],
  ['a', 0, 8.0],
  ['a', 1, 8.25],
];

/** Mano derecha con la lupa: pose de detective, en el ojo, bajada y en el encogimiento de hombros. */
function manoLupa(t) {
  const reposo = [975, 795];
  const detective = [990, 720];
  const enOjo = [944, 779];
  const bajada = [985, 760];
  const hombros = [1075, 655];
  let p = mezclar(reposo, detective, tramo(t, 0.35, 0.85));
  p = mezclar(p, enOjo, tramo(t, 2.9, 3.4));
  p = mezclar(p, bajada, tramo(t, 4.6, 5.1));
  p = mezclar(p, hombros, tramo(t, 8.9, 9.3));
  let giro = lerp(0, 8, tramo(t, 0.35, 0.85));
  giro = lerp(giro, -39, tramo(t, 2.9, 3.4));
  giro = lerp(giro, -24, tramo(t, 4.6, 5.1));
  giro = lerp(giro, 32, tramo(t, 8.9, 9.3));
  // Sigue con la lupa las tazas y las cápsulas.
  giro += -6 * Math.sin((t - 5.1) * 2.2) * tramo(t, 5.1, 5.4) * (1 - tramo(t, 8.6, 8.9));
  return { p, giro };
}

function estadoCapsulito(t) {
  const encoge = tramo(t, 8.9, 9.3);
  const enOjo = tramo(t, 3.0, 3.4) * (1 - tramo(t, 4.6, 5.0));
  const incl = -4 * tramo(t, 0.35, 0.85) * (1 - tramo(t, 2.9, 3.3)) + 6 * enOjo - 3 * encoge;
  const bob = 10 * pulso(t, 0.6, 0.25) + 14 * encoge * Math.max(0, Math.sin((t - 9.0) * 9)) * (t < 9.7 ? 1 : 0);

  const lupaMano = manoLupa(t);
  const enJarra = [352, 813];
  const barbilla = [470, 700];
  const palma = [245, 575];
  let izq = mezclar(enJarra, barbilla, tramo(t, 0.9, 1.3) * (1 - tramo(t, 2.6, 2.95)));
  izq = mezclar(izq, palma, encoge);
  const manoIzq = encoge > 0.3 ? 'abierta' : 'puno';

  const cierre = parpadeo(t, [0.3, 2.75, 6.4, 9.9]);
  const sorna = tramo(t, 0.9, 1.3) * (1 - tramo(t, 2.7, 3.0));
  const p = Math.max(lerp(0.38, 0.12, tramo(t, 0.2, 0.6)) + 0.18 * sorna + 0.2 * encoge, cierre);

  // Mirada: a cámara, por la lupa, a las tazas, a las cápsulas que se van y a cámara otra vez.
  let mirada = [0.05, 0.05];
  mirada = mezclar(mirada, [0.2, -0.1], tramo(t, 0.6, 0.9));
  mirada = mezclar(mirada, [-0.85, 0.1], tramo(t, 3.5, 3.8) * (1 - tramo(t, 3.95, 4.25)));
  mirada = mezclar(mirada, [0.9, 0], tramo(t, 3.95, 4.25) * (1 - tramo(t, 4.5, 4.7)));
  mirada = mezclar(mirada, [0.95, -0.2], tramo(t, 4.9, 5.1));
  mirada = mezclar(mirada, [0.7, 0.3], tramo(t, 5.2, 5.4) * (1 - tramo(t, 5.9, 6.1)));
  mirada = mezclar(mirada, [0.9, 0.9], tramo(t, 5.4, 5.6) * (1 - tramo(t, 5.9, 6.1)));
  mirada = mezclar(mirada, [0.95, 0.75], tramo(t, 7.5, 7.7));
  mirada = mezclar(mirada, [0.75, -0.75], tramo(t, 7.9, 8.4));
  mirada = mezclar(mirada, [0.05, 0.05], tramo(t, 8.8, 9.1));

  const asombro = 0.7 * tramo(t, 7.6, 7.8) * (1 - tramo(t, 8.6, 8.9));
  const cejas = {
    subida: -8 * (1 - tramo(t, 0.2, 0.6)) + 6 * sorna + 18 * asombro + 22 * encoge,
    giro: 14 * sorna,
  };

  let boca = mezclarBocas({ w: 90, h: 0, s: -3 }, BOCAS.sonrisa, tramo(t, 0.3, 0.7));
  boca = mezclarBocas(boca, BOCAS.asombro, asombro);
  boca = mezclarBocas(boca, { w: 96, h: 0, s: -8 }, encoge);
  if (vozEn(t, TRAMOS) !== null) boca = plano.boca(t, encoge > 0.5 ? { w: 96, h: 0, s: -8 } : BOCAS[0]);

  return {
    estado: {
      x: X,
      y: SUELO_ESCENA,
      escala: ESCALA,
      incl,
      bob,
      brazos: {
        der: { ik: lupaMano.p, signo: 1, mano: 'puno' },
        izq: { ik: izq, signo: 1, mano: manoIzq, giroMano: manoIzq === 'abierta' ? -70 : 0 },
      },
      parpados: [p, p],
      mirada,
      cejas,
      asombro,
      boca,
    },
    lupaGiro: lupaMano.giro + incl,
    mirada,
    parpado: p,
  };
}

function pintarTazas(t) {
  tazas.innerHTML = TAZAS.map((tz, i) => {
    if (t < tz.aparece) return '';
    const pop = tramo(t, tz.aparece, tz.aparece + 0.18);
    const rebote = 1 + 0.18 * pulso(t, tz.aparece + 0.2, 0.15);
    // Alguien invisible se las bebe: se inclinan y se vacían, cada una con un pequeño retraso.
    const sorbo = tramo(t, 5.95 + i * 0.25, 6.6 + i * 0.25);
    const giro = -24 * Math.sin(Math.PI * sorbo);
    const nivel = 1 - sorbo;
    const adios = tramo(t, 7.4 + i * 0.12, 7.75 + i * 0.12);
    const escala = tz.escala * pop * rebote * (1 + 0.4 * adios);
    if (adios >= 1) return '';
    return `<g transform="translate(${tz.x} ${tz.y}) rotate(${giro}) scale(${escala})" opacity="${1 - adios}">
      ${tazaSvg({ nivel, fantasma: true })}
      <path d="M-10 -66 q-10 -16 0 -30 q10 -14 0 -28" fill="none" stroke="#cdb293" stroke-width="5" stroke-linecap="round" opacity="${(nivel * 0.8).toFixed(2)}" stroke-dasharray="6 6"/>
    </g>`;
  }).join('');
}

function estadoDecorado(t) {
  const capsulas = {};
  for (const [fila, k, salida] of SUAVES) {
    const q = tramo(t, salida, salida + 0.55);
    if (q <= 0) continue;
    const origen = posicionCapsula('Suave', fila, k);
    const [px, py] = arco([0, 0], [CARGA[0] - origen.x, CARGA[1] - origen.y], 140, q);
    capsulas[`Suave-${fila}${k}`] = {
      dx: px,
      dy: py,
      rot: 360 * q,
      escala: lerp(1, 0.6, q),
      opacidad: q > 0.85 ? (1 - q) / 0.15 : 1,
    };
  }
  const llegada = SUAVES.map(([, , s]) => s + 0.55);
  return {
    puerta: 100,
    led: 1,
    reloj: (RELOJ + t) / 60,
    sola: SOLA_ESCONDIDA,
    papelEnArmario: false,
    capsulas,
    rebote: llegada.reduce((r, s) => (t > s && t < s + 0.5 ? (t - s) / 0.5 : r), 0),
    vapor: t > 8.9 && t < 10.5 ? (t - 8.9) / 1.6 : 0,
  };
}

function render(t) {
  camara.setAttribute('transform', camaraPorClaves(t, CAMARA));
  const e = estadoCapsulito(t);
  const manos = capsulito.pintar(e.estado);
  // El ojo gigante sigue a los ojos de Capsulito mientras la lupa está delante.
  const ojo = t > 3.25 && t < 4.75 ? { mirada: e.mirada, parpado: e.parpado } : null;
  const aparece = tramo(t, 0.35, 0.6);
  enMano(lupa, lupaSvg(ojo), manos.manoDer, X, e.lupaGiro, 1.15 * (0.4 + 0.6 * aparece) + 0.12 * pulso(t, 0.62, 0.15), t > 0.35);
  pintarTazas(t);
  pintarDecorado(decorado, estadoDecorado(t));
  plano.ponerSubtitulo(t, SUBTITULOS);
}

plano.publicar(render);
