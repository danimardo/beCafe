// Genera `reposo/scene.rml` a partir de `static/mascota/svg/capsulito-saludando.svg` (F12, RF-248, research R11).
// Uso, desde la raíz: node docs/diseno/f12/rive/generar-reposo.mjs
// Derivado de `docs/diseno/f11/rive/generar-entrada.mjs`: mismo rig (ojos, cejas, boca, brazos, zapatillas), animaciones y máquina nuevas.
// El SVG usa solo M, L, C y Z; cada grupo con `id` pasa a un nodo de Rive y cada trazo a un `PointsPath` con vértices cúbicos.
import { readFileSync, writeFileSync } from 'node:fs';

const ORIGEN = 'static/mascota/svg/capsulito-saludando.svg';
const DESTINO = 'docs/diseno/f12/rive/reposo/scene.rml';
const svg = readFileSync(ORIGEN, 'utf8');

// ---------- ids ----------
let contador = 100;
const nuevoId = () => `0:${contador++}`;
const ids = new Map();
const idDe = (nombre) => {
	if (!ids.has(nombre)) ids.set(nombre, nuevoId());
	return ids.get(nombre);
};

// ---------- SVG ----------
const degradados = new Map();
for (const m of svg.matchAll(/<linearGradient id="([^"]+)"([^>]*)>([\s\S]*?)<\/linearGradient>/g)) {
	const atributo = (nombre, defecto) => Number(new RegExp(`${nombre}="([^"]+)"`).exec(m[2])?.[1] ?? defecto);
	const paradas = [...m[3].matchAll(/<stop([^>]*)\/>/g)].map((p) => ({
		color: /stop-color="([^"]+)"/.exec(p[1])?.[1] ?? '#000',
		posicion: Number(/offset="([^"]+)"/.exec(p[1])?.[1] ?? 0),
	}));
	degradados.set(m[1], { x1: atributo('x1', 0), y1: atributo('y1', 0), x2: atributo('x2', 1), y2: atributo('y2', 0), paradas });
}

const hex = (color, opacidad = 1) => {
	let c = color.replace('#', '');
	if (c.length === 3) c = [...c].map((x) => x + x).join('');
	const a = Math.round(opacidad * 255).toString(16).padStart(2, '0');
	return `${a}${c}`.toUpperCase();
};

function trozos(d) {
	// Lista de subtrazados: { cerrado, vertices: [{x,y,entra:[dx,dy],sale:[dx,dy]}] }
	const numeros = (texto) => [...texto.matchAll(/-?\d*\.?\d+(?:e-?\d+)?/gi)].map((n) => Number(n[0]));
	const subtrazados = [];
	let actual = null;
	for (const [, orden, resto] of d.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
		const n = numeros(resto);
		if (orden === 'M') {
			actual = { cerrado: false, vertices: [{ x: n[0], y: n[1], entra: [0, 0], sale: [0, 0] }] };
			subtrazados.push(actual);
		} else if (orden === 'L') {
			actual.vertices.push({ x: n[0], y: n[1], entra: [0, 0], sale: [0, 0] });
		} else if (orden === 'C') {
			const previo = actual.vertices.at(-1);
			previo.sale = [n[0] - previo.x, n[1] - previo.y];
			actual.vertices.push({ x: n[4], y: n[5], entra: [n[2] - n[4], n[3] - n[5]], sale: [0, 0] });
		} else if (orden === 'Z') {
			actual.cerrado = true;
			const primero = actual.vertices[0];
			const ultimo = actual.vertices.at(-1);
			if (actual.vertices.length > 1 && Math.hypot(ultimo.x - primero.x, ultimo.y - primero.y) < 0.01) {
				primero.entra = ultimo.entra;
				actual.vertices.pop();
			}
		}
	}
	return subtrazados;
}

function cajaDe(subtrazados) {
	const puntos = [];
	for (const s of subtrazados) {
		const v = s.vertices;
		for (let i = 0; i < v.length; i++) {
			const a = v[i];
			const b = v[(i + 1) % v.length];
			if (i === v.length - 1 && !s.cerrado) break;
			for (let t = 0; t <= 1; t += 0.05) {
				const c1 = [a.x + a.sale[0], a.y + a.sale[1]];
				const c2 = [b.x + b.entra[0], b.y + b.entra[1]];
				const u = 1 - t;
				puntos.push([
					u ** 3 * a.x + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * b.x,
					u ** 3 * a.y + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * b.y,
				]);
			}
		}
	}
	const xs = puntos.map((p) => p[0]);
	const ys = puntos.map((p) => p[1]);
	return { x: Math.min(...xs), y: Math.min(...ys), ancho: Math.max(...xs) - Math.min(...xs), alto: Math.max(...ys) - Math.min(...ys) };
}

const redondear = (n) => Number(n.toFixed(2));

function pintura(color, opacidad, caja, dx, dy) {
	if (color.startsWith('url(')) {
		const g = degradados.get(/#([^)]+)/.exec(color)[1]);
		const x = (f) => redondear(caja.x + f * caja.ancho - dx);
		const y = (f) => redondear(caja.y + f * caja.alto - dy);
		const paradas = g.paradas.map((p) => `<GradientStop colorValue="${hex(p.color)}" position="${p.posicion}"/>`).join('');
		return `<LinearGradient startX="${x(g.x1)}" startY="${y(g.y1)}" endX="${x(g.x2)}" endY="${y(g.y2)}">${paradas}</LinearGradient>`;
	}
	return `<SolidColor colorValue="${hex(color, opacidad)}"/>`;
}

function formaDePath(atributos, dx, dy, nombre) {
	const d = /\sd="([^"]+)"/.exec(atributos)[1];
	const relleno = /fill="([^"]+)"/.exec(atributos)?.[1] ?? '#000';
	const trazo = /stroke="([^"]+)"/.exec(atributos)?.[1];
	const grosor = Number(/stroke-width="([^"]+)"/.exec(atributos)?.[1] ?? 1);
	const extremo = /stroke-linecap="round"/.test(atributos) ? ' cap="round" join="round"' : '';
	const opacidad = Number(/opacity="([^"]+)"/.exec(atributos)?.[1] ?? 1);
	const sub = trozos(d);
	const caja = cajaDe(sub);
	const caminos = sub
		.map((s) => {
			let area = 0;
			s.vertices.forEach((v, i) => {
				const w = s.vertices[(i + 1) % s.vertices.length];
				area += v.x * w.y - w.x * v.y;
			});
			const vertices = s.vertices
				.map((v) => {
					const x = redondear(v.x - dx);
					const y = redondear(v.y - dy);
					if (v.entra.every((c) => c === 0) && v.sale.every((c) => c === 0)) return `<StraightVertex x="${x}" y="${y}"/>`;
					const rot = (c) => redondear(Math.atan2(c[1], c[0]));
					const dist = (c) => redondear(Math.hypot(c[0], c[1]));
					return `<CubicDetachedVertex x="${x}" y="${y}" inRotation="${rot(v.entra)}" inDistance="${dist(v.entra)}" outRotation="${rot(v.sale)}" outDistance="${dist(v.sale)}"/>`;
				})
				.join('');
			return `<PointsPath isClosed="${s.cerrado}" isClockwise="${area > 0}">${vertices}</PointsPath>`;
		})
		.join('');
	const rellenoXml = relleno === 'none' ? '' : `<Fill>${pintura(relleno, opacidad, caja, dx, dy)}</Fill>`;
	const trazoXml = trazo ? `<Stroke thickness="${grosor}"${extremo}>${pintura(trazo, 1, caja, dx, dy)}</Stroke>` : '';
	return `<Shape name="${nombre}">${caminos}${rellenoXml}${trazoXml}</Shape>`;
}

function formaDeElipse(atributos, dx, dy, nombre) {
	const n = (campo) => Number(new RegExp(`${campo}="([^"]+)"`).exec(atributos)[1]);
	const relleno = /fill="([^"]+)"/.exec(atributos)?.[1] ?? '#000';
	const opacidad = Number(/opacity="([^"]+)"/.exec(atributos)?.[1] ?? 1);
	const giro = /rotate\((-?[\d.]+)/.exec(atributos);
	const rotacion = giro ? ` rotation="${redondear((Number(giro[1]) * Math.PI) / 180)}"` : '';
	return `<Shape name="${nombre}" x="${redondear(n('cx') - dx)}" y="${redondear(n('cy') - dy)}"${rotacion}><Ellipse originX="0.5" originY="0.5" width="${n('rx') * 2}" height="${n('ry') * 2}"/><Fill><SolidColor colorValue="${hex(relleno, opacidad)}"/></Fill></Shape>`;
}

// Piezas del SVG por id de grupo: { pivote, formas(dx,dy) }.
const piezas = new Map();
for (const m of svg.matchAll(/<g id="([^"]+)"( data-pivot="([\d.]+) ([\d.]+)")?>([\s\S]*?)<\/g>/g)) {
	if (m[1] === 'personaje') continue;
	piezas.set(m[1], { pivote: m[3] ? [Number(m[3]), Number(m[4])] : [0, 0], cuerpo: m[5] });
}

function formas(id, dx, dy) {
	const { cuerpo } = piezas.get(id);
	let i = 0;
	const lista = [];
	for (const e of cuerpo.matchAll(/<(path|ellipse)([^>]*)\/>/g)) {
		const nombre = `${id}-${i++}`;
		lista.push(e[1] === 'path' ? formaDePath(e[2], dx, dy, nombre) : formaDeElipse(e[2], dx, dy, nombre));
	}
	// El SVG pinta de atrás adelante; Rive, de delante atrás.
	return lista.reverse().join('\n');
}

/** Nodo de una pieza, con su pivote como origen. `hijos` se colocan delante de las formas. */
function pieza(id, { nombre = id, x, y, extra = '', antes = '' } = {}) {
	const [px, py] = piezas.get(id).pivote;
	const posicion = x === undefined ? { x: px, y: py } : { x, y };
	return `<Node name="${nombre}" id="${idDe(nombre)}" x="${posicion.x}" y="${posicion.y}">\n${antes}${formas(id, px, py)}\n${extra}</Node>`;
}

// ---------- rig ----------
const OJO_IZQ = [522, 515];
const OJO_DER = [760, 465];
const BOCA = [660, 650];
const CEJA_IZQ = [470, 380];
const CEJA_DER = [745, 300];

function ojo(lado, centro) {
	const nombreOjo = `ojo-${lado}`;
	const nombrePupila = `pupila-${lado}`;
	const [cx, cy] = centro;
	return `<Node name="Parpadeo-${lado}" id="${idDe(`Parpadeo-${lado}`)}" x="${cx}" y="${cy}">
<Node name="Mirar-${lado}" id="${idDe(`Mirar-${lado}`)}">
<Node name="${nombrePupila}">\n${formas(nombrePupila, cx, cy)}\n</Node>
</Node>
<Node name="${nombreOjo}">\n${formas(nombreOjo, cx, cy)}\n</Node>
</Node>`;
}

function ceja(lado, centro) {
	const [cx, cy] = centro;
	return `<Node name="Ceja-${lado}" id="${idDe(`Ceja-${lado}`)}" x="${cx}" y="${cy}">\n${formas(`ceja-${lado}`, cx, cy)}\n</Node>`;
}

function brazo(lado, prefijo = '', opacidad = 1) {
	const [hx, hy] = piezas.get(`mano-${lado}`).pivote;
	const [sx, sy] = piezas.get(`brazo-${lado}`).pivote;
	const n = `${prefijo}${lado}`;
	const mano = `<Node name="${prefijo ? 'TapaMano' : 'Mano'}-${lado}" id="${idDe(`${prefijo ? 'TapaMano' : 'Mano'}-${lado}`)}" x="${hx - sx}" y="${hy - sy}">\n${formas(`mano-${lado}`, hx, hy)}\n</Node>`;
	return `<Node name="${prefijo || 'Brazo-'}${prefijo ? lado : lado}" id="${idDe(`${prefijo || 'Brazo-'}${lado}`)}" x="${sx}" y="${sy}" opacity="${opacidad}">\n${mano}\n<Node name="forma-${n}">\n${formas(`brazo-${lado}`, sx, sy)}\n</Node>\n</Node>`;
}

const COLOR_BRAZO = 'FF5A3020';
const antebrazo = (nombre, puntos) =>
	`<Shape name="${nombre}"><PointsPath isClosed="false" isClockwise="true">${puntos.map(([x, y]) => `<StraightVertex x="${x}" y="${y}" radius="30"/>`).join('')}</PointsPath><Stroke thickness="46" cap="round" join="round"><SolidColor colorValue="${COLOR_BRAZO}"/></Stroke></Shape>`;

/** Bostezo con la mano (gesto `bostezoMano`, RF-259): el brazo izquierdo sube y la mano tapa la parte baja de la boca muy abierta. */
const MANO_BOSTEZO = [655, 770];
function bostezoConMano() {
	const [hx, hy] = piezas.get('mano-der').pivote;
	const trazo = antebrazo('Antebrazo-bostezo', [[372, 705], [380, 835], [545, 850], [MANO_BOSTEZO[0] - 40, MANO_BOSTEZO[1] + 45]]);
	const mano = `<Node name="ManoBostezo" id="${idDe('ManoBostezo')}" x="${MANO_BOSTEZO[0]}" y="${MANO_BOSTEZO[1]}" scaleX="-0.95" scaleY="0.95" rotation="0">\n${formas('mano-der', hx, hy)}\n</Node>`;
	return `<Node name="BostezoMano" id="${idDe('BostezoMano')}" opacity="0">\n${mano}\n${trazo}\n</Node>`;
}

/**
 * Tocar el reloj (gesto `tocarReloj`, RF-259): el brazo izquierdo muestra un reloj de muñeca y la otra mano lo golpea con prisa.
 * El brazo que golpea es un nodo rígido que gira desde el hombro: el giro mueve la mano arriba y abajo sobre el reloj.
 */
const RELOJ = [545, 805];
function relojDeMuneca() {
	const trazo = antebrazo('Antebrazo-reloj', [[372, 705], [385, 800], [RELOJ[0] - 40, RELOJ[1]]]);
	const puno = `<Shape name="Puno" x="${RELOJ[0] + 62}" y="${RELOJ[1] + 2}"><Ellipse originX="0.5" originY="0.5" width="64" height="58"/><Fill><SolidColor colorValue="FF4B2A1B"/></Fill></Shape>`;
	const correa = `<Shape name="Correa" x="${RELOJ[0]}" y="${RELOJ[1]}"><Rectangle originX="0.5" originY="0.5" width="46" height="84" cornerRadiusTL="12" cornerRadiusTR="12" cornerRadiusBL="12" cornerRadiusBR="12"/><Fill><SolidColor colorValue="FF2B1D14"/></Fill></Shape>`;
	const esfera = `<Shape name="Esfera" x="${RELOJ[0]}" y="${RELOJ[1]}"><Ellipse originX="0.5" originY="0.5" width="84" height="84"/><Fill><SolidColor colorValue="FFFFF3D6"/></Fill><Stroke thickness="9"><SolidColor colorValue="FF2B1D14"/></Stroke></Shape>`;
	const agujas = `<Shape name="Agujas" x="${RELOJ[0]}" y="${RELOJ[1]}"><PointsPath isClosed="false" isClockwise="true"><StraightVertex x="0" y="-26"/><StraightVertex x="0" y="0"/><StraightVertex x="19" y="10"/></PointsPath><Stroke thickness="7" cap="round" join="round"><SolidColor colorValue="FF2B1D14"/></Stroke></Shape>`;
	// El brazo derecho que golpea: del hombro al codo y del codo a la mano, que cae sobre el reloj.
	const [sx, sy] = piezas.get('brazo-der').pivote;
	const [hx, hy] = piezas.get('mano-der').pivote;
	const codo = [820, 870];
	const punta = [RELOJ[0] + 6, RELOJ[1] - 78];
	const rel = ([x, y]) => [x - sx, y - sy];
	const manoToque = `<Node name="ManoToque" x="${rel(punta)[0]}" y="${rel(punta)[1]}" rotation="2.7" scaleX="0.85" scaleY="0.85">\n${formas('mano-der', hx, hy)}\n</Node>`;
	const brazoToque = `<Node name="ToqueBrazo" id="${idDe('ToqueBrazo')}" x="${sx}" y="${sy}" opacity="0">\n${manoToque}\n${antebrazo('Brazo-toque', [[0, 0], rel(codo), rel(punta)])}\n</Node>`;
	return `${brazoToque}\n<Node name="TocarReloj" id="${idDe('TocarReloj')}" opacity="0">\n${agujas}\n${esfera}\n${correa}\n${puno}\n${trazo}\n</Node>`;
}

/** La zapatilla derecha gira con la pierna, desde la cadera, para que el pie golpee el suelo sin separarse de ella. */
function zapatillaDerecha() {
	const [px, py] = piezas.get('pierna-der').pivote;
	const [zx, zy] = piezas.get('zapatilla-der').pivote;
	return `<Node name="PieDerFrente" id="${idDe('PieDerFrente')}" x="${px}" y="${py}">\n<Node name="zapatilla-der" x="${zx - px}" y="${zy - py}">\n${formas('zapatilla-der', zx, zy)}\n</Node>\n</Node>`;
}

const boca = `<Node name="Boca" id="${idDe('Boca')}" x="${BOCA[0]}" y="${BOCA[1]}">\n${formas('boca', BOCA[0], BOCA[1])}\n</Node>`;

// De delante atrás.
const figura = [
	bostezoConMano(),
	relojDeMuneca(),
	brazo('izq'),
	pieza('zapatilla-izq'),
	zapatillaDerecha(),
	boca,
	ceja('izq', CEJA_IZQ),
	ceja('der', CEJA_DER),
	ojo('der', OJO_DER),
	ojo('izq', OJO_IZQ),
	pieza('aro', { x: 0, y: 0 }),
	pieza('brillo', { x: 0, y: 0 }),
	pieza('cupula', { x: 0, y: 0 }),
	pieza('cuerpo', { x: 0, y: 0 }),
	brazo('der'),
	pieza('pierna-der', { nombre: 'PiernaDer' }),
	pieza('pierna-izq'),
	pieza('sombra', { x: 0, y: 0 }),
].join('\n');

// ---------- animaciones (60 fotogramas por segundo) ----------
const PROPIEDAD = { x: 13, y: 14, rotacion: 15, escalaX: 16, escalaY: 17, opacidad: 18 };
const animaciones = [];
function animacion(nombre, duracion, bucle, claves) {
	const id = nuevoId();
	ids.set(`anim:${nombre}`, id);
	const objetos = Object.entries(claves)
		.map(([nodo, propiedades]) => {
			const props = Object.entries(propiedades)
				.map(([propiedad, fotogramas]) => {
					const marcos = fotogramas
						.map(([cuadro, valor]) => `<KeyFrameDouble value="${redondear(valor)}" interpolationType="linear"${cuadro ? ` frame="${cuadro}"` : ''}/>`)
						.join('');
					return `<KeyedProperty propertyKey="${PROPIEDAD[propiedad]}">${marcos}</KeyedProperty>`;
				})
				.join('');
			return `<KeyedObject objectId="${idDe(nodo)}">${props}</KeyedObject>`;
		})
		.join('\n');
	animaciones.push(`<LinearAnimation duration="${duracion}" loopValue="${bucle}" name="${nombre}" id="${id}">\n${objetos}\n</LinearAnimation>`);
	return id;
}
const anim = (nombre) => ids.get(`anim:${nombre}`);

// Capa Parpadeo: bucle de 3 s (180 fotogramas) con la respiración y un parpadeo al final.
const PARPADEO = 180;
const parpadeo = { escalaY: [[0, 1], [PARPADEO - 12, 1], [PARPADEO - 7, 0.08], [PARPADEO - 2, 1], [PARPADEO, 1]] };
animacion('parpadeo', PARPADEO, 'loop', {
	Respira: { y: [[0, 0], [PARPADEO / 2, -6], [PARPADEO, 0]] },
	'Parpadeo-izq': parpadeo,
	'Parpadeo-der': parpadeo,
});
animacion('quieto', 1, 'oneShot', {
	Respira: { y: [[0, 0]] },
	'Parpadeo-izq': { escalaY: [[0, 1]] },
	'Parpadeo-der': { escalaY: [[0, 1]] },
});

// Capa Gesto. `neutro` devuelve a su sitio todo lo que mueven los gestos, salvo la respiración y los párpados, que son de la capa Parpadeo.
const caraNeutra = {
	'Mirar-izq': { x: [[0, 0]], y: [[0, 0]] },
	'Mirar-der': { x: [[0, 0]], y: [[0, 0]] },
	'Ceja-izq': { rotacion: [[0, 0]], y: [[0, CEJA_IZQ[1]]] },
	'Ceja-der': { rotacion: [[0, 0]], y: [[0, CEJA_DER[1]]] },
	Boca: { escalaX: [[0, 1]], escalaY: [[0, 1]], y: [[0, BOCA[1]]] },
	PiernaDer: { rotacion: [[0, 0]], y: [[0, piezas.get('pierna-der').pivote[1]]] },
	PieDerFrente: { rotacion: [[0, 0]], y: [[0, piezas.get('pierna-der').pivote[1]]] },
	BostezoMano: { opacidad: [[0, 0]] },
	TocarReloj: { opacidad: [[0, 0]] },
	ToqueBrazo: { opacidad: [[0, 0]], rotacion: [[0, 0]] },
	'Brazo-izq': { opacidad: [[0, 1]] },
	'Brazo-der': { opacidad: [[0, 1]] },
};
animacion('neutro', 1, 'oneShot', caraNeutra);

// mirarLados (1,2 s): las pupilas van a la izquierda, a la derecha y vuelven al centro.
animacion('mirarLados', 72, 'oneShot', {
	'Mirar-izq': { x: [[0, 0], [14, -20], [30, -20], [50, 30], [62, 30], [72, 0]] },
	'Mirar-der': { x: [[0, 0], [14, -2], [30, -2], [50, 40], [62, 40], [72, 0]] },
});

// pie (1,2 s): la pierna derecha se levanta y golpea el suelo tres veces; las cejas bajan un poco (impaciencia).
const HUECO = piezas.get('pierna-der').pivote[1];
const golpes = (alto, giro) => ({
	rotacion: [[0, 0], [8, giro], [16, 0], [28, giro], [36, 0], [48, giro], [56, 0], [72, 0]],
	y: [[0, HUECO], [8, HUECO - alto], [16, HUECO], [28, HUECO - alto], [36, HUECO], [48, HUECO - alto], [56, HUECO], [72, HUECO]],
});
animacion('pie', 72, 'oneShot', {
	PiernaDer: golpes(14, 0.16),
	PieDerFrente: golpes(14, 0.16),
	'Mirar-izq': { y: [[0, 0], [10, 12], [62, 12], [72, 0]] },
	'Mirar-der': { y: [[0, 0], [10, 12], [62, 12], [72, 0]] },
	'Ceja-izq': { rotacion: [[0, 0], [10, -0.2], [62, -0.2], [72, 0]] },
	'Ceja-der': { rotacion: [[0, 0], [10, 0.2], [62, 0.2], [72, 0]] },
});

// bostezoMano (1,8 s): el brazo izquierdo sube y la mano tapa la parte baja de la boca, que se abre mucho; los ojos se entornan.
animacion('bostezoMano', 108, 'oneShot', {
	BostezoMano: { opacidad: [[0, 0], [8, 1], [96, 1], [102, 0], [108, 0]] },
	'Brazo-izq': { opacidad: [[0, 1], [8, 0], [96, 0], [102, 1], [108, 1]] },
	Boca: {
		escalaX: [[0, 1], [30, 1.25], [84, 1.25], [108, 1]],
		escalaY: [[0, 1], [30, 2.3], [84, 2.3], [108, 1]],
		y: [[0, BOCA[1]], [30, BOCA[1] + 16], [84, BOCA[1] + 16], [108, BOCA[1]]],
	},
	'Parpadeo-izq': { escalaY: [[0, 1], [14, 0.12], [90, 0.12], [108, 1]] },
	'Parpadeo-der': { escalaY: [[0, 1], [14, 0.12], [90, 0.12], [108, 1]] },
	'Ceja-izq': { y: [[0, CEJA_IZQ[1]], [30, CEJA_IZQ[1] - 16], [84, CEJA_IZQ[1] - 16], [108, CEJA_IZQ[1]]] },
	'Ceja-der': { y: [[0, CEJA_DER[1]], [30, CEJA_DER[1] - 16], [84, CEJA_DER[1] - 16], [108, CEJA_DER[1]]] },
	Respira: { y: [[0, 0], [36, -10], [84, -10], [108, 0]] },
});

// tocarReloj (2 s): muestra el reloj de la muñeca izquierda, mira hacia él y lo golpea cuatro veces con la otra mano; al final
// mira al frente con las cejas fruncidas («venga, que es para hoy»).
const REPOSO_TOQUE = 0.22;
const toques = [32, 50, 68, 86];
const golpeo = [[0, REPOSO_TOQUE], [10, REPOSO_TOQUE]];
for (const cuadro of toques) golpeo.push([cuadro, REPOSO_TOQUE], [cuadro + 5, 0], [cuadro + 11, REPOSO_TOQUE]);
golpeo.push([106, REPOSO_TOQUE], [112, REPOSO_TOQUE], [120, REPOSO_TOQUE]);
animacion('tocarReloj', 120, 'oneShot', {
	TocarReloj: { opacidad: [[0, 0], [8, 1], [108, 1], [114, 0], [120, 0]] },
	ToqueBrazo: { opacidad: [[0, 0], [8, 1], [108, 1], [114, 0], [120, 0]], rotacion: golpeo },
	'Brazo-izq': { opacidad: [[0, 1], [8, 0], [108, 0], [114, 1], [120, 1]] },
	'Brazo-der': { opacidad: [[0, 1], [8, 0], [108, 0], [114, 1], [120, 1]] },
	'Mirar-izq': { x: [[0, 0], [12, -20], [96, -20], [102, 0], [120, 0]], y: [[0, 0], [12, 18], [96, 18], [102, -6], [120, 0]] },
	'Mirar-der': { x: [[0, 0], [12, -2], [96, -2], [102, 0], [120, 0]], y: [[0, 0], [12, 18], [96, 18], [102, -6], [120, 0]] },
	'Ceja-izq': { rotacion: [[0, 0], [12, -0.3], [108, -0.3], [120, 0]] },
	'Ceja-der': { rotacion: [[0, 0], [12, 0.3], [108, 0.3], [120, 0]] },
	Boca: { escalaX: [[0, 1], [12, 0.75], [108, 0.75], [120, 1]], escalaY: [[0, 1], [12, 0.3], [108, 0.3], [120, 1]], y: [[0, BOCA[1]], [12, BOCA[1] + 8], [108, BOCA[1] + 8], [120, BOCA[1]]] },
});

// bostezo (2 s): la boca se abre mucho, los ojos se cierran (sin parpadeo) y la figura se estira.
animacion('bostezo', 120, 'oneShot', {
	Boca: {
		escalaX: [[0, 1], [30, 0.85], [90, 0.85], [120, 1]],
		escalaY: [[0, 1], [30, 2.4], [90, 2.4], [120, 1]],
		y: [[0, BOCA[1]], [30, BOCA[1] + 18], [90, BOCA[1] + 18], [120, BOCA[1]]],
	},
	'Parpadeo-izq': { escalaY: [[0, 1], [14, 0.08], [100, 0.08], [120, 1]] },
	'Parpadeo-der': { escalaY: [[0, 1], [14, 0.08], [100, 0.08], [120, 1]] },
	'Ceja-izq': { y: [[0, CEJA_IZQ[1]], [30, CEJA_IZQ[1] - 14], [90, CEJA_IZQ[1] - 14], [120, CEJA_IZQ[1]]] },
	'Ceja-der': { y: [[0, CEJA_DER[1]], [30, CEJA_DER[1] - 14], [90, CEJA_DER[1] - 14], [120, CEJA_DER[1]]] },
	Respira: { y: [[0, 0], [40, -14], [90, -14], [120, 0]] },
});

// ---------- máquina de estados ----------
// Entradas como propiedades del ViewModel `Reposo` (las entradas de la máquina de estados están en desuso).
const VM = '0:40';
const propiedades = {
	mirarLados: '0:41',
	pie: '0:42',
	bostezoMano: '0:43',
	tocarReloj: '0:48',
	bostezo: '0:44',
	cancelar: '0:45',
	reducedMotion: '0:47',
};
const ruta = (nombre) => `${VM}-${propiedades[nombre]}`;
const condicionBooleana = (nombre, valor) =>
	`<TransitionViewModelCondition><TransitionPropertyViewModelComparator><BindablePropertyBoolean><DataBindContext sourcePathIds="${ruta(nombre)}" propertyKey="634"/></BindablePropertyBoolean></TransitionPropertyViewModelComparator><TransitionValueBooleanComparator value="${valor}"/></TransitionViewModelCondition>`;
const condicionDisparador = (nombre) =>
	`<TransitionViewModelCondition><TransitionPropertyViewModelComparator><BindablePropertyTrigger><DataBindContext sourcePathIds="${ruta(nombre)}" propertyKey="686"/></BindablePropertyTrigger></TransitionPropertyViewModelComparator><TransitionValueTriggerComparator/></TransitionViewModelCondition>`;

// Capa Parpadeo: parpadeo en bucle; quieto con movimiento reducido.
const idParpadea = nuevoId();
const idQuieto = nuevoId();
const capaParpadeo = `<StateMachineLayer name="Parpadeo" id="${nuevoId()}">
<AnyState x="200" y="-160"/>
<ExitState x="400" y="-160"/>
<EntryState><StateTransition stateToId="${idParpadea}"/></EntryState>
<AnimationState x="200" y="0" animationId="${anim('parpadeo')}" id="${idParpadea}"><StateTransition stateToId="${idQuieto}" duration="150">${condicionBooleana('reducedMotion', true)}</StateTransition></AnimationState>
<AnimationState x="400" y="0" animationId="${anim('quieto')}" id="${idQuieto}"><StateTransition stateToId="${idParpadea}" duration="150">${condicionBooleana('reducedMotion', false)}</StateTransition></AnimationState>
</StateMachineLayer>`;

// Capa Gesto: cada disparador lanza su gesto; al terminar vuelve a `neutro`. `cancelar` vuelve a `neutro` de inmediato.
const idNeutro = nuevoId();
const GESTOS = ['mirarLados', 'pie', 'bostezoMano', 'tocarReloj', 'bostezo'];
const idGesto = Object.fromEntries(GESTOS.map((g) => [g, nuevoId()]));
const desdeCualquiera = GESTOS.map((g) => `<StateTransition stateToId="${idGesto[g]}" duration="120">${condicionDisparador(g)}</StateTransition>`).join('\n');
const cancelar = `<StateTransition stateToId="${idNeutro}" duration="100">${condicionDisparador('cancelar')}</StateTransition>`;
const estadosGesto = GESTOS.map(
	(g, i) =>
		`<AnimationState x="${400 + i * 200}" y="0" animationId="${anim(g)}" id="${idGesto[g]}"><StateTransition stateToId="${idNeutro}" duration="200" enableExitTime="true" exitTimeIsPercetange="true" exitTime="100"/></AnimationState>`,
).join('\n');
const capaGesto = `<StateMachineLayer name="Gesto" id="${nuevoId()}">
<AnyState x="200" y="-160">
${cancelar}
${desdeCualquiera}
</AnyState>
<ExitState x="1400" y="-160"/>
<EntryState><StateTransition stateToId="${idNeutro}"/></EntryState>
<AnimationState x="200" y="0" animationId="${anim('neutro')}" id="${idNeutro}"/>
${estadosGesto}
</StateMachineLayer>`;

const maquina = `<StateMachine name="Reposo" id="0:7">
${capaParpadeo}
${capaGesto}
</StateMachine>`;

const modeloDatos = `<ViewModel defaultInstanceId="0:46" name="Reposo" id="${VM}">
<ViewModelPropertyTrigger name="mirarLados" id="${propiedades.mirarLados}"/>
<ViewModelPropertyTrigger name="pie" id="${propiedades.pie}"/>
<ViewModelPropertyTrigger name="bostezoMano" id="${propiedades.bostezoMano}"/>
<ViewModelPropertyTrigger name="tocarReloj" id="${propiedades.tocarReloj}"/>
<ViewModelPropertyTrigger name="bostezo" id="${propiedades.bostezo}"/>
<ViewModelPropertyTrigger name="cancelar" id="${propiedades.cancelar}"/>
<ViewModelPropertyBoolean name="reducedMotion" id="${propiedades.reducedMotion}"/>
<ViewModelInstance exports="true" name="Default" id="0:46">
<ViewModelInstanceTrigger viewModelPropertyId="${propiedades.mirarLados}"/>
<ViewModelInstanceTrigger viewModelPropertyId="${propiedades.pie}"/>
<ViewModelInstanceTrigger viewModelPropertyId="${propiedades.bostezoMano}"/>
<ViewModelInstanceTrigger viewModelPropertyId="${propiedades.tocarReloj}"/>
<ViewModelInstanceTrigger viewModelPropertyId="${propiedades.bostezo}"/>
<ViewModelInstanceTrigger viewModelPropertyId="${propiedades.cancelar}"/>
<ViewModelInstanceBoolean propertyValue="false" viewModelPropertyId="${propiedades.reducedMotion}"/>
</ViewModelInstance>
</ViewModel>`;

const rml = `<Rive version="1" kind="fragment">
<Artboard defaultStateMachineId="0:7" viewModelId="${VM}" viewModelInstanceId="0:46" styleId="0:5" width="1185" height="1185" name="Reposo" id="0:2">
<LayoutComponentStyle name="Artboard Style" id="0:5"/>
<Node name="Escala" x="3" y="3" scaleX="0.94" scaleY="0.94">
<Node name="Personaje" id="${idDe('Personaje')}">
<Node name="Respira" id="${idDe('Respira')}">
${figura}
</Node>
</Node>
</Node>
${maquina}
${animaciones.join('\n')}
</Artboard>
${modeloDatos}
</Rive>
`;
writeFileSync(DESTINO, rml);
console.log(`${DESTINO}: ${rml.length} bytes`);
