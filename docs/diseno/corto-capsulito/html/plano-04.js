// Plano 4 · «Un toque por café» (guion.md, plano 4). Capsulito tira la lupa y saca beCafé: un toque en la
// tarjeta de Intenso, «Registrado» y el contador pasa de 4 a 3 solo después del toque. La cápsula va a la cafetera,
// la taza se llena y el hueco de Intenso enseña las mismas 3 cápsulas que la aplicación.
import { BOCAS, andar, lerp, mezclarBocas, tramo } from './capsulito.js';
import {
  CARGA,
  HUECOS,
  armarioAlEmpezar,
  PAPEL_EN_SUELO,
  SOLA_ESCONDIDA,
  SUELO_ESCENA,
  papelSvg,
  pintarDecorado,
  posicionCapsula,
} from './decorado.js';
import { MOVIL, lupaSvg, movilSvg } from './objetos.js';
import { ESCALA, aEscena, aTorso, arco, camaraPorClaves, grupo, mezclar, montarPlano, parpadeo, pulso, vozEn } from './plano.js';

export const DURACION = 10.4;
const RELOJ = 30.4;
const TRAMOS = [
  { desde: 0.4, hasta: 1.25, en: 1.0 },
  { desde: 1.4, hasta: 3.3, en: 2.5 },
  { desde: 3.6, hasta: 6.3, en: 7.3 },
];
const SUBTITULOS = [
  [1.0, 2.4, 'Nueva pista:'],
  [2.5, 4.6, 'un toque por cada café.'],
  [7.2, 10.4, 'Y ahora sí sabemos lo que queda.'],
];

const plano = await montarPlano({ numero: '04', titulo: 'Un toque por café', duracion: DURACION, tramos: TRAMOS });
const { camara, decorado, capsulito, delante } = plano;
const papel = grupo(decorado.g);
papel.innerHTML = papelSvg();
papel.setAttribute('transform', PAPEL_EN_SUELO);
const movil = grupo(decorado.g);
const lupa = grupo(delante);
const insignia = grupo(delante);

const X0 = 440;
const X1 = 380;
/**
 * Móvil de pie a la derecha de Capsulito, delante del armario, sin taparlo con el cuerpo. Capsulito da un paso
 * atrás para dejar ver el hueco de Intenso y estira el brazo de goma para tocar «+1».
 */
const MOVIL_X = 790;
const MOVIL_ESCALA = 1.1;
const BOTON = [MOVIL_X + MOVIL.botonMas[0] * MOVIL_ESCALA, SUELO_ESCENA + MOVIL.botonMas[1] * MOVIL_ESCALA];
const TOQUE = 4.2;
const INTENSO = HUECOS[0];
const CAMARA = [
  [0, { z: 1.15, fx: 600, fy: 1140, sy: 1010 }],
  [1.4, { z: 1.15, fx: 600, fy: 1140, sy: 1010 }],
  [2.3, { z: 1.15, fx: 590, fy: 1140, sy: 1010 }],
  [3.4, { z: 1.15, fx: 590, fy: 1140, sy: 1010 }],
  [4.0, { z: 1.6, fx: 700, fy: 1240, sy: 1000 }],
  [5.0, { z: 1.6, fx: 700, fy: 1240, sy: 1000 }],
  [5.8, { z: 1.15, fx: 590, fy: 1140, sy: 1010 }],
];

function estadoCapsulito(t) {
  const avance = tramo(t, 1.5, 2.1);
  const X = lerp(X0, X1, avance);
  const paso = andar(((X1 - X0) * avance) / ESCALA, { paso: 110, altura: 16, peso: Math.sin(Math.PI * avance) });
  const lanza = tramo(t, 0.05, 0.35);
  const toque = tramo(t, TOQUE - 0.35, TOQUE) * (1 - tramo(t, TOQUE + 0.3, TOQUE + 0.7));
  const ensena = tramo(t, 7.3, 7.7) * (1 - tramo(t, 9.7, 10.2));
  const incl = -6 * lanza * (1 - tramo(t, 0.4, 0.8)) - 6 * toque + 4 * ensena;
  const bob = paso.bob + 8 * pulso(t, 0.35, 0.2);

  // Derecha: tira la lupa por encima del hombro, apunta al móvil, toca «+1» y enseña el hueco con la palma.
  const boton = aTorso(BOTON, X, incl, bob);
  // Del toque: el brazo se estira como una goma hasta el botón y vuelve.
  const estira = 1 + 2.4 * tramo(t, 2.7, 3.3) * (1 - tramo(t, 4.6, 5.2));
  let der = mezclar([1075, 655], [880, 420], lanza);
  der = mezclar(der, [975, 795], tramo(t, 0.4, 0.9));
  der = mezclar(der, mezclar([1080, 640], boton, 0.85), tramo(t, 2.7, 3.3));
  der = mezclar(der, boton, toque);
  der = mezclar(der, [975, 795], tramo(t, 5.0, 5.5));
  der = mezclar(der, [1060, 820], ensena);
  let manoDer = 'puno';
  if (t > 2.6 && t < 5.1) manoDer = 'senalar';
  if (ensena > 0.3) manoDer = 'abierta';

  // Izquierda: índice arriba con «Nueva pista» y a la cintura.
  const palma = [245, 575];
  const dedoArriba = [300, 515];
  let izq = mezclar(palma, [352, 813], tramo(t, 0.2, 0.6));
  izq = mezclar(izq, dedoArriba, tramo(t, 0.8, 1.1) * (1 - tramo(t, 1.9, 2.3)));
  const manoIzq = t < 0.3 ? 'abierta' : t > 0.85 && t < 2.2 ? 'senalar' : 'puno';

  const cierre = parpadeo(t, [0.5, 2.1, 6.2, 9.9]);
  const p = Math.max(0.12 - 0.04 * pulso(t, TOQUE + 0.2, 0.4), cierre);
  let mirada = [0.05, 0.05];
  mirada = mezclar(mirada, [-0.6, -0.8], tramo(t, 0.1, 0.3) * (1 - tramo(t, 0.7, 0.9)));
  mirada = mezclar(mirada, [0.9, -0.2], tramo(t, 1.9, 2.2));
  mirada = mezclar(mirada, [0.9, 0.45], tramo(t, 3.4, 3.8) * (1 - tramo(t, 4.6, 4.8)));
  mirada = mezclar(mirada, [0.85, -0.6], tramo(t, 4.7, 5.0) * (1 - tramo(t, 6.4, 6.7)));
  mirada = mezclar(mirada, [0.8, 0.75], tramo(t, 7.3, 7.6) * (1 - tramo(t, 8.6, 8.9)));
  mirada = mezclar(mirada, [0.05, 0.05], tramo(t, 8.6, 8.9));
  const cejas = { subida: -6 * (1 - tramo(t, 0, 0.4)) + 16 * tramo(t, 0.8, 1.1) * (1 - tramo(t, 2.0, 2.4)) + 10 * pulso(t, TOQUE + 0.25, 0.5), giro: 0 };

  let boca = mezclarBocas({ w: 96, h: 0, s: -8 }, BOCAS[0], tramo(t, 0, 0.5));
  boca = mezclarBocas(boca, BOCAS.feliz, tramo(t, TOQUE + 0.1, TOQUE + 0.3) * (1 - tramo(t, 5.6, 6.0)));
  boca = mezclarBocas(boca, BOCAS.sonrisa, tramo(t, 6.0, 6.4));
  boca = mezclarBocas(boca, BOCAS.feliz, tramo(t, 9.7, 10.0));
  if (vozEn(t, TRAMOS) !== null) boca = plano.boca(t, BOCAS.sonrisa);

  return {
    x: X,
    y: SUELO_ESCENA,
    escala: ESCALA,
    incl,
    bob,
    pies: paso.pies,
    brazos: {
      der: { ik: der, signo: 1, mano: manoDer, giroMano: manoDer === 'abierta' ? 40 : 0, estira },
      izq: { ik: izq, signo: 1, mano: manoIzq, giroMano: manoIzq === 'abierta' ? -70 : 0 },
    },
    parpados: [p, p],
    mirada,
    cejas,
    asombro: 0,
    boca,
  };
}

/** La lupa sale de la mano y vuela por encima del hombro hasta salir de cuadro. */
function pintarLupa(t, mano) {
  if (t >= 1.2) {
    lupa.setAttribute('display', 'none');
    return;
  }
  lupa.setAttribute('display', 'inline');
  lupa.innerHTML = lupaSvg();
  if (t < 0.35) {
    const [x, y] = aEscena(mano, X0);
    lupa.setAttribute('transform', `translate(${x} ${y}) rotate(${lerp(32, -20, tramo(t, 0, 0.35))}) scale(${ESCALA * 1.15})`);
    return;
  }
  const q = (t - 0.35) / 0.85;
  const [x, y] = arco([835, 1135], [-140, 820], 260, q);
  lupa.setAttribute('transform', `translate(${x} ${y}) rotate(${-20 - 760 * q}) scale(${ESCALA * 1.15})`);
}

function pintarMovil(t) {
  // Cae desde arriba, rebota y se queda de pie.
  const caida = Math.min(Math.max((t - 1.7) / 0.45, 0), 1);
  let dy = -900 * (1 - caida * caida);
  if (t > 2.15) dy = -40 * Math.abs(Math.sin((t - 2.15) * 9)) * Math.exp(-(t - 2.15) * 6);
  if (t < 1.7) {
    movil.setAttribute('display', 'none');
    return;
  }
  movil.setAttribute('display', 'inline');
  movil.setAttribute('transform', `translate(${MOVIL_X} ${SUELO_ESCENA + dy}) scale(${MOVIL_ESCALA})`);
  const registrado = t >= TOQUE + 0.1;
  movil.innerHTML = movilSvg({
    tarjeta: { nombre: INTENSO.nombre, color: INTENSO.color, claro: INTENSO.claro, quedan: registrado ? 3 : 4 },
    pulsado: t > TOQUE && t < TOQUE + 0.5 ? (t - TOQUE) / 0.5 : 0,
    nota: registrado ? 'Registrado' : null,
    cifra: 1 + 0.6 * pulso(t, TOQUE + 0.18, 0.25),
  });
}

/** Insignia «3» sobre el hueco de Intenso: el armario y la aplicación dicen lo mismo. */
function pintarInsignia(t) {
  const k = tramo(t, 7.6, 7.85) * (1 - tramo(t, 10.0, 10.3));
  if (k <= 0) {
    insignia.innerHTML = '';
    return;
  }
  const s = k * (1 + 0.15 * pulso(t, 7.95, 0.15));
  insignia.innerHTML = `<g transform="translate(${INTENSO.x + 62} 1172) scale(${s})">
    <circle r="34" fill="#fffdf7" stroke="#b8483c" stroke-width="6"/>
    <text y="13" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="38" fill="#b8483c">3</text>
  </g>`;
}

function estadoDecorado(t) {
  const sale = TOQUE + 0.4;
  const q = tramo(t, sale, sale + 0.7);
  const origen = posicionCapsula('Intenso', 'd', 1);
  const [dx, dy] = arco([0, 0], [CARGA[0] - origen.x, CARGA[1] - origen.y], 150, q);
  const llega = sale + 0.7;
  const llenado = tramo(t, llega + 0.4, llega + 2.0);
  return {
    puerta: 100,
    led: t > llega && t < llega + 2.2 ? (Math.sin((t - llega) * 18) > 0 ? 1 : 0.4) : 1,
    reloj: (RELOJ + t) / 60,
    sola: SOLA_ESCONDIDA,
    papelEnArmario: false,
    capsulas: {
      ...armarioAlEmpezar(4).capsulas,
      'Intenso-d1': { dx, dy, rot: 300 * q, escala: lerp(1, 0.6, q), opacidad: q >= 1 ? 0 : q > 0.85 ? (1 - q) / 0.15 : 1 },
    },
    rebote: t > llega && t < llega + 0.6 ? (t - llega) / 0.6 : 0,
    taza: { nivel: llenado, escala: tramo(t, TOQUE + 0.15, TOQUE + 0.4) * (1 + 0.15 * pulso(t, TOQUE + 0.45, 0.12)) },
    chorro: t > llega + 0.4 && t < llega + 2.0 ? 1 : 0,
    vapor: t > llega + 1.8 && t < llega + 3.6 ? (t - llega - 1.8) / 1.8 : 0,
    hucha: { contenta: tramo(t, TOQUE + 0.2, TOQUE + 0.3) * (1 - tramo(t, 5.6, 5.7)) },
  };
}

function render(t) {
  camara.setAttribute('transform', camaraPorClaves(t, CAMARA));
  const manos = capsulito.pintar(estadoCapsulito(t));
  pintarLupa(t, manos.manoDer);
  pintarMovil(t);
  pintarInsignia(t);
  pintarDecorado(decorado, estadoDecorado(t));
  plano.ponerSubtitulo(t, SUBTITULOS);
}

plano.publicar(render);
