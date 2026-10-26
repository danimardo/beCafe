// Plano 7 · «Más café» (guion.md, plano 7). Capsulito despide el papel de una patada: la bola cierra el armario.
// Con el golpe, la taza salta de la cafetera y él la recoge; la levanta y llega el cierre de marca con un guiño.
import { BOCAS, andar, lerp, mezclarBocas, tramo } from './capsulito.js';
import { BANDEJA, PAPEL_EN_SUELO, SUELO_ESCENA, armarioAlEmpezar, papelSvg, pintarDecorado } from './decorado.js';
import { tazaSvg } from './objetos.js';
import { ESCALA, aEscena, arco, camaraPorClaves, grupo, mezclar, montarPlano, parpadeo, pulso, vozEn } from './plano.js';

export const DURACION = 9.0;
const RELOJ = 63.4;
const TRAMOS = [
  { desde: 0.4, hasta: 2.0, en: 0.6 },
  { desde: 2.0, hasta: 2.9, en: 3.9 },
  { desde: 2.9, hasta: 4.0, en: 5.6 },
];
const SUBTITULOS = [
  [0.6, 2.6, 'Menos arqueología de cajón.'],
  [3.8, 5.2, 'Más café.'],
  [5.5, 9.0, 'beCafé.'],
];

const plano = await montarPlano({ numero: '07', titulo: 'Más café', duracion: DURACION, tramos: TRAMOS });
const { camara, decorado, capsulito, delante, pantalla } = plano;
const papel = grupo(delante);
const taza = grupo(delante);
const marca = grupo(pantalla);

const X0 = 380;
const X1 = 600;
const PATADA = 1.45;
const GOLPE = 2.0;
const SALTA = 2.5;
const RECOGE = 3.0;
const CAMARA = [
  [0, { z: 1.12, fx: 560, fy: 1160, sy: 1010 }],
  [1.0, { z: 1.12, fx: 590, fy: 1160, sy: 1010 }],
  [4.6, { z: 1.12, fx: 590, fy: 1160, sy: 1010 }],
  [5.4, { z: 1.2, fx: 620, fy: 1200, sy: 1240 }],
];

function anguloPuerta(t) {
  if (t < GOLPE) return 100;
  if (t < GOLPE + 0.35) return lerp(100, -6, ((t - GOLPE) / 0.35) ** 2);
  return -6 * Math.exp(-(t - GOLPE - 0.35) * 8) * Math.cos((t - GOLPE - 0.35) * 30);
}

/** Bola de papel arrugado. Unidades de la escena; origen en el centro. */
const bolaSvg = () => `<g>
  <circle r="26" fill="#fffdf7" stroke="#c9b49b" stroke-width="4"/>
  <path d="M-16 -6 l10 6 l6 -12 l8 10 l8 -4 M-12 12 l10 -6 l8 8 l8 -10" fill="none" stroke="#c9b49b" stroke-width="3" stroke-linejoin="round"/>
  <path d="M-8 -18 q6 4 12 0" fill="none" stroke="#b8483c" stroke-width="3"/>
</g>`;

function estadoCapsulito(t) {
  const avance = tramo(t, 0.15, 1.15);
  const x = lerp(X0, X1, avance);
  const paso = andar(((X1 - X0) * avance) / ESCALA, { paso: 120, altura: 18, peso: Math.sin(Math.PI * avance) });
  // Patada: el pie derecho va atrás, sale hacia delante y vuelve.
  const atras = tramo(t, PATADA - 0.25, PATADA - 0.05) * (1 - tramo(t, PATADA - 0.05, PATADA));
  const delanteP = tramo(t, PATADA - 0.05, PATADA + 0.05) * (1 - tramo(t, PATADA + 0.25, PATADA + 0.5));
  const pies = paso.pies;
  const der = { ...pies.der };
  der.x = lerp(lerp(der.x, 700, atras), 880, delanteP);
  der.y = lerp(lerp(der.y, 1000, atras), 960, delanteP);
  der.ang = lerp(lerp(der.ang, 18, atras), -26, delanteP);

  const recoge = tramo(t, SALTA, RECOGE);
  const levanta = tramo(t, 3.3, 3.7);
  const incl = -7 * delanteP + 6 * pulso(t, GOLPE + 0.3, 0.3) + 5 * pulso(t, RECOGE, 0.2) - 3 * levanta;
  const bob = paso.bob - 8 * pulso(t, RECOGE + 0.05, 0.15) + 12 * pulso(t, 6.3, 0.3);

  let derMano = mezclar([975, 795], [1000, 640], recoge);
  derMano = mezclar(derMano, [985, 470], levanta);
  const enJarra = [352, 813];
  const izq = mezclar(enJarra, [300, 600], tramo(t, PATADA - 0.3, PATADA) * (1 - tramo(t, PATADA + 0.3, PATADA + 0.6)));

  const guino = tramo(t, 6.4, 6.5) * (1 - tramo(t, 6.9, 7.0));
  const cierre = parpadeo(t, [0.3, 2.9, 8.2]);
  const p = Math.max(0.1, cierre);
  let mirada = [0.4, 0.3];
  mirada = mezclar(mirada, [0.7, 0.85], tramo(t, 1.0, 1.2) * (1 - tramo(t, PATADA + 0.1, PATADA + 0.2)));
  mirada = mezclar(mirada, [0.95, -0.2], tramo(t, PATADA + 0.1, PATADA + 0.25) * (1 - tramo(t, SALTA - 0.1, SALTA)));
  mirada = mezclar(mirada, [0.7, -0.85], tramo(t, SALTA - 0.1, SALTA) * (1 - tramo(t, 3.5, 3.8)));
  mirada = mezclar(mirada, [0.05, 0.05], tramo(t, 3.6, 3.9));
  const asombro = Math.min(1, pulso(t, GOLPE + 0.25, 0.3) * 1.2 + pulso(t, SALTA + 0.1, 0.3));
  const cejas = { subida: 16 * asombro + 10 * levanta, giro: 0 };

  let boca = BOCAS.sonrisa;
  boca = mezclarBocas(boca, BOCAS.asombro, asombro);
  boca = mezclarBocas(boca, BOCAS.feliz, levanta);
  if (vozEn(t, TRAMOS) !== null) boca = plano.boca(t, levanta > 0.5 ? BOCAS.feliz : BOCAS.sonrisa);

  return {
    x,
    y: SUELO_ESCENA,
    escala: ESCALA,
    incl,
    bob,
    pies: { izq: pies.izq, der },
    brazos: {
      der: { ik: derMano, signo: 1, mano: 'puno' },
      izq: { ik: izq, signo: 1, mano: 'puno' },
    },
    parpados: [p, Math.max(p, guino)],
    mirada,
    cejas,
    asombro,
    boca,
  };
}

function pintarPapel(t) {
  if (t < PATADA) {
    papel.innerHTML = papelSvg();
    papel.setAttribute('transform', PAPEL_EN_SUELO);
    return;
  }
  papel.innerHTML = `<g transform="scale(1.3)">${bolaSvg()}</g>`;
  let p;
  if (t < GOLPE) p = arco([699, 1540], [1100, 1290], 170, (t - PATADA) / (GOLPE - PATADA));
  else if (t < GOLPE + 0.45) p = arco([1100, 1290], [1010, 1562], 40, (t - GOLPE) / 0.45);
  else p = [lerp(1010, 1240, tramo(t, GOLPE + 0.45, GOLPE + 1.3)), 1562];
  const giro = t * 520;
  const escala = t < PATADA + 0.1 ? lerp(0.4, 1, (t - PATADA) / 0.1) : 1;
  papel.setAttribute('transform', `translate(${p[0]} ${p[1]}) rotate(${giro}) scale(${escala})`);
}

/**
 * La taza salta de la bandeja con el portazo y cae en la mano de Capsulito, que la levanta. Mientras vuela y en
 * la mano se dibuja delante del armario; en la bandeja la pinta el decorado.
 */
function pintarTaza(t, mano, x) {
  if (t < SALTA) {
    taza.innerHTML = '';
    return { nivel: 1, dy: -10 * pulso(t, GOLPE + 0.4, 0.12) };
  }
  const [hx, hy] = aEscena(mano, x);
  const enMano = [hx + 6, hy - 14];
  let p = enMano;
  let giro = 0;
  if (t < RECOGE) {
    const q = (t - SALTA) / (RECOGE - SALTA);
    p = arco([BANDEJA.x, BANDEJA.y], enMano, 90, q);
    giro = -30 * Math.sin(Math.PI * q);
  }
  // Vapor del café recién hecho cuando la levanta.
  const vapor = tramo(t, 3.6, 4.0);
  const humo = vapor > 0
    ? `<path d="M-8 -64 q-12 -16 0 -32 q12 -16 0 -32" fill="none" stroke="#cdb293" stroke-width="6" stroke-linecap="round" opacity="${(0.8 * vapor).toFixed(2)}" transform="translate(0 ${-6 * Math.sin(t * 4)})"/>`
    : '';
  taza.innerHTML = `<g transform="translate(${p[0]} ${p[1]}) rotate(${giro}) scale(1.15)">${tazaSvg({ nivel: 1 })}${humo}</g>`;
  return null;
}

function pintarMarca(t) {
  const k = tramo(t, 5.0, 5.4);
  if (k <= 0) {
    marca.innerHTML = '';
    return;
  }
  const s = 0.8 + 0.2 * k + 0.05 * pulso(t, 5.9, 0.3);
  marca.innerHTML = `<g transform="translate(540 560) scale(${s})" opacity="${k}">
    <rect x="-400" y="-190" width="800" height="380" rx="56" fill="#fffdf7" stroke="#8a4b22" stroke-width="8"/>
    <text y="40" text-anchor="middle" font-family="Georgia, serif" font-weight="800" font-size="168" fill="#2b1d14">beCafé</text>
    <text y="128" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="40" fill="#8a4b22">Un toque por cada café</text>
  </g>`;
}

function render(t) {
  camara.setAttribute('transform', camaraPorClaves(t, CAMARA));
  const e = estadoCapsulito(t);
  const manos = capsulito.pintar(e);
  pintarPapel(t);
  pintarMarca(t);
  pintarDecorado(decorado, {
    puerta: anguloPuerta(t),
    led: 1,
    reloj: (RELOJ + t) / 60,
    ...armarioAlEmpezar(7),
    papelEnArmario: false,
    taza: pintarTaza(t, manos.manoDer, e.x),
    hucha: { contenta: tramo(t, 5.6, 5.7), salto: t > 5.6 && t < 6.2 ? (t - 5.6) / 0.6 : 0 },
  });
  plano.ponerSubtitulo(t, SUBTITULOS);
}

plano.publicar(render);
