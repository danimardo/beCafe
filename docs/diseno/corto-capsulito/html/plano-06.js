// Plano 6 · «Cuentas claras» (guion.md, plano 6). Dos fichas: cada café va al saldo personal; la aportación
// entra en la hucha. Capsulito echa una moneda y la hucha se recupera; luego prueba con granos de café y la hucha
// se los escupe (chiste, no una operación de la aplicación). «Entendido, jefa.»
import { BOCAS, lerp, mezclarBocas, tramo } from './capsulito.js';
import {
  HUCHA,
  HUECOS,
  PAPEL_EN_SUELO,
  SUELO_ESCENA,
  armarioAlEmpezar,
  papelSvg,
  pintarDecorado,
} from './decorado.js';
import { granoSvg, monedaSvg, movilSvg, tazaSvg } from './objetos.js';
import { ESCALA, aEscena, arco, camaraPorClaves, enMano, grupo, mezclar, montarPlano, parpadeo, pulso, vozEn } from './plano.js';

export const DURACION = 12.4;
const RELOJ = 51.0;
const TRAMOS = [
  { desde: 0.4, hasta: 1.95, en: 1.0 },
  { desde: 1.95, hasta: 5.2, en: 3.2 },
  { desde: 5.2, hasta: 7.2, en: 9.4 },
];
const SUBTITULOS = [
  [1.0, 3.0, 'Cada café va a tu saldo.'],
  [3.1, 6.6, 'El dinero de verdad entra en la hucha cuando aportas.'],
  [9.3, 11.8, 'Entendido, jefa.'],
];

const plano = await montarPlano({ numero: '06', titulo: 'Cuentas claras', duracion: DURACION, tramos: TRAMOS });
const { camara, decorado, capsulito, delante, pantalla } = plano;
const papel = grupo(decorado.g);
papel.innerHTML = papelSvg();
papel.setAttribute('transform', PAPEL_EN_SUELO);
const movil = grupo(decorado.g);
const enLaMano = grupo(delante);
const vuelo = grupo(delante);
const fichas = grupo(pantalla);

const X = 380;
const RISTRETTO = HUECOS[1];
const CAMARA = [
  [0, { z: 1.12, fx: 560, fy: 1160, sy: 1010 }],
  [0.8, { z: 1.12, fx: 560, fy: 1160, sy: 1120 }],
  [6.6, { z: 1.12, fx: 560, fy: 1160, sy: 1120 }],
  [7.4, { z: 1.45, fx: 470, fy: 1080, sy: 1130 }],
  [9.3, { z: 1.45, fx: 470, fy: 1080, sy: 1130 }],
  [10.0, { z: 1.25, fx: 500, fy: 1140, sy: 1120 }],
];

/** Momentos del gag. */
const MONEDA = { saca: 4.0, suelta: 5.0, entra: 5.6 };
const GRANOS = { saca: 6.9, suelta: 7.35, entran: 7.85, escupe: 8.25, cabeza: 8.6, suelo: 9.3 };
const SUELTA_MANO = [470, 480];
const CABEZA = [352, 968];

function estadoCapsulito(t) {
  const lanzaMoneda = tramo(t, MONEDA.saca + 0.4, MONEDA.suelta) * (1 - tramo(t, MONEDA.suelta + 0.2, MONEDA.suelta + 0.6));
  const lanzaGranos = tramo(t, GRANOS.saca + 0.2, GRANOS.suelta) * (1 - tramo(t, GRANOS.suelta + 0.2, GRANOS.suelta + 0.6));
  const golpe = pulso(t, GRANOS.cabeza + 0.05, 0.25);
  const mareo = tramo(t, GRANOS.cabeza, GRANOS.cabeza + 0.1) * (1 - tramo(t, 9.2, 9.5));
  const saludo = tramo(t, 9.35, 9.7) * (1 - tramo(t, 11.5, 11.9));
  const incl = -4 * lanzaMoneda - 4 * lanzaGranos + 5 * golpe + 3 * Math.sin((t - GRANOS.cabeza) * 8) * mareo + 2 * saludo;
  const bob = -16 * golpe + 12 * pulso(t, 10.2, 0.25);

  // Izquierda: señala la ficha, lanza la moneda, lanza los granos y saluda.
  const enJarra = [352, 813];
  const fichaArriba = [330, 470];
  const prepara = [300, 640];
  let izq = mezclar(enJarra, fichaArriba, tramo(t, 1.2, 1.5) * (1 - tramo(t, 2.6, 2.9)));
  izq = mezclar(izq, prepara, tramo(t, MONEDA.saca, MONEDA.saca + 0.35));
  izq = mezclar(izq, SUELTA_MANO, lanzaMoneda);
  izq = mezclar(izq, enJarra, tramo(t, MONEDA.suelta + 0.4, MONEDA.suelta + 0.8));
  izq = mezclar(izq, prepara, tramo(t, GRANOS.saca - 0.2, GRANOS.saca + 0.2) * (1 - lanzaGranos));
  izq = mezclar(izq, SUELTA_MANO, lanzaGranos);
  izq = mezclar(izq, enJarra, tramo(t, GRANOS.suelta + 0.4, GRANOS.suelta + 0.8));
  izq = mezclar(izq, [400, 455], saludo);
  let manoIzq = 'puno';
  if (t > 1.25 && t < 2.8) manoIzq = 'senalar';
  if ((t > MONEDA.suelta && t < MONEDA.suelta + 0.4) || (t > GRANOS.suelta && t < GRANOS.suelta + 0.4)) manoIzq = 'abierta';
  if (saludo > 0.4) manoIzq = 'abierta';

  const cierre = parpadeo(t, [0.4, 3.0, 6.3, 11.0]);
  const sorna = tramo(t, 6.6, 6.9) * (1 - tramo(t, GRANOS.suelta, GRANOS.suelta + 0.3));
  const aprieta = tramo(t, GRANOS.cabeza - 0.05, GRANOS.cabeza + 0.05) * (1 - tramo(t, 8.9, 9.1));
  const p = Math.max(0.1 + 0.25 * sorna + 0.2 * mareo, cierre, aprieta);
  let mirada = [0.05, 0.05];
  mirada = mezclar(mirada, [-0.4, -0.9], tramo(t, 1.1, 1.4) * (1 - tramo(t, 2.6, 2.9)));
  mirada = mezclar(mirada, [0.75, -0.75], tramo(t, MONEDA.suelta - 0.1, MONEDA.suelta + 0.2) * (1 - tramo(t, 6.4, 6.6)));
  mirada = mezclar(mirada, [0.1, 0.05], sorna);
  mirada = mezclar(mirada, [0.8, -0.8], tramo(t, GRANOS.suelta, GRANOS.suelta + 0.2) * (1 - tramo(t, GRANOS.cabeza, GRANOS.cabeza + 0.1)));
  mirada = mezclar(mirada, [0.75, -0.7], tramo(t, 9.3, 9.6));
  const asombro = Math.min(1, pulso(t, GRANOS.escupe + 0.1, 0.25) * 1.5);
  const cejas = {
    subida: 12 * sorna + 20 * asombro - 8 * mareo + 10 * saludo,
    giro: 14 * sorna,
  };

  let boca = BOCAS.sonrisa;
  boca = mezclarBocas(boca, BOCAS.feliz, tramo(t, MONEDA.entra, MONEDA.entra + 0.2) * (1 - tramo(t, 6.4, 6.6)));
  boca = mezclarBocas(boca, { w: 110, h: 0, s: 18 }, sorna);
  boca = mezclarBocas(boca, BOCAS.asombro, asombro);
  boca = mezclarBocas(boca, { w: 100, h: 18, s: -12 }, mareo);
  if (vozEn(t, TRAMOS) !== null) boca = plano.boca(t, BOCAS.sonrisa);

  return {
    x: X,
    y: SUELO_ESCENA,
    escala: ESCALA,
    incl,
    bob,
    brazos: {
      der: { ik: [975 + 20 * golpe, 795], signo: 1, mano: 'puno' },
      izq: { ik: izq, signo: 1, mano: manoIzq, giroMano: manoIzq === 'abierta' ? -60 : 0, estira: 1 + 0.25 * saludo },
    },
    parpados: [p, p],
    mirada,
    cejas,
    asombro,
    boca,
  };
}

const granos = (n) =>
  Array.from({ length: n }, (_, i) => `<g transform="translate(${(i - 1) * 22} ${i === 1 ? -10 : 0}) rotate(${i * 50 - 40})">${granoSvg()}</g>`).join('');

function pintarMano(t, mano) {
  // Moneda o granos en la mano antes de lanzarlos (unidades de la escena dentro de la mano).
  const conMoneda = t > MONEDA.saca && t < MONEDA.suelta;
  const conGranos = t > GRANOS.saca && t < GRANOS.suelta;
  const marcado = conMoneda ? monedaSvg() : conGranos ? granos(3) : '';
  enMano(enLaMano, `<g transform="translate(0 -40)">${marcado}</g>`, mano, X, 0, 1 / ESCALA, conMoneda || conGranos);
}

function pintarVuelos(t) {
  const desde = aEscena(SUELTA_MANO, X);
  let html = '';
  const qm = (t - MONEDA.suelta) / (MONEDA.entra - MONEDA.suelta);
  if (qm > 0 && qm < 1) {
    const [x, y] = arco(desde, [HUCHA.ranura[0], HUCHA.ranura[1] - 6], 200, qm);
    html += `<g transform="translate(${x} ${y}) rotate(${qm * 720}) scale(${1 - 0.3 * qm})">${monedaSvg()}</g>`;
  }
  const qg = (t - GRANOS.suelta) / (GRANOS.entran - GRANOS.suelta);
  if (qg > 0 && qg < 1) {
    const [x, y] = arco(desde, HUCHA.ranura, 220, qg);
    html += `<g transform="translate(${x} ${y}) rotate(${qg * 300})">${granos(3)}</g>`;
  }
  // Escupitajo: de la boca de la hucha a la cúpula de Capsulito, y rebote al suelo.
  for (let i = 0; i < 3; i += 1) {
    const sale = GRANOS.escupe + i * 0.06;
    const llega = GRANOS.cabeza + i * 0.06;
    const cae = GRANOS.suelo + i * 0.1;
    let p = null;
    if (t > sale && t < llega) p = arco(HUCHA.boca, [CABEZA[0] + i * 26, CABEZA[1]], 40, (t - sale) / (llega - sale));
    else if (t >= llega && t < cae) p = arco([CABEZA[0] + i * 26, CABEZA[1]], [150 + i * 70, SUELO_ESCENA + 30 + i * 8], 140, (t - llega) / (cae - llega));
    else if (t >= cae) p = [150 + i * 70, SUELO_ESCENA + 30 + i * 8];
    if (p) html += `<g transform="translate(${p[0]} ${p[1]}) rotate(${t * 600 * (t < cae ? 1 : 0) + i * 70}) scale(1.2)">${granoSvg()}</g>`;
  }
  // Resoplido de la hucha.
  const resopla = tramo(t, 8.9, 9.4);
  if (resopla > 0 && resopla < 1) {
    const [bx, by] = HUCHA.boca;
    html += `<g opacity="${1 - resopla}" stroke="#a8896c" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M${bx - 20 - 40 * resopla} ${by - 6} q-14 -8 -28 0"/><path d="M${bx - 20 - 46 * resopla} ${by + 10} q-14 8 -28 0"/></g>`;
  }
  // Estrellitas del mareo sobre la cúpula.
  const mareo = tramo(t, GRANOS.cabeza, GRANOS.cabeza + 0.1) * (1 - tramo(t, 9.2, 9.5));
  if (mareo > 0) {
    for (let i = 0; i < 3; i += 1) {
      const a = t * 5 + (i * Math.PI * 2) / 3;
      html += `<g transform="translate(${CABEZA[0] + 20 + Math.cos(a) * 70} ${CABEZA[1] - 30 + Math.sin(a) * 16}) scale(${mareo})"><path d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3Z" fill="#f4c862" stroke="#8a6a20" stroke-width="2"/></g>`;
    }
  }
  vuelo.innerHTML = html;
}

/** Fichas en pantalla: «Café → tu saldo» y «Aportación → hucha». Sin importes (guion: reglas de representación). */
function pintarFichas(t) {
  const ficha = (x, k, resalte, icono, titulo, destino, nota) => {
    if (k <= 0) return '';
    const s = 0.6 + 0.4 * k + 0.08 * resalte;
    return `<g transform="translate(${x + 235} 470) scale(${s}) translate(-235 -110)" opacity="${k}">
      <rect width="470" height="220" rx="34" fill="#fffdf7" stroke="#8a4b22" stroke-width="${5 + 4 * resalte}"/>
      <g transform="translate(78 140)">${icono}</g>
      <text x="168" y="82" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="40" fill="#2b1d14">${titulo}</text>
      <text x="168" y="136" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="34" fill="#8a4b22">→ ${destino}</text>
      ${nota ? `<text x="168" y="182" font-family="Inter, system-ui, sans-serif" font-size="27" fill="#5b3b2c">${nota}</text>` : ''}
    </g>`;
  };
  const k1 = tramo(t, 0.9, 1.2);
  const k2 = tramo(t, 3.1, 3.4);
  const r1 = pulso(t, 1.6, 0.4);
  const r2 = pulso(t, MONEDA.entra + 0.1, 0.4);
  fichas.innerHTML =
    ficha(40, k1, r1, `<g transform="scale(1.1)">${tazaSvg({ nivel: 1 })}</g>`, 'Café', 'tu saldo', null) +
    ficha(570, k2, r2, `<g transform="translate(0 -40) scale(1.5)">${monedaSvg()}</g>`, 'Aportación', 'hucha', 'y suma a tu saldo');
}

function pintarMovil(t) {
  const q = tramo(t, 0.1, 0.7);
  if (q >= 1) {
    movil.setAttribute('display', 'none');
    return;
  }
  movil.setAttribute('display', 'inline');
  movil.setAttribute('transform', `translate(${lerp(950, 1320, q)} ${SUELO_ESCENA - 50 * Math.sin(Math.PI * q)}) scale(1.1)`);
  movil.innerHTML = movilSvg({
    tarjeta: { ...RISTRETTO, quedan: 21 },
    nota: 'Compra registrada',
    detalle: '2 cajas · Ristretto',
  });
}

function estadoDecorado(t) {
  const armario = armarioAlEmpezar(6);
  const entra = tramo(t, MONEDA.entra, MONEDA.entra + 0.4);
  const traga = t > GRANOS.entran && t < GRANOS.escupe;
  return {
    puerta: 100,
    led: 1,
    reloj: (RELOJ + t) / 60,
    ...armario,
    papelEnArmario: false,
    taza: { nivel: 1 },
    hucha: {
      encogida: 1 - entra,
      contenta: (tramo(t, MONEDA.entra, MONEDA.entra + 0.1) * (1 - tramo(t, 7.6, 7.7))) + tramo(t, 10.4, 10.5),
      salto:
        t > MONEDA.entra && t < MONEDA.entra + 0.6
          ? (t - MONEDA.entra) / 0.6
          : traga
            ? 0.35 * Math.sin(((t - GRANOS.entran) / (GRANOS.escupe - GRANOS.entran)) * Math.PI)
            : 0,
      boca: tramo(t, GRANOS.escupe - 0.08, GRANOS.escupe) * (1 - tramo(t, GRANOS.escupe + 0.25, GRANOS.escupe + 0.4)),
    },
  };
}

function render(t) {
  camara.setAttribute('transform', camaraPorClaves(t, CAMARA));
  const manos = capsulito.pintar(estadoCapsulito(t));
  pintarMano(t, manos.manoIzq);
  pintarVuelos(t);
  pintarFichas(t);
  pintarMovil(t);
  pintarDecorado(decorado, estadoDecorado(t));
  plano.ponerSubtitulo(t, SUBTITULOS);
}

plano.publicar(render);
