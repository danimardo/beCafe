import { renderSVG } from 'uqr';

// Único archivo que importa `uqr` (plan F10, dependencias nuevas). El QR se dibuja siempre en negro sobre blanco,
// también en el tema oscuro: los lectores de QR no leen bien los colores invertidos.

/** Devuelve el QR de un texto como SVG escalable (sin ancho ni alto fijos), con margen de dos módulos. */
export function qrSvg(texto: string): string {
	return renderSVG(texto, { border: 2, pixelSize: 10, whiteColor: 'white', blackColor: 'black' });
}
