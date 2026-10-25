// Genera `entrada/scene.rml` a partir de `static/mascota/svg/capsulito-saludando.svg` (F11, RF-225, research R10).
// Uso, desde la raíz: node docs/diseno/f11/rive/generar-entrada.mjs
// El SVG usa solo M, L, C y Z; cada grupo con `id` pasa a un nodo de Rive y cada trazo a un `PointsPath` con vértices cúbicos.
import { readFileSync, writeFileSync } from 'node:fs';

const ORIGEN = 'static/mascota/svg/capsulito-saludando.svg';
const DESTINO = 'docs/diseno/f11/rive/entrada/scene.rml';
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

/** Mano en vertical sobre un ojo, con el antebrazo subiendo desde el hombro. Siempre se usa la mano que saluda (dedos arriba). */
function tapaOjos(lado) {
	const [hx, hy] = piezas.get('mano-der').pivote;
	const izquierda = lado === 'izq';
	const escala = 1.05;
	const pivote = izquierda ? [562, 567] : [720, 517];
	const antebrazo = izquierda ? [[372, 705], [450, 685], [pivote[0], pivote[1]]] : [[915, 625], [845, 610], [pivote[0], pivote[1]]];
	const vertices = antebrazo.map(([x, y]) => `<StraightVertex x="${x}" y="${y}" radius="30"/>`).join('');
	const brazo = `<Shape name="Antebrazo-${lado}"><PointsPath isClosed="false" isClockwise="true">${vertices}</PointsPath><Stroke thickness="46" cap="round" join="round"><SolidColor colorValue="FF5A3020"/></Stroke></Shape>`;
	const mano = `<Node name="TapaMano-${lado}" x="${pivote[0]}" y="${pivote[1]}" scaleX="${izquierda ? -escala : escala}" scaleY="${escala}">\n${formas('mano-der', hx, hy)}\n</Node>`;
	return `<Node name="Tapa-${lado}" id="${idDe(`Tapa-${lado}`)}" opacity="0" y="110">\n${mano}\n${brazo}\n</Node>`;
}

const COLORES = ['FFE53935', 'FFFDD835', 'FF43A047', 'FF1E88E5', 'FFF4511E', 'FF8E24AA', 'FF00ACC1', 'FFFFB300', 'FFD81B60', 'FF7CB342', 'FF3949AB', 'FFFB8C00'];
// Salen de la cara y se reparten en abanico dentro del lienzo de 1185 px.
const confeti = COLORES.map((color, i) => {
	const angulo = Math.PI + (Math.PI * (i + 0.5)) / COLORES.length;
	const radio = 380 + (i % 3) * 90;
	return [color, Math.round(Math.cos(angulo) * radio), Math.round(Math.sin(angulo) * radio * 0.8)];
});
const confetiXml = confeti
	.map(([color], i) => `<Shape name="Confeti-${i}" id="${idDe(`Confeti-${i}`)}" x="592" y="520" opacity="0"><Ellipse originX="0.5" originY="0.5" width="${i % 2 ? 44 : 56}" height="${i % 2 ? 44 : 56}"/><Fill><SolidColor colorValue="${color}"/></Fill></Shape>`)
	.join('\n');

const lagrima = `<Shape name="Lagrima" id="${idDe('Lagrima')}" x="800" y="560" opacity="0"><PointsPath isClosed="true" isClockwise="true"><StraightVertex x="0" y="-26"/><CubicDetachedVertex x="15" y="12" inRotation="-0.6" inDistance="14" outRotation="2.2" outDistance="14"/><CubicDetachedVertex x="-15" y="12" inRotation="0.9" inDistance="14" outRotation="3.7" outDistance="14"/></PointsPath><Fill><SolidColor colorValue="CC4FC3F7"/></Fill></Shape>`;

const boca = `<Node name="Boca" id="${idDe('Boca')}" x="${BOCA[0]}" y="${BOCA[1]}">\n${formas('boca', BOCA[0], BOCA[1])}\n</Node>`;

const figura = [
	confetiXml,
	tapaOjos('izq'),
	tapaOjos('der'),
	lagrima,
	brazo('izq'),
	pieza('zapatilla-izq'),
	pieza('zapatilla-der'),
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
	pieza('pierna-der'),
	pieza('pierna-izq'),
	pieza('sombra', { x: 0, y: 0 }),
].join('\n');

// ---------- animaciones ----------
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

// Mirada: x de cada pupila para mirarX = 0, 50 y 100 (el ojo derecho tiene poco margen a la izquierda).
const MIRADA = { izq: [-20, 5, 30], der: [-2, 20, 40] };
['Izquierda', 'Centro', 'Derecha'].forEach((nombre, i) => {
	animacion(`mirar${nombre}`, 1, 'oneShot', {
		'Mirar-izq': { x: [[0, MIRADA.izq[i]]] },
		'Mirar-der': { x: [[0, MIRADA.der[i]]] },
	});
});

const parpadeo = (cuadro) => ({ escalaY: [[0, 1], [cuadro, 1], [cuadro + 5, 0.08], [cuadro + 10, 1], [240, 1]] });
animacion('reposo', 240, 'loop', {
	Respira: { y: [[0, 0], [120, -6], [240, 0]] },
	'Parpadeo-izq': parpadeo(200),
	'Parpadeo-der': parpadeo(200),
});
animacion('quieto', 1, 'oneShot', {
	Respira: { y: [[0, 0]] },
	'Parpadeo-izq': { escalaY: [[0, 1]] },
	'Parpadeo-der': { escalaY: [[0, 1]] },
});

animacion('manosAbajo', 1, 'oneShot', {
	'Tapa-izq': { opacidad: [[0, 0]], y: [[0, 110]] },
	'Tapa-der': { opacidad: [[0, 0]], y: [[0, 110]] },
	'Brazo-izq': { opacidad: [[0, 1]] },
	'Brazo-der': { opacidad: [[0, 1]] },
});
const tapar = {};
for (const lado of ['izq', 'der']) {
	tapar[`Tapa-${lado}`] = { opacidad: [[0, 0], [4, 1]], y: [[0, 110], [18, 0]] };
	tapar[`Brazo-${lado}`] = { opacidad: [[0, 1], [4, 0]] };
}
animacion('taparOjos', 18, 'oneShot', tapar);

const caraNeutra = {
	Personaje: { y: [[0, 0]] },
	'Ceja-izq': { rotacion: [[0, 0]], y: [[0, CEJA_IZQ[1]]] },
	'Ceja-der': { rotacion: [[0, 0]], y: [[0, CEJA_DER[1]]] },
	Boca: { escalaX: [[0, 1]], escalaY: [[0, 1]], y: [[0, BOCA[1]]] },
	Lagrima: { opacidad: [[0, 0]], y: [[0, 560]] },
	'Mirar-izq': { y: [[0, 0]] },
	'Mirar-der': { y: [[0, 0]] },
};
animacion('neutro', 1, 'oneShot', caraNeutra);
animacion('triste', 150, 'oneShot', {
	Personaje: { y: [[0, 0], [20, 14], [130, 14], [150, 0]] },
	'Ceja-izq': { rotacion: [[0, 0], [20, 0.3], [130, 0.3], [150, 0]], y: [[0, CEJA_IZQ[1]], [20, CEJA_IZQ[1] + 14], [130, CEJA_IZQ[1] + 14], [150, CEJA_IZQ[1]]] },
	'Ceja-der': { rotacion: [[0, 0], [20, -0.3], [130, -0.3], [150, 0]], y: [[0, CEJA_DER[1]], [20, CEJA_DER[1] + 14], [130, CEJA_DER[1] + 14], [150, CEJA_DER[1]]] },
	Boca: {
		escalaY: [[0, 1], [20, -0.45], [130, -0.45], [150, 1]],
		escalaX: [[0, 1], [20, 0.8], [130, 0.8], [150, 1]],
		y: [[0, BOCA[1]], [20, BOCA[1] + 62], [130, BOCA[1] + 62], [150, BOCA[1]]],
	},
	Lagrima: { opacidad: [[0, 0], [30, 1], [120, 1], [150, 0]], y: [[0, 560], [30, 575], [120, 700], [150, 700]] },
	'Mirar-izq': { y: [[0, 0], [20, 12], [130, 12], [150, 0]] },
	'Mirar-der': { y: [[0, 0], [20, 12], [130, 12], [150, 0]] },
});

const salto = [[0, 0], [10, -110], [20, 0], [30, -110], [40, 0], [60, 0]];
const celebrar = {
	Personaje: { y: salto },
	'Brazo-izq': { rotacion: [[0, 0], [10, 2.4], [60, 2.4]] },
	Boca: { escalaX: [[0, 1], [10, 1.12], [60, 1.12]], escalaY: [[0, 1], [10, 1.12], [60, 1.12]], y: [[0, BOCA[1]], [60, BOCA[1]]] },
	'Ceja-izq': { rotacion: [[0, 0], [10, -0.12], [60, -0.12]], y: [[0, CEJA_IZQ[1]], [10, CEJA_IZQ[1] - 12], [60, CEJA_IZQ[1] - 12]] },
	'Ceja-der': { rotacion: [[0, 0], [10, 0.12], [60, 0.12]], y: [[0, CEJA_DER[1]], [10, CEJA_DER[1] - 12], [60, CEJA_DER[1] - 12]] },
};
confeti.forEach(([, dx, dy], i) => {
	celebrar[`Confeti-${i}`] = {
		opacidad: [[0, 0], [4, 1], [50, 1], [60, 0]],
		x: [[0, 592], [40, 592 + dx]],
		y: [[0, 520], [40, 520 + dy], [60, 520 + dy + 140]],
	};
});
animacion('celebrar', 60, 'oneShot', celebrar);

// ---------- máquina de estados ----------
// Entradas como propiedades del ViewModel `Entrada` (las entradas de la máquina de estados están en desuso).
const VM = '0:40';
const propiedades = {
	mirarX: '0:41',
	taparOjos: '0:42',
	fallo: '0:43',
	exito: '0:44',
	reducedMotion: '0:45',
};
const ruta = (nombre) => `${VM}-${propiedades[nombre]}`;
const condicionBooleana = (nombre, valor) =>
	`<TransitionViewModelCondition><TransitionPropertyViewModelComparator><BindablePropertyBoolean><DataBindContext sourcePathIds="${ruta(nombre)}" propertyKey="634"/></BindablePropertyBoolean></TransitionPropertyViewModelComparator><TransitionValueBooleanComparator value="${valor}"/></TransitionViewModelCondition>`;
const condicionDisparador = (nombre) =>
	`<TransitionViewModelCondition><TransitionPropertyViewModelComparator><BindablePropertyTrigger><DataBindContext sourcePathIds="${ruta(nombre)}" propertyKey="686"/></BindablePropertyTrigger></TransitionPropertyViewModelComparator><TransitionValueTriggerComparator/></TransitionViewModelCondition>`;

function capa(nombre, estados, entrada) {
	return `<StateMachineLayer name="${nombre}" id="${nuevoId()}">
<AnyState x="200" y="-160"/>
<ExitState x="400" y="-160"/>
<EntryState><StateTransition stateToId="${entrada}"/></EntryState>
${estados}
</StateMachineLayer>`;
}

// Reposo / quieto
const idReposo = nuevoId();
const idQuieto = nuevoId();
const capaReposo = capa(
	'Reposo',
	`<AnimationState x="200" y="0" animationId="${anim('reposo')}" id="${idReposo}"><StateTransition stateToId="${idQuieto}" duration="150">${condicionBooleana('reducedMotion', true)}</StateTransition></AnimationState>
<AnimationState x="400" y="0" animationId="${anim('quieto')}" id="${idQuieto}"><StateTransition stateToId="${idReposo}" duration="150">${condicionBooleana('reducedMotion', false)}</StateTransition></AnimationState>`,
	idReposo,
);

// Mirada (mezcla 1D)
const idMirada = nuevoId();
const capaMirada = capa(
	'Mirada',
	`<BlendState1DViewModel x="200" y="0" id="${idMirada}"><BindablePropertyNumber><DataBindContext sourcePathIds="${ruta('mirarX')}" propertyKey="636"/></BindablePropertyNumber>
<BlendAnimation1D animationId="${anim('mirarIzquierda')}" value="0"/>
<BlendAnimation1D animationId="${anim('mirarCentro')}" value="50"/>
<BlendAnimation1D animationId="${anim('mirarDerecha')}" value="100"/>
</BlendState1DViewModel>`,
	idMirada,
);

// Manos
const idLibres = nuevoId();
const idTapadas = nuevoId();
const capaManos = capa(
	'Manos',
	`<AnimationState x="200" y="0" animationId="${anim('manosAbajo')}" id="${idLibres}"><StateTransition stateToId="${idTapadas}" duration="150">${condicionBooleana('taparOjos', true)}</StateTransition></AnimationState>
<AnimationState x="400" y="0" animationId="${anim('taparOjos')}" id="${idTapadas}"><StateTransition stateToId="${idLibres}" duration="150">${condicionBooleana('taparOjos', false)}</StateTransition></AnimationState>`,
	idLibres,
);

// Emoción
const idNeutro = nuevoId();
const idTriste = nuevoId();
const idCelebra = nuevoId();
const capaEmocion = `<StateMachineLayer name="Emocion" id="${nuevoId()}">
<AnyState x="200" y="-160">
<StateTransition stateToId="${idTriste}" duration="120">${condicionDisparador('fallo')}</StateTransition>
<StateTransition stateToId="${idCelebra}" duration="100">${condicionDisparador('exito')}</StateTransition>
</AnyState>
<ExitState x="600" y="-160"/>
<EntryState><StateTransition stateToId="${idNeutro}"/></EntryState>
<AnimationState x="200" y="0" animationId="${anim('neutro')}" id="${idNeutro}"/>
<AnimationState x="400" y="0" animationId="${anim('triste')}" id="${idTriste}"><StateTransition stateToId="${idNeutro}" duration="300" enableExitTime="true" exitTimeIsPercetange="true" exitTime="100"/></AnimationState>
<AnimationState x="600" y="0" animationId="${anim('celebrar')}" id="${idCelebra}"/>
</StateMachineLayer>`;

const maquina = `<StateMachine name="Entrada" id="0:7">
${capaReposo}
${capaMirada}
${capaManos}
${capaEmocion}
</StateMachine>`;

const modeloDatos = `<ViewModel defaultInstanceId="0:46" name="Entrada" id="${VM}">
<ViewModelPropertyNumber name="mirarX" id="${propiedades.mirarX}"/>
<ViewModelPropertyBoolean name="taparOjos" id="${propiedades.taparOjos}"/>
<ViewModelPropertyTrigger name="fallo" id="${propiedades.fallo}"/>
<ViewModelPropertyTrigger name="exito" id="${propiedades.exito}"/>
<ViewModelPropertyBoolean name="reducedMotion" id="${propiedades.reducedMotion}"/>
<ViewModelInstance exports="true" name="Default" id="0:46">
<ViewModelInstanceNumber propertyValue="50" viewModelPropertyId="${propiedades.mirarX}"/>
<ViewModelInstanceBoolean propertyValue="false" viewModelPropertyId="${propiedades.taparOjos}"/>
<ViewModelInstanceTrigger viewModelPropertyId="${propiedades.fallo}"/>
<ViewModelInstanceTrigger viewModelPropertyId="${propiedades.exito}"/>
<ViewModelInstanceBoolean propertyValue="false" viewModelPropertyId="${propiedades.reducedMotion}"/>
</ViewModelInstance>
</ViewModel>`;

const rml = `<Rive version="1" kind="fragment">
<Artboard defaultStateMachineId="0:7" viewModelId="${VM}" viewModelInstanceId="0:46" styleId="0:5" width="1185" height="1185" name="Entrada" id="0:2">
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
