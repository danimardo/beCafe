import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { acotarVista, disposicion, encuadreDeVista, zoomMaximo, ZOOM_MAXIMO } from './zona-encuadre';

// F15 (RF-273): la zona que se envía siempre cabe en la foto y la foto siempre cubre el marco.
const medida = fc.integer({ min: 50, max: 6000 });

describe('zona de encuadre', () => {
	it('CA-273: sin zoom, la zona cubre el lado menor entero', () => {
		const vista = acotarVista({ cx: 0.5, cy: 0.5, zoom: 1 }, 900, 300, 280);
		const zona = encuadreDeVista(vista, 900, 300);
		expect(zona.x).toBeCloseTo(1 / 3);
		expect(zona.y).toBeCloseTo(0);
		expect(zona.lado).toBe(1);
	});

	it('CA-273: el zoom máximo es 4× o el tamaño original si la foto es pequeña', () => {
		expect(zoomMaximo(4000, 3000, 280)).toBe(ZOOM_MAXIMO);
		expect(zoomMaximo(400, 300, 280)).toBeCloseTo(300 / 280);
		expect(zoomMaximo(100, 100, 280)).toBe(1);
	});

	it('CA-273: cualquier vista acotada produce una zona dentro de la foto', () => {
		fc.assert(
			fc.property(
				medida,
				medida,
				fc.double({ min: -1, max: 2, noNaN: true }),
				fc.double({ min: -1, max: 2, noNaN: true }),
				fc.double({ min: 0.1, max: 10, noNaN: true }),
				(ancho, alto, cx, cy, zoom) => {
					const vista = acotarVista({ cx, cy, zoom }, ancho, alto, 280);
					const zona = encuadreDeVista(vista, ancho, alto);
					const lado = zona.lado * Math.min(ancho, alto);
					expect(zona.x).toBeGreaterThanOrEqual(-1e-9);
					expect(zona.y).toBeGreaterThanOrEqual(-1e-9);
					expect(zona.x * ancho + lado).toBeLessThanOrEqual(ancho + 1e-6);
					expect(zona.y * alto + lado).toBeLessThanOrEqual(alto + 1e-6);
					expect(zona.lado).toBeGreaterThan(0);
				},
			),
		);
	});

	it('CA-273: la foto siempre cubre el marco', () => {
		fc.assert(
			fc.property(
				medida,
				medida,
				fc.double({ min: 0, max: 1, noNaN: true }),
				fc.double({ min: 0, max: 1, noNaN: true }),
				fc.double({ min: 1, max: 4, noNaN: true }),
				(ancho, alto, cx, cy, zoom) => {
					const vista = acotarVista({ cx, cy, zoom }, ancho, alto, 280);
					const d = disposicion(vista, ancho, alto, 280);
					expect(d.izquierda).toBeLessThanOrEqual(1e-6);
					expect(d.arriba).toBeLessThanOrEqual(1e-6);
					expect(d.izquierda + d.anchoPx).toBeGreaterThanOrEqual(280 - 1e-6);
					expect(d.arriba + d.altoPx).toBeGreaterThanOrEqual(280 - 1e-6);
				},
			),
		);
	});
});
