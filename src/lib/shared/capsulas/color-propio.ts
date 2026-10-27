import { REFERENCIAS_TEMA, type ReferenciasTema } from './referencias-tema';

// Color propio de un tipo de cápsula (F15, RF-269, RF-270, DEC-136; constitución XVIII, excepción cerrada de 1.9.0).
// A partir de un `#rrggbb` calcula, para cada tema, el relleno, el límite y el texto con el contraste exigido:
// texto ≥ 4,5:1 sobre el relleno y límite ≥ 3:1 contra la tarjeta y el fondo del tema. Funciones puras y deterministas.

/** Contraste mínimo del texto sobre el relleno (WCAG 2.2, 1.4.3). */
export const CONTRASTE_TEXTO = 4.5;
/** Contraste mínimo del límite contra la superficie (WCAG 2.2, 1.4.11). */
export const CONTRASTE_LIMITE = 3;

/** Luminosidad (HSL) entre la que se mueve el relleno en tema oscuro: ni se apaga contra el fondo ni deslumbra. */
const LUMINOSIDAD_OSCURO = { minima: 0.32, maxima: 0.66 } as const;
const PASO = 0.01;
const PASOS_MAXIMOS = 100;

export type ColoresTema = { relleno: string; limite: string; texto: string };
export type ColoresCapsula = { claro: ColoresTema; oscuro: ColoresTema };

type Rgb = readonly [number, number, number];

const FORMATO_HEX = /^#[0-9a-f]{6}$/i;

/** Un color propio guardado tiene el formato `#rrggbb` (RF-271). */
export function esColorPropio(color: string): boolean {
	return FORMATO_HEX.test(color);
}

function aRgb(hex: string): Rgb {
	if (!FORMATO_HEX.test(hex)) throw new RangeError('El color debe tener el formato #rrggbb');
	return [Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16)];
}

function aHex([rojo, verde, azul]: Rgb): string {
	return `#${[rojo, verde, azul].map((canal) => canal.toString(16).padStart(2, '0')).join('')}`;
}

/** Luminancia relativa de WCAG 2.2 (0 = negro, 1 = blanco). */
export function luminancia(hex: string): number {
	const [rojo, verde, azul] = aRgb(hex).map((canal) => {
		const c = canal / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * rojo + 0.7152 * verde + 0.0722 * azul;
}

/** Relación de contraste de WCAG 2.2 entre dos colores (de 1 a 21). */
export function contraste(a: string, b: string): number {
	const [clara, oscura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
	return (clara + 0.05) / (oscura + 0.05);
}

type Hsl = { tono: number; saturacion: number; luminosidad: number };

function aHsl(hex: string): Hsl {
	const [r, g, b] = aRgb(hex).map((canal) => canal / 255);
	const maximo = Math.max(r, g, b);
	const minimo = Math.min(r, g, b);
	const luminosidad = (maximo + minimo) / 2;
	const delta = maximo - minimo;
	if (delta === 0) return { tono: 0, saturacion: 0, luminosidad };
	const saturacion = delta / (1 - Math.abs(2 * luminosidad - 1));
	let tono: number;
	if (maximo === r) tono = ((g - b) / delta) % 6;
	else if (maximo === g) tono = (b - r) / delta + 2;
	else tono = (r - g) / delta + 4;
	return { tono: (tono * 60 + 360) % 360, saturacion, luminosidad };
}

function desdeHsl({ tono, saturacion, luminosidad }: Hsl): string {
	const croma = (1 - Math.abs(2 * luminosidad - 1)) * saturacion;
	const x = croma * (1 - Math.abs(((tono / 60) % 2) - 1));
	const m = luminosidad - croma / 2;
	const sector = Math.floor(tono / 60) % 6;
	const [r, g, b] = [
		[croma, x, 0],
		[x, croma, 0],
		[0, croma, x],
		[0, x, croma],
		[x, 0, croma],
		[croma, 0, x],
	][sector] ?? [0, 0, 0];
	const canal = (valor: number | undefined) => Math.min(255, Math.max(0, Math.round(((valor ?? 0) + m) * 255)));
	return aHex([canal(r), canal(g), canal(b)]);
}

function conLuminosidad(hex: string, luminosidad: number): string {
	return desdeHsl({ ...aHsl(hex), luminosidad: Math.min(1, Math.max(0, luminosidad)) });
}

/**
 * Mueve la luminosidad de `hex` en `sentido` (+1 aclara, −1 oscurece) de 0,01 en 0,01 hasta que `cumple` da verdadero.
 * Devuelve `null` si no lo logra en 100 pasos.
 */
function desplazar(hex: string, sentido: 1 | -1, cumple: (candidato: string) => boolean): string | null {
	const inicial = aHsl(hex).luminosidad;
	for (let paso = 0; paso <= PASOS_MAXIMOS; paso += 1) {
		const candidato = conLuminosidad(hex, inicial + sentido * paso * PASO);
		if (cumple(candidato)) return candidato;
	}
	return null;
}

/** El texto del tema con más contraste sobre `relleno`. */
function mejorTexto(relleno: string, referencias: ReferenciasTema): string {
	return contraste(referencias.tinta, relleno) >= contraste(referencias.sobreAcento, relleno) ? referencias.tinta : referencias.sobreAcento;
}

function rellenoLegible(relleno: string, referencias: ReferenciasTema): string {
	const cumple = (candidato: string) => contraste(mejorTexto(candidato, referencias), candidato) >= CONTRASTE_TEXTO;
	if (cumple(relleno)) return relleno;
	const oscurecido = desplazar(relleno, -1, cumple);
	const aclarado = desplazar(relleno, 1, cumple);
	if (oscurecido === null && aclarado === null) throw new RangeError('No hay un relleno con contraste suficiente');
	if (oscurecido === null) return aclarado ?? relleno;
	if (aclarado === null) return oscurecido;
	// El cambio más pequeño; a igualdad, oscurecer.
	const distancia = (candidato: string) => Math.abs(aHsl(candidato).luminosidad - aHsl(relleno).luminosidad);
	return distancia(oscurecido) <= distancia(aclarado) ? oscurecido : aclarado;
}

function limiteVisible(relleno: string, referencias: ReferenciasTema, sentido: 1 | -1): string {
	const cumple = (candidato: string) =>
		contraste(candidato, referencias.tarjeta) >= CONTRASTE_LIMITE && contraste(candidato, referencias.fondo) >= CONTRASTE_LIMITE;
	// En tema claro el límite se oscurece; en oscuro, se aclara. Los extremos (negro y blanco) siempre cumplen.
	return cumple(relleno) ? relleno : (desplazar(relleno, sentido, cumple) ?? relleno);
}

function calcularTema(hex: string, tema: 'claro' | 'oscuro'): ColoresTema {
	const referencias = REFERENCIAS_TEMA[tema];
	const base =
		tema === 'oscuro'
			? conLuminosidad(hex, Math.min(LUMINOSIDAD_OSCURO.maxima, Math.max(LUMINOSIDAD_OSCURO.minima, aHsl(hex).luminosidad)))
			: hex;
	const relleno = rellenoLegible(base, referencias);
	return { relleno, limite: limiteVisible(relleno, referencias, tema === 'claro' ? -1 : 1), texto: mejorTexto(relleno, referencias) };
}

/**
 * Colores de una cápsula con color propio para cada tema (RF-270). Acepta `#rrggbb` en cualquier caja y devuelve minúsculas.
 * Lanza `RangeError` si el formato no es válido: el servidor lo valida antes (RF-271).
 */
export function coloresCapsula(hex: string): ColoresCapsula {
	const normalizado = aHex(aRgb(hex));
	return { claro: calcularTema(normalizado, 'claro'), oscuro: calcularTema(normalizado, 'oscuro') };
}
