// Plano 5 · «Antes de que se acaben» (guion.md, plano 5). La tarjeta de Ristretto avisa de que quedan pocas;
// Capsulito lo anuncia con un megáfono diminuto. Llegan dos cajas, la compra se registra (la hucha paga, sin
// cifras) y el hueco de Ristretto se llena.
import { BOCAS, lerp, mezclarBocas, tramo } from './capsulito.js';
import {
  HUCHA,
  HUECOS,
  armarioAlEmpezar,
  PAPEL_EN_SUELO,
  SOLA_ESCONDIDA,
  SUELO_ESCENA,
  papelSvg,
  pintarDecorado,
} from './decorado.js';
import { MOVIL, cajaSvg, megafonoSvg, monedaSvg, movilSvg } from './objetos.js';
import { ESCALA, aTorso, arco, camaraPorClaves, enMano, grupo, mezclar, montarPlano, parpadeo, pulso, vozEn } from './plano.js';

export const DURACION = 10.2;
const RELOJ = 40.8;
const TRAMOS = [
  { desde: 0.3, hasta: 1.13, en: 1.0 },
  { desde: 1.13, hasta: 2.24, en: 2.6 },
  { desde: 2.24, hasta: 3.42, en: 4.6 },
  { desde: 3.42, hasta: 4.9, en: 6.6 },
];
const SUBTITULOS = [
  [0.9, 2.5, 'Si quedan pocas,'],
  [2.5, 4.4, 'beCafé avisa.'],
  [4.5, 6.5, 'Cuando compramos,'],
  [6.5, 8.8, 'apuntamos las cajas.'],
];

const plano = await montarPlano({ numero: '05', titulo: 'Antes de que se acaben', duracion: DURACION, tramos: TRAMOS });
const { camara, decorado, capsulito, delante } = plano;
const papel = grupo(decorado.g);
papel.innerHTML = papelSvg();
papel.setAttribute('transform', PAPEL_EN_SUELO);
const movil = grupo(decorado.g);
const megafono = grupo(delante);
const cajas = grupo(delante);
const moneda = grupo(delante);

const X = 380;
const MOVIL_X = 790;
const MOVIL_APARTADO = 950;
const MOVIL_ESCALA = 1.1;
const INTENSO = HUECOS[0];
const RISTRETTO = HUECOS[1];
/** Centro de la tarjeta del móvil, donde Capsulito toca para registrar la compra. */
const TARJETA = [MOVIL_X + (MOVIL.botonMas[0] - 40) * MOVIL_ESCALA, SUELO_ESCENA + (MOVIL.botonMas[1] - 30) * MOVIL_ESCALA];
const TOQUE = 6.75;
const APARTA = 7.5;
/** Cajas de la compra: dónde caen, cuándo y dónde se guardan después. */
const CAJAS = [
  { x: 165, y: 1600, cae: 4.75 },
  { x: 175, y: 1480, cae: 5.15 },
];
const GUARDA = [860, 1440];

const CAMARA = [
  [0, { z: 1.15, fx: 590, fy: 1140, sy: 1010 }],
  [0.2, { z: 1.15, fx: 590, fy: 1140, sy: 1010 }],
  [0.9, { z: 1.45, fx: 700, fy: 1230, sy: 1000 }],
  [1.9, { z: 1.45, fx: 700, fy: 1230, sy: 1000 }],
  [2.5, { z: 1.25, fx: 480, fy: 1180, sy: 1010 }],
  [4.3, { z: 1.25, fx: 480, fy: 1180, sy: 1010 }],
  [4.7, { z: 1.12, fx: 560, fy: 1160, sy: 1010 }],
  [9.0, { z: 1.12, fx: 560, fy: 1160, sy: 1010 }],
  [10.2, { z: 1.2, fx: 600, fy: 1160, sy: 1010 }],
];

function estadoCapsulito(t) {
  const alza = tramo(t, 2.0, 2.45) * (1 - tramo(t, 3.9, 4.3));
  const toque = tramo(t, TOQUE - 0.35, TOQUE) * (1 - tramo(t, TOQUE + 0.25, TOQUE + 0.6));
  const incl = -5 * alza - 4 * toque + 3 * pulso(t, 4.85, 0.2) + 3 * pulso(t, 5.25, 0.2);
  const bob = 10 * Math.max(0, Math.sin((t - 2.6) * 10)) * alza * (t < 3.7 ? 1 : 0) + 14 * pulso(t, 9.0, 0.3);

  // Izquierda: el megáfono, en alto mientras anuncia.
  const enJarra = [352, 813];
  let izq = mezclar(enJarra, [300, 470], alza);
  izq = mezclar(izq, [300, 760], tramo(t, 8.7, 9.0) * (1 - tramo(t, 9.6, 10.0)));
  // Derecha: estira el brazo de goma y toca la tarjeta para registrar la compra.
  const tarjeta = aTorso(TARJETA, X, incl, bob);
  const estira = 1 + 2.4 * tramo(t, TOQUE - 0.5, TOQUE) * (1 - tramo(t, TOQUE + 0.3, TOQUE + 0.8));
  let der = mezclar([975, 795], mezclar([1080, 640], tarjeta, 0.85), tramo(t, TOQUE - 0.5, TOQUE));
  der = mezclar(der, [975, 795], tramo(t, TOQUE + 0.3, TOQUE + 0.8));
  der = mezclar(der, [1050, 470], tramo(t, 8.7, 9.0) * (1 - tramo(t, 9.7, 10.1)));
  const manoDer = t > TOQUE - 0.6 && t < TOQUE + 0.7 ? 'senalar' : t > 8.75 && t < 9.9 ? 'abierta' : 'puno';

  const cierre = parpadeo(t, [0.15, 2.0, 5.6, 8.4]);
  const preocupa = tramo(t, 0.5, 0.8) * (1 - tramo(t, 1.9, 2.2));
  const p = Math.max(0.1 + 0.08 * preocupa, cierre);
  let mirada = [0.05, 0.05];
  mirada = mezclar(mirada, [0.85, 0.35], tramo(t, 0.3, 0.6) * (1 - tramo(t, 2.0, 2.3)));
  mirada = mezclar(mirada, [-0.3, -0.85], tramo(t, 2.1, 2.4) * (1 - tramo(t, 3.8, 4.1)));
  mirada = mezclar(mirada, [-0.85, -0.8], tramo(t, 4.6, 4.8) * (1 - tramo(t, 5.4, 5.6)));
  mirada = mezclar(mirada, [-0.85, 0.7], tramo(t, 5.4, 5.6) * (1 - tramo(t, 6.2, 6.4)));
  mirada = mezclar(mirada, [0.9, 0.3], tramo(t, 6.2, 6.4) * (1 - tramo(t, 7.6, 7.8)));
  mirada = mezclar(mirada, [0.8, 0.6], tramo(t, 7.6, 7.8) * (1 - tramo(t, 8.6, 8.8)));
  mirada = mezclar(mirada, [0.05, 0.05], tramo(t, 8.6, 8.8));
  const asombro = 0.8 * pulso(t, 4.85, 0.25) + 0.6 * pulso(t, 5.25, 0.2);
  const cejas = { subida: -10 * preocupa + 20 * alza + 18 * asombro, giro: -12 * preocupa };

  let boca = mezclarBocas(BOCAS.feliz, { w: 90, h: 10, s: -10 }, preocupa);
  boca = mezclarBocas(boca, BOCAS.asombro, Math.min(asombro, 1));
  boca = mezclarBocas(boca, BOCAS.feliz, tramo(t, 8.6, 8.9));
  if (vozEn(t, TRAMOS) !== null) boca = plano.boca(t, preocupa > 0.5 ? { w: 90, h: 10, s: -10 } : BOCAS.sonrisa);

  return {
    estado: {
      x: X,
      y: SUELO_ESCENA,
      escala: ESCALA,
      incl,
      bob,
      brazos: {
        der: { ik: der, signo: 1, mano: manoDer, estira, giroMano: manoDer === 'abierta' ? -20 : 0 },
        izq: { ik: izq, signo: 1, mano: 'puno', estira: 1 + 0.35 * alza },
      },
      parpados: [p, p],
      mirada,
      cejas,
      asombro: Math.min(asombro, 1),
      boca,
    },
    incl,
  };
}

function pintarMovil(t) {
  const q = tramo(t, APARTA, APARTA + 0.5);
  const mx = lerp(MOVIL_X, MOVIL_APARTADO, q);
  const dy = -70 * Math.sin(Math.PI * q) - 14 * pulso(t, 0.55, 0.12);
  const giro = 4 * Math.sin((t - 0.5) * 30) * pulso(t, 0.7, 0.3);
  movil.setAttribute('transform', `translate(${mx} ${SUELO_ESCENA + dy}) rotate(${giro}) scale(${MOVIL_ESCALA})`);
  const registrada = t >= TOQUE + 0.1;
  const tarjeta = t < 0.3 ? { ...INTENSO, quedan: 3 } : { ...RISTRETTO, quedan: registrada ? 21 : 1 };
  movil.innerHTML = movilSvg({
    tarjeta,
    aviso: t >= 0.5 && !registrada ? 'Ristretto' : null,
    nota: t < 0.3 ? 'Registrado' : registrada ? 'Compra registrada' : null,
    detalle: registrada ? '2 cajas · Ristretto' : null,
    cifra: 1 + 0.5 * pulso(t, TOQUE + 0.2, 0.25),
  });
}

function pintarCajas(t) {
  cajas.innerHTML = CAJAS.map((c, i) => {
    if (t < c.cae - 0.4) return '';
    const caida = Math.min(1, (t - (c.cae - 0.4)) / 0.4);
    let y = lerp(c.y - 900, c.y, caida * caida);
    const aplasta = 0.12 * pulso(t, c.cae + 0.06, 0.12);
    // Después de registrar la compra, las cajas se guardan solas en el armario.
    const guarda = tramo(t, 8.0 + i * 0.2, 8.6 + i * 0.2);
    if (guarda >= 1) return '';
    const [gx, gy] = arco([c.x, y], GUARDA, 160, guarda);
    y = gy;
    const escala = lerp(1, 0.4, guarda);
    return `<g transform="translate(${gx} ${y}) scale(${(1 + aplasta) * escala} ${(1 - aplasta) * escala})">${cajaSvg(RISTRETTO.color, RISTRETTO.claro)}</g>`;
  }).join('');
}

/** La hucha paga la compra: sale una moneda hacia las cajas. Sin cifras (guion: reglas de representación). */
function pintarMoneda(t) {
  const q = tramo(t, TOQUE + 0.15, TOQUE + 0.85);
  if (q <= 0 || q >= 1) {
    moneda.innerHTML = '';
    return;
  }
  const [x, y] = arco(HUCHA.ranura, [200, 1420], 260, q);
  moneda.innerHTML = `<g transform="translate(${x} ${y}) rotate(${q * 540}) scale(${1 - 0.3 * q})">${monedaSvg()}</g>`;
}

function estadoDecorado(t) {
  const capsulas = {};
  // Reposición del hueco de Ristretto: las cápsulas nuevas caen en su sitio una tras otra.
  ['a0', 'a1', 'd1'].forEach((clave, i) => {
    const q = tramo(t, 8.0 + i * 0.18, 8.35 + i * 0.18);
    capsulas[`Ristretto-${clave}`] = { dy: -70 * (1 - q), opacidad: q };
  });
  const vuelve = tramo(t, 8.4, 8.8);
  return {
    puerta: 100,
    led: 1,
    reloj: (RELOJ + t) / 60,
    sola: Object.fromEntries(Object.entries(SOLA_ESCONDIDA).map(([k, v]) => [k, lerp(v, k === 'escala' ? 1 : 0, vuelve)])),
    papelEnArmario: false,
    capsulas: { ...armarioAlEmpezar(5).capsulas, ...capsulas },
    taza: { nivel: 1 },
    hucha: { encogida: tramo(t, TOQUE + 0.1, TOQUE + 0.4), salto: t > TOQUE + 0.1 && t < TOQUE + 0.7 ? (t - TOQUE - 0.1) / 0.6 : 0 },
  };
}

function render(t) {
  camara.setAttribute('transform', camaraPorClaves(t, CAMARA));
  const e = estadoCapsulito(t);
  const manos = capsulito.pintar(e.estado);
  const sale = tramo(t, 1.95, 2.2) * (1 - tramo(t, 4.1, 4.3));
  const ondas = t > 2.6 && t < 3.8 ? (t - 2.6) / 1.2 : 0;
  // El megáfono apunta hacia arriba y a la izquierda, lejos de la cara: se refleja en horizontal.
  enMano(megafono, `<g transform="rotate(35) scale(-1 1)">${megafonoSvg(ondas)}</g>`, manos.manoIzq, X, e.incl, 0.95 * sale, sale > 0);
  pintarMovil(t);
  pintarCajas(t);
  pintarMoneda(t);
  pintarDecorado(decorado, estadoDecorado(t));
  plano.ponerSubtitulo(t, SUBTITULOS);
}

plano.publicar(render);
