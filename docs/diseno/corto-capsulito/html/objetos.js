// Objetos del corto, en SVG. Cada función devuelve el marcado de un objeto con su origen indicado, para que los
// planos lo coloquen con una transformación. Sin colores fuera de la paleta Latte del corto.
import { capsulaSvg } from './decorado.js';

/** Lupa demasiado grande. Unidades del personaje; origen en el puño. `ojo` dibuja un ojo gigante tras el cristal. */
export function lupaSvg(ojo = null) {
  let ojoGigante = '';
  if (ojo) {
    const [mx, my] = ojo.mirada ?? [0, 0];
    const parpado = ojo.parpado ?? 0;
    ojoGigante = `<clipPath id="lupa-cristal"><circle cx="0" cy="-270" r="128"/></clipPath>
      <g clip-path="url(#lupa-cristal)">
        <circle cx="0" cy="-270" r="104" fill="#fffdf7" stroke="#bd8057" stroke-width="5"/>
        <circle cx="${mx * 34}" cy="${-270 + my * 30}" r="58" fill="#4a2214"/>
        <circle cx="${mx * 34}" cy="${-270 + my * 30}" r="30" fill="#1e0d07"/>
        <ellipse cx="${mx * 34 + 22}" cy="${-270 + my * 30 - 24}" rx="15" ry="19" fill="#fff"/>
        <rect x="-130" y="-400" width="260" height="${260 * parpado}" fill="#c27843"/>
      </g>`;
  }
  return `<g>
    <rect x="-20" y="-150" width="40" height="160" rx="18" fill="#5b3b2c" stroke="#2b1d14" stroke-width="7"/>
    <rect x="-10" y="-140" width="8" height="130" rx="4" fill="#8a5a3a"/>
    <circle cx="0" cy="-270" r="128" fill="#dfeae6" opacity=".55"/>
    ${ojoGigante}
    <circle cx="0" cy="-270" r="128" fill="none" stroke="#2b1d14" stroke-width="40"/>
    <circle cx="0" cy="-270" r="128" fill="none" stroke="#f4c862" stroke-width="28"/>
    <path d="M-80 -330 Q-60 -370 -14 -380" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" opacity=".8"/>
  </g>`;
}

/** Megáfono diminuto. Unidades del personaje; origen en el puño; apunta hacia la derecha. `ondas` 0..1. */
export function megafonoSvg(ondas = 0) {
  const arcos = [0, 1, 2]
    .map((i) => {
      const q = (ondas * 1.6 - i * 0.25) % 1;
      if (ondas <= 0 || q <= 0) return '';
      const r = 40 + q * 90;
      return `<path d="M${150 + r * 0.4} ${-70 - r} Q${190 + r} -70 ${150 + r * 0.4} ${-70 + r}" fill="none" stroke="#c8962f" stroke-width="12" stroke-linecap="round" opacity="${(1 - q).toFixed(2)}"/>`;
    })
    .join('');
  return `<g>
    <rect x="-16" y="-70" width="32" height="76" rx="12" fill="#5b3b2c" stroke="#2b1d14" stroke-width="6"/>
    <path d="M-40 -100 L130 -150 L130 10 L-40 -40Z" fill="#f4c862" stroke="#2b1d14" stroke-width="8" stroke-linejoin="round"/>
    <ellipse cx="130" cy="-70" rx="26" ry="80" fill="#e6c9a8" stroke="#2b1d14" stroke-width="8"/>
    <rect x="-62" y="-92" width="30" height="46" rx="10" fill="#5b3b2c" stroke="#2b1d14" stroke-width="6"/>
    ${arcos}
  </g>`;
}

/**
 * Hucha con forma de cerdito, mirando a la izquierda. Unidades de la escena; origen en el centro de la base.
 * boca 0..1 (abre la boca para escupir), contenta 0..1 (ojos cerrados de gusto).
 */
export function huchaSvg({ boca = 0, contenta = 0 } = {}) {
  const ojo =
    contenta > 0.5
      ? `<path d="M-42 -86 Q-34 -94 -26 -86" fill="none" stroke="#2b1d14" stroke-width="5" stroke-linecap="round"/>`
      : `<ellipse cx="-34" cy="-86" rx="6" ry="8" fill="#2b1d14"/><circle cx="-32" cy="-89" r="2.5" fill="#fff"/>`;
  return `<g>
    <ellipse cx="0" cy="2" rx="76" ry="9" fill="#2b1d14" opacity=".16"/>
    <rect x="-52" y="-30" width="22" height="32" rx="8" fill="#e09b8b" stroke="#5b3b2c" stroke-width="5"/>
    <rect x="28" y="-30" width="22" height="32" rx="8" fill="#e09b8b" stroke="#5b3b2c" stroke-width="5"/>
    <path d="M70 -70 q22 -6 18 10 q-4 12 -14 2 q-6 -8 6 -14" fill="none" stroke="#5b3b2c" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="0" cy="-66" rx="76" ry="58" fill="#f4b5a4" stroke="#5b3b2c" stroke-width="6"/>
    <ellipse cx="10" cy="-50" rx="48" ry="26" fill="#f8c8ba" opacity=".7"/>
    <path d="M-30 -116 L-16 -142 L4 -114Z" fill="#f4b5a4" stroke="#5b3b2c" stroke-width="6" stroke-linejoin="round"/>
    <rect x="-8" y="-128" width="44" height="10" rx="5" fill="#2b1d14"/>
    ${ojo}
    <ellipse cx="-46" cy="-64" rx="12" ry="7" fill="#ee8f86" opacity=".6"/>
    <ellipse cx="-78" cy="-62" rx="20" ry="24" fill="#f8c8ba" stroke="#5b3b2c" stroke-width="6"/>
    <ellipse cx="-84" cy="-66" rx="3.5" ry="6" fill="#5b3b2c"/><ellipse cx="-72" cy="-66" rx="3.5" ry="6" fill="#5b3b2c"/>
    <ellipse cx="-62" cy="-30" rx="${8 + boca * 10}" ry="${1 + boca * 12}" fill="#5b2a1a" stroke="#5b3b2c" stroke-width="4"/>
  </g>`;
}

/** Moneda con el símbolo del euro. Unidades de la escena; origen en el centro. */
export const monedaSvg = () => `<g>
  <circle r="24" fill="#f4c862" stroke="#8a6a20" stroke-width="5"/>
  <circle r="16" fill="none" stroke="#c8962f" stroke-width="3"/>
  <text y="9" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="24" fill="#8a6a20">€</text>
</g>`;

/** Grano de café. Origen en el centro. */
export const granoSvg = () => `<g>
  <ellipse rx="11" ry="15" fill="#6b3927" stroke="#2b1d14" stroke-width="3"/>
  <path d="M0 -12 Q-5 0 0 12" fill="none" stroke="#2b1d14" stroke-width="3"/>
</g>`;

/** Taza pequeña. Unidades de la escena; origen en el centro de la base. `nivel` 0..1; `fantasma` la dibuja translúcida. */
export function tazaSvg({ nivel = 1, fantasma = false } = {}) {
  const trazo = fantasma ? 'stroke-dasharray="7 6"' : '';
  const opacidad = fantasma ? 0.55 : 1;
  const alto = 46;
  const cafe = nivel > 0 ? `<ellipse cx="0" cy="${-6 - alto * nivel}" rx="${26 - 6 * (1 - nivel)}" ry="6" fill="#6b3927"/>` : '';
  return `<g opacity="${opacidad}">
    <path d="M30 -40 q22 -2 20 14 q-2 14 -22 12" fill="none" stroke="#5b3b2c" stroke-width="6" ${trazo}/>
    <path d="M-34 -${alto + 8} L34 -${alto + 8} L28 -6 Q26 0 18 0 L-18 0 Q-26 0 -28 -6Z" fill="#fcf8f3" stroke="#5b3b2c" stroke-width="5" stroke-linejoin="round" ${trazo}/>
    ${cafe}
    <ellipse cx="0" cy="-${alto + 8}" rx="34" ry="7" fill="none" stroke="#5b3b2c" stroke-width="5" ${trazo}/>
  </g>`;
}

/** Caja de cápsulas. Unidades de la escena; origen en el centro de la base. */
export function cajaSvg(color = '#4b3a8c', claro = '#7564b8') {
  return `<g>
    <ellipse cx="14" cy="2" rx="104" ry="10" fill="#2b1d14" opacity=".16"/>
    <path d="M85 -120 L115 -146 L115 -26 L85 0Z" fill="#b38a58" stroke="#7a5236" stroke-width="5" stroke-linejoin="round"/>
    <path d="M-85 -120 L-55 -146 L115 -146 L85 -120Z" fill="#dcb684" stroke="#7a5236" stroke-width="5" stroke-linejoin="round"/>
    <rect x="-85" y="-120" width="170" height="120" fill="#c9a06e" stroke="#7a5236" stroke-width="5"/>
    <path d="M-70 -133 L100 -133" stroke="#e8cfa6" stroke-width="14"/>
    <rect x="-60" y="-96" width="120" height="72" rx="10" fill="#f5ece1" stroke="#7a5236" stroke-width="3"/>
    <g transform="translate(-30 -34)">${capsulaSvg(color, claro, 0.62)}</g>
    <text x="8" y="-52" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="22" fill="#5b3b2c">×10</text>
  </g>`;
}

/** Medidas del móvil (unidades de la escena) y posición del botón «+1» de la tarjeta, respecto a su origen. */
export const MOVIL = Object.freeze({ ancho: 210, alto: 400, botonMas: [45, -200] });

/**
 * Móvil con la pantalla de Inicio de beCafé, de pie. Origen en el centro de la base.
 * tarjeta: { nombre, color, claro, quedan }; pulsado 0..1 (onda del toque); aviso, nota, detalle: textos o null;
 * cifra: escala del número de «Quedan» (salto al cambiar).
 */
export function movilSvg({ tarjeta, pulsado = 0, aviso = null, nota = null, detalle = null, cifra = 1 }) {
  const { ancho, alto } = MOVIL;
  const x0 = -ancho / 2;
  const y0 = -alto;
  const pantalla = { x: x0 + 12, y: y0 + 34, w: ancho - 24, h: alto - 52 };
  const tx = pantalla.x + 8;
  const ty = pantalla.y + 52;
  const tw = pantalla.w - 16;
  const onda =
    pulsado > 0 && pulsado < 1
      ? `<circle cx="${MOVIL.botonMas[0]}" cy="${MOVIL.botonMas[1]}" r="${10 + 40 * pulsado}" fill="#8a4b22" opacity="${(0.45 * (1 - pulsado)).toFixed(2)}"/>`
      : '';
  const bannerAviso = aviso
    ? `<g transform="translate(${tx} ${ty + 152})">
        <rect width="${tw}" height="58" rx="12" fill="#fff3d6" stroke="#c8962f" stroke-width="3"/>
        <path d="M14 42 L26 18 L38 42Z" fill="#c8962f"/><rect x="24.5" y="26" width="3" height="8" fill="#fff3d6"/><rect x="24.5" y="36" width="3" height="3" fill="#fff3d6"/>
        <text x="46" y="26" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="15" fill="#7d5200">Quedan pocas</text>
        <text x="46" y="45" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#7d5200">${aviso}</text>
      </g>`
    : '';
  const altoNota = detalle ? 66 : 50;
  const notaInferior = nota
    ? `<g transform="translate(${tx} ${pantalla.y + pantalla.h - altoNota - 14})">
        <rect width="${tw}" height="${altoNota}" rx="12" fill="#d5e8d4" stroke="#3f7d55" stroke-width="3"/>
        <path d="M12 ${altoNota / 2} l7 7 l12 -14" fill="none" stroke="#2f5d3a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="36" y="${detalle ? 28 : 32}" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="${nota.length > 12 ? 12.5 : 15}" fill="#2f5d3a">${nota}</text>
        ${detalle ? `<text x="36" y="50" font-family="Inter, system-ui, sans-serif" font-size="14" fill="#2f5d3a">${detalle}</text>` : ''}
      </g>`
    : '';
  return `<g>
    <ellipse cx="0" cy="2" rx="${ancho / 2 + 10}" ry="10" fill="#2b1d14" opacity=".18"/>
    <rect x="${x0}" y="${y0}" width="${ancho}" height="${alto}" rx="30" fill="#2b1d14"/>
    <rect x="${pantalla.x}" y="${pantalla.y - 20}" width="${pantalla.w}" height="${pantalla.h + 26}" rx="20" fill="#fcf8f3"/>
    <rect x="${-30}" y="${y0 + 12}" width="60" height="12" rx="6" fill="#2b1d14"/>
    <text x="${tx}" y="${pantalla.y + 26}" font-family="Georgia, serif" font-weight="800" font-size="26" fill="#2b1d14">beCafé</text>
    <g transform="translate(${tx} ${ty})">
      <rect width="${tw}" height="140" rx="14" fill="#fffdf7" stroke="#e6c9a8" stroke-width="3"/>
      <g transform="translate(30 70)">${capsulaSvg(tarjeta.color, tarjeta.claro, 0.6)}</g>
      <text x="62" y="34" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="19" fill="#2b1d14">${tarjeta.nombre}</text>
      <text x="62" y="58" font-family="Inter, system-ui, sans-serif" font-size="16" fill="#5b3b2c">Quedan <tspan font-weight="800" font-size="${16 * cifra}">${tarjeta.quedan}</tspan></text>
      <rect x="${tw - 72}" y="98" width="64" height="32" rx="16" fill="#8a4b22"/>
      <text x="${tw - 40}" y="120" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="17" fill="#fff">+1</text>
    </g>
    ${onda}
    ${bannerAviso}
    ${notaInferior}
  </g>`;
}
