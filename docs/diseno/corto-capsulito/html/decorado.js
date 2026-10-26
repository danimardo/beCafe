// Decorado común del corto (plan.md §6): la misma cocina en todos los planos, para que ningún objeto
// aparezca ni desaparezca sin motivo. Lienzo 1080 × 1920. `pintarDecorado(estado)` solo depende del estado.
import { huchaSvg, tazaSvg } from './objetos.js';

// Módulo del navegador: ESLint aplica a los .js los globales de Node, así que los del navegador salen de globalThis.
const { document } = globalThis;

const NS = 'http://www.w3.org/2000/svg';

export const LIENZO = Object.freeze({ ancho: 1080, alto: 1920 });
/** Línea del suelo en la que apoya Capsulito, delante del armario. */
export const SUELO_ESCENA = 1530;

const PUERTA = Object.freeze({ bisagra: 1064, libre: 536, arriba: 1100, abajo: 1480 });
const ANCHO_PUERTA = PUERTA.bisagra - PUERTA.libre;
export const HUECOS = Object.freeze([
  { x: 548, color: '#b8483c', claro: '#d9705f', nombre: 'Intenso', cantidad: 2 },
  { x: 680, color: '#4b3a8c', claro: '#7564b8', nombre: 'Ristretto', cantidad: 1 },
  { x: 812, color: '#c8962f', claro: '#e8bb55', nombre: 'Suave', cantidad: 2 },
  { x: 944, color: '#3f7d55', claro: '#64a77a', nombre: 'Descafeinado', cantidad: 2 },
]);
const ANCHO_HUECO = 124;
const BALDA = 1290;
/** Huecos que reciben cápsulas nuevas tras la compra (plano 5): empiezan ocultas. */
const REPOSICION = Object.freeze({ Ristretto: 2 });
/** Estado de la cápsula sola desde que se esconde al fondo del hueco (final del plano 2). */
export const SOLA_ESCONDIDA = Object.freeze({ dx: 74, dy: -22, escala: 0.8, oscuro: 1 });
/** Papel de apuntes tirado en el suelo al final del plano 2. */
export const PAPEL_EN_SUELO = 'translate(699.44 1560) scale(1.1 0.42) rotate(70) translate(-66 -52)';
/** Posición de la hucha en la encimera y de su ranura en la escena. */
export const HUCHA = Object.freeze({ x: 588, y: 1062, escala: 0.85, ranura: [600, 957], boca: [535, 1036] });
/** Centro de la bandeja de la cafetera, donde apoya la taza, y salida del café. */
export const BANDEJA = Object.freeze({ x: 800, y: 1024, caño: 943 });
/** Boca de carga de la cafetera, por donde entran las cápsulas. */
export const CARGA = Object.freeze([800, 760]);

/**
 * Cápsulas del armario al empezar el plano `n`: las Suave se van en el plano 3, una Intenso en el 4 y el
 * Ristretto se repone en el 5. Así ningún plano devuelve una cápsula que ya se gastó.
 */
export function armarioAlEmpezar(n) {
  const capsulas = {};
  if (n > 3) for (const c of ['d0', 'd1', 'a0', 'a1']) capsulas[`Suave-${c}`] = { opacidad: 0 };
  if (n > 4) capsulas['Intenso-d1'] = { opacidad: 0 };
  if (n > 5) for (const c of ['d1', 'a0', 'a1']) capsulas[`Ristretto-${c}`] = { opacidad: 1 };
  return { capsulas, sola: n > 5 ? {} : SOLA_ESCONDIDA };
}

/** Posición en la escena de una cápsula del armario: fila 'd' (delante) o 'a' (atrás). */
export function posicionCapsula(nombre, fila, k) {
  const h = HUECOS.find((x) => x.nombre === nombre);
  if (!h) throw new Error(`Hueco desconocido: ${nombre}`);
  return fila === 'd'
    ? { x: h.x + 38 + k * 46, y: BALDA, escala: 1.2 }
    : { x: h.x + 40 + k * 44, y: BALDA - 14, escala: 1 };
}

/**
 * Cápsula de café apoyada en su tapa, como en un armario real: borde ancho abajo, cuerpo cónico con
 * nervios que se estrecha hacia arriba y remate redondeado. Origen: centro de la base.
 */
export function capsulaSvg(color, claro, escala = 1) {
  return `<g transform="scale(${escala})">
    <ellipse cx="0" cy="1" rx="34" ry="6" fill="#2b1d14" opacity=".28"/>
    <path d="M-27 -8 C-24 -30 -18 -50 -13 -62 Q0 -72 13 -62 C18 -50 24 -30 27 -8Z" fill="${color}" stroke="#2b1d14" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M-9 -12 L-7 -60 M9 -12 L7 -60" stroke="#2b1d14" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
    <path d="M-19 -14 C-17 -32 -14 -46 -10 -56" stroke="${claro}" stroke-width="6" stroke-linecap="round" fill="none" opacity=".85"/>
    <path d="M-13 -62 Q0 -70 13 -62" stroke="#fff" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>
    <rect x="-36" y="-10" width="72" height="11" rx="5" fill="#d9d2c8" stroke="#2b1d14" stroke-width="3.5"/>
    <rect x="-30" y="-8" width="40" height="3" rx="1.5" fill="#fff" opacity=".7"/>
  </g>`;
}

/**
 * Papel de apuntes: dice que quedan 6 Ristretto, aunque en el hueco solo queda una (guion, plano 2).
 * 132 × 104, origen en la esquina superior izquierda.
 */
export function papelSvg() {
  return `<rect width="132" height="104" rx="4" fill="#fffdf7" stroke="#c9b49b" stroke-width="3"/>
    <rect x="46" y="-10" width="40" height="18" fill="#f4c862" opacity=".8"/>
    <text x="14" y="40" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="24" fill="#4b3a8c">Ristretto</text>
    <text x="14" y="82" font-family="Georgia, serif" font-style="italic" font-size="21" fill="#5b3b2c">quedan</text>
    <text x="92" y="88" font-family="Georgia, serif" font-weight="700" font-size="40" fill="#b8483c">6</text>
    <ellipse cx="103" cy="74" rx="22" ry="21" fill="none" stroke="#b8483c" stroke-width="3.5" transform="rotate(-12 103 74)"/>`;
}

function huecosSvg() {
  return HUECOS.map((h, i) => {
    const capsulas = [];
    const repuestas = REPOSICION[h.nombre] ?? 0;
    const capsula = (fila, k, extra) => {
      const p = posicionCapsula(h.nombre, fila, k);
      const sola = i === 1 && fila === 'd' && k === 0 ? ' id="capsula-sola"' : '';
      const atras = fila === 'a' ? ' opacity=".5"' : '';
      const marca = extra ? ' data-extra="1"' : '';
      return `<g${sola} transform="translate(${p.x} ${p.y})"${atras}><g class="balanceo" data-cap="${h.nombre}-${fila}${k}"${marca}>${capsulaSvg(h.color, h.claro, p.escala)}</g></g>`;
    };
    // Fila de atrás, más oscura, solo en los huecos llenos: da profundidad al hueco.
    const atras = h.cantidad > 1 ? h.cantidad : repuestas;
    for (let k = 0; k < atras; k += 1) capsulas.push(capsula('a', k, h.cantidad <= 1));
    for (let k = 0; k < Math.max(h.cantidad, repuestas); k += 1) capsulas.push(capsula('d', k, k >= h.cantidad));
    return `<g data-hueco="${h.nombre}">
      ${capsulas.join('')}
      <rect x="${h.x + 18}" y="${BALDA + 4}" width="${ANCHO_HUECO - 36}" height="16" rx="5" fill="#f5ece1" stroke="#5b3b2c" stroke-width="2"/>
      <circle cx="${h.x + 34}" cy="${BALDA + 12}" r="5" fill="${h.color}"/>
      <rect x="${h.x + 44}" y="${BALDA + 10}" width="${ANCHO_HUECO - 74}" height="4" rx="2" fill="#a8896c"/>
    </g>`;
  }).join('');
}

function separadoresSvg() {
  return HUECOS.slice(1)
    .map((h) => `<rect x="${h.x - 8}" y="1118" width="8" height="${BALDA - 1118}" fill="#6b4630"/>`)
    .join('');
}

const PLANTILLA = `
<defs>
  <linearGradient id="dec-pared" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f7eee3"/><stop offset="1" stop-color="#ecdcc8"/></linearGradient>
  <linearGradient id="dec-suelo" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d9bc9b"/><stop offset="1" stop-color="#c9a985"/></linearGradient>
  <linearGradient id="dec-madera" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c39467"/><stop offset="1" stop-color="#8d6142"/></linearGradient>
  <linearGradient id="dec-madera-interior" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#e2c19c"/><stop offset="1" stop-color="#c9a27b"/></linearGradient>
  <linearGradient id="dec-fondo-armario" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#3a261b"/><stop offset="1" stop-color="#55392a"/></linearGradient>
  <linearGradient id="dec-metal" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#fcf8f3"/><stop offset=".55" stop-color="#e6c9a8"/><stop offset="1" stop-color="#b88d69"/></linearGradient>
  <radialGradient id="dec-brillo-led"><stop stop-color="#9ef0a9" stop-opacity=".9"/><stop offset="1" stop-color="#9ef0a9" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1080" height="1500" fill="url(#dec-pared)"/>
<g id="azulejos">
  <rect x="500" y="690" width="580" height="374" fill="#efe3d3"/>
  ${Array.from({ length: 10 }, (_, i) => `<line x1="${500 + i * 64}" y1="690" x2="${500 + i * 64}" y2="1064" stroke="#e1cfb9" stroke-width="3"/>`).join('')}
  ${Array.from({ length: 6 }, (_, i) => `<line x1="500" y1="${690 + i * 64}" x2="1080" y2="${690 + i * 64}" stroke="#e1cfb9" stroke-width="3"/>`).join('')}
</g>
<g id="reloj" transform="translate(190 760)">
  <circle r="86" fill="#fcf8f3" stroke="#5b3b2c" stroke-width="12"/>
  ${Array.from({ length: 12 }, (_, i) => `<rect x="-4" y="-72" width="8" height="${i % 3 === 0 ? 18 : 10}" rx="3" fill="#8a6a50" transform="rotate(${i * 30})"/>`).join('')}
  <rect id="reloj-hora" x="-6" y="-46" width="12" height="52" rx="6" fill="#2b1d14"/>
  <rect id="reloj-minuto" x="-4" y="-66" width="8" height="72" rx="4" fill="#5b3b2c"/>
  <circle r="9" fill="#c8962f"/>
</g>
<rect y="1488" width="1080" height="700" fill="url(#dec-suelo)"/>
<rect y="1484" width="1080" height="14" fill="#b8916c"/>
<g id="cafetera" transform="translate(584 677) scale(.72)">
  <g id="cafetera-cuerpo">
    <ellipse cx="300" cy="538" rx="200" ry="16" fill="#5b3b2c" opacity=".18"/>
    <rect x="130" y="95" width="340" height="440" rx="68" fill="url(#dec-metal)" stroke="#5b3b2c" stroke-width="11"/>
    <path d="M150 150 Q300 70 450 150 L450 260 Q300 305 150 260Z" fill="#5b3b2c"/>
    <rect x="207" y="312" width="186" height="167" rx="18" fill="#2b1d14"/>
    <rect x="260" y="280" width="80" height="82" rx="18" fill="#5b3b2c"/>
    <rect x="278" y="345" width="44" height="25" rx="10" fill="#fcf8f3"/>
    <rect x="185" y="482" width="230" height="28" rx="14" fill="#5b3b2c"/>
    <circle cx="300" cy="194" r="38" fill="#f4c862" stroke="#2b1d14" stroke-width="9"/>
    <circle id="led-brillo" cx="410" cy="200" r="34" fill="url(#dec-brillo-led)" opacity="0"/>
    <circle id="led" cx="410" cy="200" r="11" fill="#7a5a44" stroke="#2b1d14" stroke-width="4"/>
  </g>
  <g id="vapor" fill="none" stroke="#fcf8f3" stroke-linecap="round" stroke-width="24"></g>
</g>
<rect id="chorro" x="796" y="943" width="8" height="0" rx="4" fill="#6b3927"/>
<g id="taza"></g>
<rect x="500" y="1062" width="580" height="32" rx="8" fill="#8a5a3a"/>
<rect x="500" y="1062" width="580" height="8" rx="4" fill="#a8774f"/>
<g id="hucha" transform="translate(${HUCHA.x} ${HUCHA.y}) scale(${HUCHA.escala})"><g id="hucha-cuerpo"></g></g>
<rect x="520" y="1094" width="580" height="394" fill="url(#dec-madera)" stroke="#5b3b2c" stroke-width="10"/>
<g id="interior">
  <rect x="540" y="1110" width="532" height="370" fill="url(#dec-fondo-armario)"/>
  <rect x="540" y="1110" width="532" height="26" fill="#2b1d14" opacity=".35"/>
  ${separadoresSvg()}
  ${huecosSvg()}
  <rect x="540" y="${BALDA}" width="532" height="22" fill="#a57651"/>
  <rect x="540" y="${BALDA + 22}" width="532" height="6" fill="#2b1d14" opacity=".3"/>
  <g id="papel" transform="translate(600 1340) rotate(-4)">${papelSvg()}</g>
  <g transform="translate(800 1372)">
    <rect width="150" height="94" rx="6" fill="#c9a06e" stroke="#7a5236" stroke-width="4"/>
    <rect x="0" y="32" width="150" height="20" fill="#e8cfa6"/>
    <rect x="166" y="22" width="80" height="72" rx="6" fill="#b88a58" stroke="#7a5236" stroke-width="4"/>
  </g>
</g>
<g id="puerta"></g>
`;

export function crearDecorado(svg) {
  const g = document.createElementNS(NS, 'g');
  g.innerHTML = PLANTILLA;
  svg.appendChild(g);
  const buscar = (id) => {
    const n = g.querySelector(`#${id}`);
    if (!n) throw new Error(`Falta ${id} en el decorado`);
    return n;
  };
  return {
    g,
    puerta: buscar('puerta'),
    cafeteraCuerpo: buscar('cafetera-cuerpo'),
    led: buscar('led'),
    ledBrillo: buscar('led-brillo'),
    vapor: buscar('vapor'),
    relojHora: buscar('reloj-hora'),
    relojMinuto: buscar('reloj-minuto'),
    capsulaSola: buscar('capsula-sola').querySelector('.balanceo'),
    papel: buscar('papel'),
    hucha: buscar('hucha-cuerpo'),
    taza: buscar('taza'),
    chorro: buscar('chorro'),
    capsulas: [...g.querySelectorAll('[data-cap]')].map((n) => ({
      nodo: n,
      clave: n.getAttribute('data-cap'),
      extra: n.hasAttribute('data-extra'),
    })),
  };
}

/** Posición del tirador en la escena para un ángulo de puerta (grados). */
export function tirador(angulo) {
  const c = Math.cos((angulo * Math.PI) / 180);
  const s = Math.sin((angulo * Math.PI) / 180);
  const u = 0.92;
  const p = 46 * s;
  const x = PUERTA.bisagra - u * ANCHO_PUERTA * c;
  const yc = (PUERTA.arriba + PUERTA.abajo) / 2;
  const k = 1 + (p / ((PUERTA.abajo - PUERTA.arriba) / 2)) * u;
  return { x, y: yc, alto: 120 * k };
}

function pintarPuerta(nodo, angulo) {
  const c = Math.cos((angulo * Math.PI) / 180);
  const s = Math.sin((angulo * Math.PI) / 180);
  const { bisagra, arriba, abajo } = PUERTA;
  const libre = bisagra - ANCHO_PUERTA * c;
  const p = 46 * s;
  const punto = (u, v) => {
    // u: 0 bisagra → 1 borde libre; v: 0 arriba → 1 abajo.
    const x = bisagra + (libre - bisagra) * u;
    const ext = p * u;
    const y = arriba - ext + (abajo - arriba + 2 * ext) * v;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const exterior = c > 0;
  const hoja = [punto(0, 0), punto(1, 0), punto(1, 1), punto(0, 1)].join(' ');
  const panel = [punto(0.1, 0.08), punto(0.9, 0.08), punto(0.9, 0.92), punto(0.1, 0.92)].join(' ');
  const sombra = Math.max(0, Math.min(1, angulo / 90)) * 0.35;
  let html = `<polygon points="${hoja}" fill="${exterior ? 'url(#dec-madera)' : 'url(#dec-madera-interior)'}" stroke="#5b3b2c" stroke-width="9" stroke-linejoin="round"/>`;
  html += `<polygon points="${panel}" fill="none" stroke="${exterior ? '#7a5236' : '#b38a63'}" stroke-width="6" stroke-linejoin="round"/>`;
  if (exterior) {
    html += `<polygon points="${hoja}" fill="#2b1d14" opacity="${sombra.toFixed(3)}"/>`;
    const t = tirador(angulo);
    html += `<rect x="${(t.x - 9).toFixed(1)}" y="${(t.y - t.alto / 2).toFixed(1)}" width="18" height="${t.alto.toFixed(1)}" rx="9" fill="#f4c862" stroke="#5b3b2c" stroke-width="5"/>`;
  }
  nodo.innerHTML = html;
}

/**
 * Estado: puerta (grados, 0 cerrada), led (0..1), rebote (0..1, salto de la cafetera), vapor (0..1, progreso
 * de la nube) y reloj (minutos desde las 8:55), balanceo (grados de la cápsula sola), sola { dx, dy, escala,
 * oscuro } (desplazamiento de la cápsula sola hacia el fondo del hueco) y papelEnArmario (falso cuando lo coge Capsulito).
 */
export function pintarDecorado(d, e) {
  pintarPuerta(d.puerta, e.puerta ?? 0);
  const led = e.led ?? 0;
  d.led.setAttribute('fill', led > 0.5 ? '#6fd17f' : '#7a5a44');
  d.ledBrillo.setAttribute('opacity', String(led));
  const r = e.rebote ?? 0;
  const sy = 1 - 0.06 * Math.sin(r * Math.PI * 3) * (1 - r);
  d.cafeteraCuerpo.setAttribute('transform', `translate(300 535) scale(${2 - sy} ${sy}) translate(-300 -535)`);
  const v = e.vapor ?? 0;
  let vapor = '';
  if (v > 0 && v < 1) {
    for (let i = 0; i < 3; i += 1) {
      const q = Math.min(Math.max(v * 1.4 - i * 0.18, 0), 1);
      if (q <= 0 || q >= 1) continue;
      const y = 100 - q * 220;
      const x = 300 + (i - 1) * 60;
      const ondula = Math.sin(q * 7 + i) * 26;
      const d = `M${x} ${y + 90} q${ondula} -45 0 -90`;
      const opacidad = (Math.sin(q * Math.PI) * 0.95).toFixed(3);
      // Un trazo más oscuro debajo separa el vapor blanco de la pared clara.
      vapor += `<g opacity="${opacidad}"><path d="${d}" stroke="#cdb293" stroke-width="32"/><path d="${d}"/></g>`;
    }
  }
  d.vapor.innerHTML = vapor;
  const minutos = 55 + (e.reloj ?? 0);
  d.relojMinuto.setAttribute('transform', `rotate(${minutos * 6})`);
  d.relojHora.setAttribute('transform', `rotate(${(8 + minutos / 60) * 30})`);
  const sola = { dx: 0, dy: 0, escala: 1, oscuro: 0, ...e.sola };
  d.capsulaSola.setAttribute(
    'transform',
    `translate(${sola.dx} ${sola.dy}) rotate(${e.balanceo ?? 0} 0 0) scale(${sola.escala})`,
  );
  d.capsulaSola.setAttribute('opacity', String(1 - 0.45 * sola.oscuro));
  d.papel.setAttribute('display', (e.papelEnArmario ?? true) ? 'inline' : 'none');

  // Cápsulas del armario: desplazamiento, escala, giro y opacidad. Las de reposición empiezan ocultas.
  for (const c of d.capsulas) {
    if (c.nodo === d.capsulaSola) continue;
    const k = { dx: 0, dy: 0, escala: 1, rot: 0, opacidad: c.extra ? 0 : 1, ...e.capsulas?.[c.clave] };
    c.nodo.setAttribute('transform', `translate(${k.dx} ${k.dy}) rotate(${k.rot}) scale(${k.escala})`);
    c.nodo.setAttribute('opacity', String(k.opacidad));
  }

  // Hucha: boca, gusto, salto (0..1) y encogido (0..1, pierde volumen al pagar una compra).
  const h = { boca: 0, contenta: 0, salto: 0, encogida: 0, ...e.hucha };
  const aplasta = 0.1 * Math.sin(h.salto * Math.PI * 3) * (1 - h.salto);
  const brinco = -26 * Math.sin(h.salto * Math.PI);
  const hx = (1 + aplasta) * (1 - 0.05 * h.encogida);
  const hy = (1 - aplasta) * (1 - 0.1 * h.encogida);
  d.hucha.setAttribute('transform', `translate(0 ${brinco}) scale(${hx} ${hy})`);
  d.hucha.innerHTML = huchaSvg(h);

  // Taza bajo la cafetera y chorro de café.
  if (e.taza) {
    const tz = { dx: 0, dy: 0, rot: 0, nivel: 0, escala: 1, ...e.taza };
    d.taza.setAttribute(
      'transform',
      `translate(${BANDEJA.x + tz.dx} ${BANDEJA.y + tz.dy}) rotate(${tz.rot}) scale(${tz.escala})`,
    );
    d.taza.innerHTML = tazaSvg({ nivel: tz.nivel });
  } else {
    d.taza.innerHTML = '';
  }
  const chorro = e.chorro ?? 0;
  const fondo = BANDEJA.y - 6 - 46 * (e.taza?.nivel ?? 0);
  d.chorro.setAttribute('height', String(chorro > 0 ? (fondo - BANDEJA.caño) * Math.min(1, chorro * 4) : 0));
}
