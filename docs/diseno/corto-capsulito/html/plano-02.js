// Plano 2 · «¿Dónde están las cápsulas?» (guion.md, plano 2). Empieza donde acaba el plano 1. Capsulito pide un
// momento, saca el papel de apuntes («Ristretto: quedan 6»), intenta coger la última cápsula, que se le escapa
// al fondo del hueco, y mira a cámara: «hay aire».
import { BOCAS, andar, lerp, mezclarBocas, tramo } from './capsulito.js';
import { SUELO_ESCENA, papelSvg, pintarDecorado } from './decorado.js';
import { ESCALA, aEscena, aTorso, camaraPorClaves, mezclar, montarPlano, parpadeo, pulso, vozEn } from './plano.js';

// Módulo del navegador: ESLint aplica a los .js los globales de Node, así que los del navegador salen de globalThis.
const { document } = globalThis;

export const DURACION = 10.2;
/** Tramos de `corto_02`: cada frase en su instante, con pausas para la acción. */
const TRAMOS = [
  { desde: 0.3, hasta: 1.0, en: 0.93 },
  { desde: 1.0, hasta: 3.2, en: 3.43 },
  { desde: 3.2, hasta: 4.6, en: 5.75 },
  { desde: 4.9, hasta: 6.049, en: 8.06 },
];
const SUBTITULOS = [
  [1.0, 2.7, 'Un momento.'],
  [3.4, 5.7, 'Según el papel, aquí hay cápsulas.'],
  [5.8, 8.0, 'Según mis ojos…'],
  [8.1, 10.2, '… hay aire.'],
];

const plano = await montarPlano({ numero: '02', titulo: '¿Dónde están las cápsulas?', duracion: DURACION, tramos: TRAMOS });
const { camara, decorado, capsulito, delante } = plano;
const papelEnMano = document.createElementNS('http://www.w3.org/2000/svg', 'g');
papelEnMano.innerHTML = papelSvg();
delante.appendChild(papelEnMano);

/** Posición inicial = posición final del plano 1. */
const X_INICIO = 343;
const X_ARMARIO = 440;
const PAPEL_ARMARIO = [666, 1392];
/**
 * Objetivo más allá del alcance: el brazo se estira del todo y el dedo apunta adonde estaba la cápsula sola,
 * que se escapa al fondo del hueco.
 */
const CAPSULA_SOLA = [790, 1222];

const CAMARA = [
  [0, { z: 1.14, fx: 588, fy: 1530, sy: 1530 }],
  [0.9, { z: 1.4, fx: 495, fy: 1300, sy: 1180 }],
  [2.4, { z: 1.4, fx: 495, fy: 1300, sy: 1180 }],
  [3.3, { z: 1.45, fx: 545, fy: 1260, sy: 1150 }],
  [5.6, { z: 1.45, fx: 545, fy: 1260, sy: 1150 }],
  [6.4, { z: 1.8, fx: 680, fy: 1250, sy: 1120 }],
  [7.4, { z: 1.8, fx: 680, fy: 1250, sy: 1120 }],
  [8.0, { z: 2.0, fx: 420, fy: 1190, sy: 980 }],
];

/** Desde el torso de Capsulito a la escena (inversa de `aTorso`). */
function torsoAEscena(p, x, incl, bob) {
  const a = (incl * Math.PI) / 180;
  const dx = p[0] - 650;
  const dy = p[1] - 900;
  const c = [650 + dx * Math.cos(a) - dy * Math.sin(a), 900 + dx * Math.sin(a) + dy * Math.cos(a) - bob];
  return aEscena(c, x);
}

function cuerpo(t) {
  const avance = tramo(t, 2.4, 3.1);
  const x = lerp(X_INICIO, X_ARMARIO, avance);
  const paso = andar(((X_ARMARIO - X_INICIO) * avance) / ESCALA, { paso: 110, altura: 18, peso: Math.sin(Math.PI * avance) });
  const agacharse = tramo(t, 2.7, 3.05) * (1 - tramo(t, 3.2, 3.55));
  let incl = 8 * (1 - tramo(t, 0.4, 0.9));
  incl += 10 * agacharse;
  incl -= 4 * tramo(t, 3.4, 3.7) * (1 - tramo(t, 5.5, 5.9));
  incl += 12 * tramo(t, 5.9, 6.5) * (1 - tramo(t, 7.4, 7.9));
  const bob = paso.bob - 70 * agacharse + 8 * pulso(t, 4.9, 0.2);
  return { x, paso, incl, bob };
}

/** Objetivos de las manos en coordenadas del torso. */
function brazos(t, c) {
  const reposoDer = [975, 795];
  const sostener = [1035, 560];
  const papel = aTorso(PAPEL_ARMARIO, c.x, c.incl, c.bob);
  const capsula = aTorso(CAPSULA_SOLA, c.x, c.incl, c.bob);
  let der = reposoDer;
  der = mezclar(der, papel, tramo(t, 2.7, 3.1) * (1 - tramo(t, 3.2, 3.6)));
  der = mezclar(der, sostener, tramo(t, 3.2, 3.6) * (1 - tramo(t, 5.5, 5.95)));
  der = mezclar(der, capsula, tramo(t, 6.2, 7.0) * (1 - tramo(t, 7.4, 7.9)));
  const senala = t > 6.0 && t < 7.7;

  const enJarra = [352, 813];
  const dedoArriba = [300, 515];
  const palma = [215, 650];
  let izq = enJarra;
  izq = mezclar(izq, dedoArriba, tramo(t, 0.9, 1.25) * (1 - tramo(t, 2.2, 2.6)));
  izq = mezclar(izq, palma, tramo(t, 4.5, 4.8) * (1 - tramo(t, 5.3, 5.7)));
  let manoIzq = 'puno';
  if (t > 0.95 && t < 2.45) manoIzq = 'senalar';
  if (t > 4.55 && t < 5.5) manoIzq = 'abierta';
  return {
    der: { ik: der, signo: 1, mano: senala ? 'senalar' : 'puno' },
    izq: { ik: izq, signo: 1, mano: manoIzq, giroMano: manoIzq === 'abierta' ? -70 : 0 },
    sostener,
  };
}

function estadoCapsulito(t) {
  const c = cuerpo(t);
  const deadpan = tramo(t, 7.6, 8.0);
  const cierre = parpadeo(t, [0.35, 0.6, 7.45, 9.45]);
  const p = Math.max(lerp(0.08, 0.38, deadpan), cierre);

  let mirada = [0.95, 0.25];
  mirada = mezclar(mirada, [0.35, -0.65], tramo(t, 0.9, 1.2) * (1 - tramo(t, 2.3, 2.6)));
  mirada = mezclar(mirada, [0.75, 0.85], tramo(t, 2.4, 2.7) * (1 - tramo(t, 3.3, 3.5)));
  mirada = mezclar(mirada, [0.95, -0.35], tramo(t, 3.3, 3.6) * (1 - tramo(t, 4.4, 4.6)));
  mirada = mezclar(mirada, [-0.1, 0.1], tramo(t, 4.4, 4.6) * (1 - tramo(t, 5.4, 5.7)));
  mirada = mezclar(mirada, [0.95, 0.3], tramo(t, 5.7, 6.0) * (1 - tramo(t, 7.6, 7.9)));
  mirada = mezclar(mirada, [0.05, 0.05], deadpan);

  const asombro = Math.max(1 - tramo(t, 0.2, 0.9), 0.6 * tramo(t, 6.95, 7.1) * (1 - tramo(t, 7.4, 7.7)));
  const ceno = tramo(t, 0.9, 1.2) * (1 - tramo(t, 2.4, 2.8));
  const cejas = {
    subida: 26 * (1 - tramo(t, 0.2, 0.9)) - 6 * ceno + 20 * asombro * tramo(t, 6.9, 7.0) - 8 * deadpan,
    giro: 12 * ceno,
  };

  let boca = mezclarBocas(BOCAS.asombro, BOCAS[7], tramo(t, 0.3, 0.8));
  boca = mezclarBocas(boca, BOCAS.asombro, tramo(t, 6.95, 7.1) * (1 - tramo(t, 7.4, 7.7)));
  boca = mezclarBocas(boca, { w: 90, h: 0, s: -3 }, deadpan);
  if (vozEn(t, TRAMOS) !== null) boca = plano.boca(t, deadpan > 0.5 ? { w: 90, h: 0, s: -3 } : BOCAS[0]);

  const b = brazos(t, c);
  return {
    estado: {
      x: c.x,
      y: SUELO_ESCENA,
      escala: ESCALA,
      incl: c.incl,
      bob: c.bob,
      pies: c.paso.pies,
      brazos: { der: b.der, izq: b.izq },
      parpados: [p, p],
      mirada,
      cejas,
      asombro: Math.min(asombro, 1),
      boca,
    },
    cuerpo: c,
    sostener: b.sostener,
  };
}

/** El papel: en el armario, en la mano o cayendo al suelo. */
function pintarPapel(t, mano, x) {
  if (t < 3.15) {
    papelEnMano.setAttribute('display', 'none');
    return true;
  }
  papelEnMano.setAttribute('display', 'inline');
  if (t < 5.6) {
    const [hx, hy] = aEscena(mano, x);
    const k = tramo(t, 3.2, 3.6);
    const meneo = Math.sin((t - 4.6) * 22) * 7 * (t > 4.6 && t < 5.3 ? 1 : 0);
    const escala = lerp(1, 1.45, k);
    const giro = lerp(-4, 8, k) + meneo;
    papelEnMano.setAttribute(
      'transform',
      `translate(${hx} ${hy}) rotate(${giro}) scale(${escala}) translate(-14 -88)`,
    );
    return false;
  }
  // Caída: parte de la posición de sostener y acaba tumbado en el suelo.
  const inicio = estadoCapsulito(5.6);
  const [sx, sy] = torsoAEscena(inicio.sostener, inicio.cuerpo.x, inicio.cuerpo.incl, inicio.cuerpo.bob);
  const q = tramo(t, 5.6, 6.4);
  const px = sx + 70 * q + Math.sin(q * 9) * 30 * (1 - q);
  const py = lerp(sy, SUELO_ESCENA + 30, q * q);
  const giro = lerp(8, 70, q) + Math.sin(q * 12) * 20 * (1 - q);
  const escalaY = lerp(1.45, 0.42, tramo(t, 6.2, 6.45));
  papelEnMano.setAttribute(
    'transform',
    `translate(${px} ${py}) scale(${lerp(1.45, 1.1, q)} ${escalaY}) rotate(${giro}) translate(-66 -52)`,
  );
  return false;
}

function estadoDecorado(t, papelEnArmario) {
  const huida = tramo(t, 6.85, 7.15);
  return {
    puerta: 100,
    led: 1,
    reloj: (9.6 + t) / 60,
    balanceo: Math.sin((t - 6.85) * 20) * 9 * (t > 6.85 ? Math.exp(-(t - 6.85) * 4) : 0),
    sola: { dx: 74 * huida, dy: -22 * huida, escala: lerp(1, 0.8, huida), oscuro: huida },
    papelEnArmario,
  };
}

function render(t) {
  camara.setAttribute('transform', camaraPorClaves(t, CAMARA));
  const e = estadoCapsulito(t);
  const manos = capsulito.pintar(e.estado);
  const enArmario = pintarPapel(t, manos.manoDer, e.cuerpo.x);
  pintarDecorado(decorado, estadoDecorado(t, enArmario));
  plano.ponerSubtitulo(t, SUBTITULOS);
}

plano.publicar(render);
