// Capsulito por piezas para el corto (plan.md §6). Monta el personaje a partir de los SVG aprobados de
// `static/mascota/svg/` y lo pinta en cada fotograma con `pintar(estado)`, una función sin efectos ocultos:
// el mismo estado produce siempre el mismo dibujo.
//
// Coordenadas: las del lienzo de origen (1185 × 1185). Los pies apoyan en `SUELO`; `CENTRO_X` es el centro.
// Ángulos en grados, con el eje y hacia abajo (90 = hacia abajo). «izq» y «der» son de la vista del espectador.

// Módulo del navegador: ESLint aplica a los .js los globales de Node, así que los del navegador salen de globalThis.
const { document } = globalThis;
const NS = 'http://www.w3.org/2000/svg';

export const SUELO = 1184;
export const CENTRO_X = 650;

/** Articulaciones de reposo (de `articulaciones-pack.json`, pose `saludando`). */
export const ARTICULACIONES = Object.freeze({
  hombroIzq: [369, 704],
  hombroDer: [917, 615],
  caderaIzq: [541, 875],
  caderaDer: [709, 867],
  tobilloIzq: [493, 1028],
  tobilloDer: [756, 1025],
});

const BRAZO = [100, 92];
const PIERNA = [88, 86];
const PIVOTE_TORSO = [650, 900];
const CENTRO_BOCA = [662, 648];

/** Formas de boca 0..7 (ADR-0006) y expresiones sin voz. w: ancho, h: apertura, s: subida de las comisuras. */
export const BOCAS = Object.freeze({
  0: { w: 118, h: 0, s: 14 },
  1: { w: 150, h: 40, s: 14 },
  2: { w: 140, h: 96, s: 8 },
  3: { w: 88, h: 82, s: 0 },
  4: { w: 58, h: 50, s: 0 },
  5: { w: 125, h: 30, s: 8, dientes: 1 },
  6: { w: 120, h: 52, s: 10, lengua: 0.35 },
  7: { w: 100, h: 0, s: 4 },
  feliz: { w: 150, h: 56, s: 24 },
  sonrisa: { w: 130, h: 0, s: 22 },
  sueno: { w: 70, h: 0, s: -2 },
  bostezo: { w: 105, h: 150, s: -4 },
  asombro: { w: 56, h: 58, s: 0 },
});

const rad = (g) => (g * Math.PI) / 180;
const gra = (r) => (r * 180) / Math.PI;
export const lerp = (a, b, t) => a + (b - a) * t;

export function mezclarBocas(a, b, t) {
  return {
    w: lerp(a.w, b.w, t),
    h: lerp(a.h, b.h, t),
    s: lerp(a.s, b.s, t),
    dientes: lerp(a.dientes ?? 0, b.dientes ?? 0, t),
    lengua: lerp(a.lengua ?? 0.65, b.lengua ?? 0.65, t),
  };
}

function nodo(etiqueta, atributos = {}, padre) {
  const n = document.createElementNS(NS, etiqueta);
  for (const [k, v] of Object.entries(atributos)) n.setAttribute(k, String(v));
  padre?.appendChild(n);
  return n;
}

/** Cinemática inversa de dos segmentos. `signo` elige hacia qué lado se dobla la articulación. */
function ik(raiz, objetivo, a, b, signo) {
  const dx = objetivo[0] - raiz[0];
  const dy = objetivo[1] - raiz[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(a - b) + 1), a + b - 0.5);
  const base = Math.atan2(dy, dx);
  const c = Math.acos((a * a + d * d - b * b) / (2 * a * d));
  const ang = base + signo * c;
  const codo = [raiz[0] + a * Math.cos(ang), raiz[1] + a * Math.sin(ang)];
  const fin = [raiz[0] + d * Math.cos(base), raiz[1] + d * Math.sin(base)];
  return { codo, fin };
}

function fk(raiz, a1, a2, a, b) {
  const codo = [raiz[0] + a * Math.cos(rad(a1)), raiz[1] + a * Math.sin(rad(a1))];
  const fin = [codo[0] + b * Math.cos(rad(a1 + a2)), codo[1] + b * Math.sin(rad(a1 + a2))];
  return { codo, fin };
}

/** Curva «de manguera» que pasa por la articulación central. */
function manguera(p0, p1, p2) {
  const cx = 2 * p1[0] - (p0[0] + p2[0]) / 2;
  const cy = 2 * p1[1] - (p0[1] + p2[1]) / 2;
  return `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
}

function crearExtremidad(padre, grosor) {
  const g = nodo('g', {}, padre);
  const comun = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  const borde = nodo('path', { ...comun, stroke: '#3a1c12', 'stroke-width': grosor + 7 }, g);
  const relleno = nodo('path', { ...comun, stroke: '#5c3020', 'stroke-width': grosor }, g);
  const brillo = nodo('path', { ...comun, stroke: '#82513a', 'stroke-width': grosor * 0.28, opacity: 0.55 }, g);
  return {
    g,
    trazar(p0, p1, p2) {
      const d = manguera(p0, p1, p2);
      borde.setAttribute('d', d);
      relleno.setAttribute('d', d);
      brillo.setAttribute('d', d);
    },
  };
}

function rotarPunto(p, angulo, centro) {
  const c = Math.cos(rad(angulo));
  const s = Math.sin(rad(angulo));
  const x = p[0] - centro[0];
  const y = p[1] - centro[1];
  return [centro[0] + x * c - y * s, centro[1] + x * s + y * c];
}

/**
 * Crea Capsulito dentro de `padre` (un `<g>` ya insertado en un `<svg>` visible).
 * `fuentes` son los documentos SVG de las poses `saludando` y `senalando`.
 */
export function crearCapsulito(padre, fuentes, prefijo = 'cap') {
  const { saludando, senalando } = fuentes;
  const pieza = (doc, id) => {
    const original = doc.getElementById(id);
    if (!original) throw new Error(`Falta la pieza ${id}`);
    const copia = original.cloneNode(true);
    copia.removeAttribute('id');
    return copia;
  };

  const raiz = nodo('g', { 'data-personaje': 'capsulito' }, padre);
  const defs = nodo('defs', {}, raiz);
  for (const def of saludando.querySelectorAll('defs > *')) defs.appendChild(def.cloneNode(true));

  const sombra = nodo('ellipse', { cx: CENTRO_X, cy: SUELO - 4, rx: 300, ry: 18, fill: '#704b31', opacity: 0.16 }, raiz);

  const piernaIzq = crearExtremidad(raiz, 40);
  const zapatoIzq = nodo('g', {}, raiz);
  zapatoIzq.appendChild(pieza(saludando, 'zapatilla-izq'));
  const piernaDer = crearExtremidad(raiz, 40);
  const zapatoDer = nodo('g', {}, raiz);
  zapatoDer.appendChild(pieza(saludando, 'zapatilla-der'));

  const torso = nodo('g', {}, raiz);

  const manos = {
    abierta: { doc: saludando, id: 'mano-der', ancla: [1045, 511], dir: -41.7, lado: 'der' },
    puno: { doc: saludando, id: 'mano-izq', ancla: [340, 856], dir: 48.9, lado: 'izq' },
    senalar: { doc: senalando, id: 'mano-der', ancla: [1060, 550], dir: -25.6, lado: 'der' },
  };
  function crearBrazo(lado) {
    const extremidad = crearExtremidad(torso, 38);
    const contenedor = nodo('g', {}, torso);
    const variantes = {};
    for (const [nombre, def] of Object.entries(manos)) {
      const g = nodo('g', { display: 'none' }, contenedor);
      g.appendChild(pieza(def.doc, def.id));
      variantes[nombre] = { g, ...def };
    }
    return { lado, extremidad, variantes };
  }

  // El brazo derecho se crea antes que el cuerpo para quedar detrás; el izquierdo, al final, delante.
  const brazoDer = crearBrazo('der');
  for (const id of ['cuerpo', 'cupula', 'brillo', 'aro']) torso.appendChild(pieza(saludando, id));

  function crearOjo(lado, colorParpado) {
    const g = nodo('g', {}, torso);
    const blanco = pieza(saludando, `ojo-${lado}`);
    g.appendChild(blanco);
    const forma = blanco.querySelector('path');
    const clipId = `${prefijo}-clip-ojo-${lado}`;
    const clip = nodo('clipPath', { id: clipId }, defs);
    clip.appendChild(forma.cloneNode(true));
    const interior = nodo('g', { 'clip-path': `url(#${clipId})` }, g);
    const pupila = nodo('g', {}, interior);
    pupila.appendChild(pieza(saludando, `pupila-${lado}`));
    const parpado = nodo('rect', { fill: colorParpado }, interior);
    const linea = nodo('path', { fill: 'none', stroke: '#4a2214', 'stroke-width': 10, 'stroke-linecap': 'round' }, interior);
    const contorno = forma.cloneNode(true);
    contorno.setAttribute('fill', 'none');
    g.appendChild(contorno);
    const ceja = nodo('g', {}, torso);
    ceja.appendChild(pieza(saludando, `ceja-${lado}`));
    return { lado, g, forma, pupila, parpado, linea, ceja, caja: null, cajaCeja: null };
  }
  const ojos = [crearOjo('izq', '#bf6f3f'), crearOjo('der', '#cc834e')];

  const boca = nodo('g', { transform: `translate(${CENTRO_BOCA[0]} ${CENTRO_BOCA[1]}) rotate(-10)` }, torso);
  const clipBocaId = `${prefijo}-clip-boca`;
  const clipBoca = nodo('clipPath', { id: clipBocaId }, defs);
  const formaClip = nodo('path', {}, clipBoca);
  const bocaHueco = nodo('path', { fill: '#3d1008' }, boca);
  const bocaInterior = nodo('g', { 'clip-path': `url(#${clipBocaId})` }, boca);
  const lengua = nodo('ellipse', { fill: '#f27765' }, bocaInterior);
  const dientes = nodo('rect', { fill: '#fffdf7' }, bocaInterior);
  const labio = nodo('path', { fill: 'none', stroke: '#3d1008', 'stroke-width': 11, 'stroke-linecap': 'round' }, boca);

  const brazoIzq = crearBrazo('izq');

  for (const ojo of ojos) {
    ojo.caja = ojo.forma.getBBox();
    ojo.cajaCeja = ojo.ceja.getBBox();
  }

  function pintarBrazo(brazo, hombro, def) {
    // `estira` alarga el brazo de goma (gag de dibujo animado); por defecto mide lo normal.
    const [a, b] = BRAZO.map((l) => l * (def.estira ?? 1));
    const r = def.ik ? ik(hombro, def.ik, a, b, def.signo ?? 1) : fk(hombro, def.fk[0], def.fk[1], a, b);
    brazo.extremidad.trazar(hombro, r.codo, r.fin);
    const dir = gra(Math.atan2(r.fin[1] - r.codo[1], r.fin[0] - r.codo[0])) + (def.giroMano ?? 0);
    for (const [nombre, v] of Object.entries(brazo.variantes)) {
      if (nombre !== (def.mano ?? 'puno')) {
        v.g.setAttribute('display', 'none');
        continue;
      }
      v.g.setAttribute('display', 'inline');
      const t =
        v.lado === brazo.lado
          ? `translate(${r.fin[0]} ${r.fin[1]}) rotate(${dir - v.dir}) translate(${-v.ancla[0]} ${-v.ancla[1]})`
          : `translate(${r.fin[0]} ${r.fin[1]}) rotate(${dir}) scale(1 -1) rotate(${-v.dir}) translate(${-v.ancla[0]} ${-v.ancla[1]})`;
      v.g.setAttribute('transform', t);
    }
    return r.fin;
  }

  function pintarBoca(f) {
    const { w, h, s } = f;
    const ctrlArriba = s * 0.6 - h * 0.15;
    const arriba = `M${-w / 2} ${-s} Q0 ${ctrlArriba} ${w / 2} ${-s}`;
    const hueco = `${arriba} C${w * 0.42} ${h * 0.9 - s * 0.3} ${-w * 0.42} ${h * 0.9 - s * 0.3} ${-w / 2} ${-s}Z`;
    bocaHueco.setAttribute('d', hueco);
    formaClip.setAttribute('d', hueco);
    labio.setAttribute('d', arriba);
    labio.setAttribute('stroke-width', h > 8 ? 6 : 11);
    const abierta = h > 3;
    bocaInterior.setAttribute('display', abierta ? 'inline' : 'none');
    lengua.setAttribute('cx', 0);
    lengua.setAttribute('cy', h * (f.lengua ?? 0.65));
    lengua.setAttribute('rx', w * 0.3);
    lengua.setAttribute('ry', Math.max(h * 0.36, 1));
    dientes.setAttribute('x', -w * 0.32);
    dientes.setAttribute('y', -s - 4);
    dientes.setAttribute('width', w * 0.64);
    dientes.setAttribute('height', Math.max(h * 0.45, 0) * (f.dientes ?? 0));
  }

  function pintarOjo(ojo, e) {
    const c = ojo.caja;
    const cx = c.x + c.width / 2;
    const cy = c.y + c.height / 2;
    const escala = 1 + 0.12 * (e.asombro ?? 0);
    ojo.g.setAttribute('transform', `translate(${cx} ${cy}) scale(${escala}) translate(${-cx} ${-cy})`);
    const [mx, my] = e.mirada ?? [0, 0];
    const ep = 1 - 0.12 * (e.asombro ?? 0);
    ojo.pupila.setAttribute(
      'transform',
      `translate(${mx * 22} ${my * 18}) translate(${cx} ${cy}) scale(${ep}) translate(${-cx} ${-cy})`,
    );
    const p = Math.min(Math.max(ojo.lado === 'izq' ? e.parpados[0] : e.parpados[1], 0), 1);
    const alto = (c.height + 20) * p;
    ojo.parpado.setAttribute('x', c.x - 10);
    ojo.parpado.setAttribute('y', c.y - 10);
    ojo.parpado.setAttribute('width', c.width + 20);
    ojo.parpado.setAttribute('height', alto);
    if (p > 0.02) {
      const y = Math.min(c.y - 10 + alto, c.y + c.height * 0.86);
      ojo.linea.setAttribute('d', `M${c.x - 6} ${y - 4} Q${cx} ${y + 10 * p} ${c.x + c.width + 6} ${y - 4}`);
      ojo.linea.setAttribute('display', 'inline');
    } else {
      ojo.linea.setAttribute('display', 'none');
    }
    const cc = ojo.cajaCeja;
    const ccx = cc.x + cc.width / 2;
    const ccy = cc.y + cc.height / 2;
    const giro = (e.cejas?.giro ?? 0) * (ojo.lado === 'izq' ? 1 : -1);
    ojo.ceja.setAttribute('transform', `translate(0 ${-(e.cejas?.subida ?? 0)}) rotate(${giro} ${ccx} ${ccy})`);
  }

  /**
   * Estado: x, y (posición de los pies en la escena), escala, incl (grados), bob (unidades hacia arriba),
   * pies { izq, der: { x, y, ang } } (tobillos en coordenadas del personaje), brazos { izq, der },
   * parpados [izq, der] (0 abierto, 1 cerrado), mirada [x, y] (−1..1), cejas { subida, giro }, asombro (0..1),
   * boca (forma de `BOCAS` o mezcla).
   */
  function pintar(e) {
    raiz.setAttribute(
      'transform',
      `translate(${e.x} ${e.y}) scale(${e.escala}) translate(${-CENTRO_X} ${-SUELO})`,
    );
    const bob = e.bob ?? 0;
    const incl = e.incl ?? 0;
    torso.setAttribute('transform', `translate(0 ${-bob}) rotate(${incl} ${PIVOTE_TORSO[0]} ${PIVOTE_TORSO[1]})`);
    const enTorso = (p) => {
      const r = rotarPunto(p, incl, PIVOTE_TORSO);
      return [r[0], r[1] - bob];
    };
    sombra.setAttribute('rx', 300 - bob * 0.8);

    const pies = e.pies ?? {
      izq: { x: ARTICULACIONES.tobilloIzq[0], y: ARTICULACIONES.tobilloIzq[1], ang: 0 },
      der: { x: ARTICULACIONES.tobilloDer[0], y: ARTICULACIONES.tobilloDer[1], ang: 0 },
    };
    const caderaIzq = enTorso(ARTICULACIONES.caderaIzq);
    const caderaDer = enTorso(ARTICULACIONES.caderaDer);
    const rIzq = ik(caderaIzq, [pies.izq.x, pies.izq.y], PIERNA[0], PIERNA[1], -1);
    const rDer = ik(caderaDer, [pies.der.x, pies.der.y], PIERNA[0], PIERNA[1], -1);
    piernaIzq.trazar(caderaIzq, rIzq.codo, rIzq.fin);
    piernaDer.trazar(caderaDer, rDer.codo, rDer.fin);
    const [ax, ay] = ARTICULACIONES.tobilloIzq;
    zapatoIzq.setAttribute(
      'transform',
      `translate(${rIzq.fin[0]} ${rIzq.fin[1]}) rotate(${pies.izq.ang}) scale(-1 1) translate(${-ax} ${-ay})`,
    );
    const [bx, by] = ARTICULACIONES.tobilloDer;
    zapatoDer.setAttribute(
      'transform',
      `translate(${rDer.fin[0]} ${rDer.fin[1]}) rotate(${pies.der.ang}) translate(${-bx} ${-by})`,
    );

    const manoDer = pintarBrazo(brazoDer, ARTICULACIONES.hombroDer, e.brazos?.der ?? { fk: [78, 18] });
    const manoIzq = pintarBrazo(brazoIzq, ARTICULACIONES.hombroIzq, e.brazos?.izq ?? { fk: [102, -16] });
    for (const ojo of ojos) pintarOjo(ojo, { parpados: [0, 0], ...e });
    pintarBoca(e.boca ?? BOCAS.feliz);
    return { manoDer: enTorso(manoDer), manoIzq: enTorso(manoIzq) };
  }

  return { raiz, pintar };
}

/** Ciclo de andar con los pies apoyados: `distancia` recorrida (unidades del personaje) y `peso` 0..1 (0 = quieto). */
export function andar(distancia, { paso = 140, altura = 22, peso = 1 } = {}) {
  const fase = distancia / (2 * paso);
  const pie = (desfase, reposo) => {
    const p = (((fase + desfase) % 1) + 1) % 1;
    let rel;
    let alza = 0;
    let ang = 0;
    if (p < 0.5) {
      rel = paso / 2 - (p / 0.5) * paso;
    } else {
      const q = (p - 0.5) / 0.5;
      const suave = q * q * (3 - 2 * q);
      rel = -paso / 2 + suave * paso;
      alza = Math.sin(Math.PI * q) * altura;
      ang = -Math.sin(Math.PI * q) * 14;
    }
    return { x: reposo[0] + rel * peso, y: reposo[1] - alza * peso, ang: ang * peso };
  };
  return {
    pies: { izq: pie(0, ARTICULACIONES.tobilloIzq), der: pie(0.5, ARTICULACIONES.tobilloDer) },
    bob: Math.abs(Math.sin(2 * Math.PI * fase)) * 9 * peso,
    vaiven: Math.sin(2 * Math.PI * fase) * peso,
  };
}

/** Forma de boca en el instante `t` (s) de una pista de ADR-0006, suavizada con los instantes anteriores. */
export function bocaEnPista(cues, t, reposo = BOCAS[0]) {
  const forma = (u) => {
    const cue = cues.find((c) => u >= c.start && u < c.end);
    return cue ? BOCAS[cue.value] : reposo;
  };
  const a = mezclarBocas(forma(t), forma(t - 0.035), 0.35);
  return mezclarBocas(a, forma(t - 0.07), 0.2);
}

export const suave = (t) => t * t * (3 - 2 * t);
/** Progreso 0..1 entre `t0` y `t1`, suavizado. */
export const tramo = (t, t0, t1) => suave(Math.min(Math.max((t - t0) / (t1 - t0), 0), 1));
