// Piezas comunes de los planos: carga de recursos, capas, cámara, voz por tramos, subtítulos y vista previa.
import { bocaEnPista, crearCapsulito, lerp, tramo } from './capsulito.js';
import { SUELO_ESCENA, crearDecorado } from './decorado.js';

// Módulo del navegador: ESLint aplica a los .js los globales de Node, así que los del navegador salen de globalThis.
const { document, window, location, Audio, DOMParser, requestAnimationFrame } = globalThis;

const NS = 'http://www.w3.org/2000/svg';
/** Escala de Capsulito en la escena (unidades del lienzo de origen → unidades de la escena). */
export const ESCALA = 0.52;

export const pulso = (t, centro, ancho) => Math.max(0, 1 - Math.abs(t - centro) / ancho);
export const parpadeo = (t, instantes) => Math.max(0, ...instantes.map((i) => pulso(t, i, 0.08)));
/** Mezcla dos puntos o listas de números. */
export const mezclar = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));

/** Convierte un punto de la escena a coordenadas del torso de Capsulito. */
export function aTorso(p, x, incl, bob) {
  const cx = 650 + (p[0] - x) / ESCALA;
  const cy = 1184 - (SUELO_ESCENA - p[1]) / ESCALA + bob;
  const a = (-incl * Math.PI) / 180;
  const dx = cx - 650;
  const dy = cy - 900;
  return [650 + dx * Math.cos(a) - dy * Math.sin(a), 900 + dx * Math.sin(a) + dy * Math.cos(a)];
}

/** Convierte un punto del personaje (lienzo de origen) a la escena. */
export const aEscena = (p, x) => [x + (p[0] - 650) * ESCALA, SUELO_ESCENA - (1184 - p[1]) * ESCALA];

/** Encuadre general de los planos 3 a 7: cafetera, hucha, armario y Capsulito enteros. */
export const GENERAL = Object.freeze({ z: 1.15, fx: 600, fy: 1140, sy: 1010 });

/** Crea un grupo SVG dentro de `padre`, opcionalmente antes de `antes`. */
export function grupo(padre, antes = null) {
  const g = document.createElementNS(NS, 'g');
  padre.insertBefore(g, antes);
  return g;
}

/**
 * Coloca un objeto dibujado en unidades del personaje en la mano `p` (coordenadas del personaje) de Capsulito,
 * situado en `x`. `giro` en grados; `visible` falso lo oculta.
 */
export function enMano(g, marcado, p, x, giro = 0, escala = 1, visible = true) {
  if (!visible) {
    g.setAttribute('display', 'none');
    return;
  }
  const [ex, ey] = aEscena(p, x);
  g.setAttribute('display', 'inline');
  g.setAttribute('transform', `translate(${ex} ${ey}) rotate(${giro}) scale(${ESCALA * escala})`);
  g.innerHTML = marcado;
}

/** Punto de una parábola de `a` a `b` con altura `h` sobre la recta, en el avance `q` (0..1). */
export function arco(a, b, h, q) {
  return [lerp(a[0], b[0], q), lerp(a[1], b[1], q) - 4 * h * q * (1 - q)];
}

/**
 * Cámara por claves: `[instante, { z, fx, fy, sy }]`. El punto (fx, fy) de la escena queda en la pantalla en
 * (540, sy) con zoom z. Entre dos claves, el paso es suave.
 */
export function camaraPorClaves(t, claves) {
  let actual = claves[0][1];
  for (let i = 1; i < claves.length; i += 1) {
    const [t0] = claves[i - 1];
    const [t1, siguiente] = claves[i];
    const k = tramo(t, t0, t1);
    actual = Object.fromEntries(Object.keys(actual).map((c) => [c, lerp(actual[c], siguiente[c], k)]));
  }
  const { z, fx, fy, sy } = actual;
  return `translate(540 ${sy}) scale(${z}) translate(${-fx} ${-fy})`;
}

/**
 * Tramos de la locución: `{ desde, hasta, en }` coloca el fragmento [desde, hasta) del audio en el instante `en`
 * del plano. Devuelve el instante del audio que suena en `t`, o `null` en silencio.
 */
export function vozEn(t, tramos) {
  const tr = tramos.find((x) => t >= x.en && t < x.en + (x.hasta - x.desde));
  return tr ? tr.desde + (t - tr.en) : null;
}

const raizArchivos = '../../../..';
const leerSvg = async (ruta) => new DOMParser().parseFromString(await (await fetch(ruta)).text(), 'image/svg+xml');

/** Monta el escenario de un plano y devuelve sus piezas. Llama a `publicar(render)` cuando esté listo. */
export async function montarPlano({ numero, titulo, duracion, tramos }) {
  const [saludando, senalando, pista] = await Promise.all([
    leerSvg(`${raizArchivos}/static/mascota/svg/capsulito-saludando.svg`),
    leerSvg(`${raizArchivos}/static/mascota/svg/capsulito-senalando.svg`),
    fetch(`../audio/locuciones/corto_${numero}.json`).then((r) => r.json()),
  ]);
  const lienzo = document.getElementById('lienzo');
  const camara = document.createElementNS(NS, 'g');
  lienzo.appendChild(camara);
  const decorado = crearDecorado(camara);
  const capa = document.createElementNS(NS, 'g');
  camara.appendChild(capa);
  const capsulito = crearCapsulito(capa, { saludando, senalando });
  const delante = document.createElementNS(NS, 'g');
  camara.appendChild(delante);
  // Rótulos fijos en la pantalla, fuera de la cámara.
  const pantalla = document.createElementNS(NS, 'g');
  lienzo.appendChild(pantalla);
  document.getElementById('titulo').textContent = titulo;
  const subtitulo = document.getElementById('subtitulo');

  const boca = (t, reposo) => {
    const tv = vozEn(t, tramos);
    return tv === null ? reposo : bocaEnPista(pista.cues, tv, reposo);
  };

  function publicar(render) {
    window.render = render;
    window.DURACION = duracion;
    window.VOZ = { archivo: `corto_${numero}.mp3`, tramos };
    const parametros = new URLSearchParams(location.search);
    if (parametros.has('t')) {
      render(Number(parametros.get('t')));
    } else if (!parametros.has('captura')) {
      render(0);
      const boton = document.createElement('button');
      boton.id = 'reproducir';
      boton.textContent = 'Reproducir';
      document.body.appendChild(boton);
      boton.addEventListener('click', () => {
        const inicio = performance.now();
        const sonando = new Set();
        const cuadro = () => {
          const t = (performance.now() - inicio) / 1000;
          for (const tr of tramos) {
            if (t >= tr.en && !sonando.has(tr)) {
              sonando.add(tr);
              const audio = new Audio(`../audio/locuciones/corto_${numero}.mp3`);
              audio.currentTime = tr.desde;
              void audio.play();
              setTimeout(() => audio.pause(), (tr.hasta - tr.desde) * 1000);
            }
          }
          render(Math.min(t, duracion));
          if (t < duracion) requestAnimationFrame(cuadro);
        };
        requestAnimationFrame(cuadro);
      });
    }
    window.listo = true;
  }

  const ponerSubtitulo = (t, lista) => {
    // El montaje final lee la lista para escribir el VTT y la transcripción.
    window.SUBTITULOS = lista;
    subtitulo.textContent = lista.find(([a, b]) => t >= a && t < b)?.[2] ?? '';
  };

  return { camara, decorado, capsulito, capa, delante, pantalla, pista, boca, ponerSubtitulo, publicar };
}
