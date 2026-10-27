import type { Encuadre } from '../contratos/encuadre';

// Geometría del encuadre (RF-273): función pura que usa `EncuadreFoto` y que la prueba comprueba sin navegador.
// La zona visible es un cuadrado de lado `1 / zoom` (fracción del lado menor de la foto) centrado en (cx, cy), fracciones del ancho y el alto.

export const ZOOM_MAXIMO = 4;

export type Vista = { readonly cx: number; readonly cy: number; readonly zoom: number };

const acotar = (valor: number, minimo: number, maximo: number) => Math.min(maximo, Math.max(minimo, valor));

/** Zoom más alto que admite la foto: hasta 4×, o hasta su tamaño original si es pequeña (nunca por debajo de «cubrir»). */
export function zoomMaximo(ancho: number, alto: number, marco: number): number {
	return Math.max(1, Math.min(ZOOM_MAXIMO, Math.min(ancho, alto) / Math.max(1, marco)));
}

/** Ajusta la vista para que la zona visible quede siempre dentro de la foto (la foto siempre cubre el marco). */
export function acotarVista(vista: Vista, ancho: number, alto: number, marco: number): Vista {
	const zoom = acotar(vista.zoom, 1, zoomMaximo(ancho, alto, marco));
	const lado = Math.min(ancho, alto) / zoom;
	const mitadX = lado / 2 / ancho;
	const mitadY = lado / 2 / alto;
	return { zoom, cx: acotar(vista.cx, mitadX, 1 - mitadX), cy: acotar(vista.cy, mitadY, 1 - mitadY) };
}

/** La zona que se envía al servidor. */
export function encuadreDeVista(vista: Vista, ancho: number, alto: number): Encuadre {
	const lado = Math.min(ancho, alto) / vista.zoom;
	// El redondeo de coma flotante puede dejar un -1e-17: el servidor exige valores desde 0.
	return { x: Math.max(0, vista.cx - lado / 2 / ancho), y: Math.max(0, vista.cy - lado / 2 / alto), lado: 1 / vista.zoom };
}

/** Posición y tamaño de la foto dentro del marco, en píxeles. */
export function disposicion(vista: Vista, ancho: number, alto: number, marco: number) {
	const lado = Math.min(ancho, alto) / vista.zoom;
	const escala = marco / lado;
	return {
		escala,
		anchoPx: ancho * escala,
		altoPx: alto * escala,
		izquierda: -(vista.cx * ancho - lado / 2) * escala,
		arriba: -(vista.cy * alto - lado / 2) * escala,
	};
}
