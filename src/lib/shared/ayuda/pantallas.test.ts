import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATALOGO_AYUDA, listaAyuda, pantallaDeRuta } from './pantallas';

// RF-203: cada pantalla de `(app)` y `(visita)` tiene su ayuda. Las rutas se leen del disco: una pantalla nueva sin ayuda falla aquí.
const RAIZ = join(process.cwd(), 'src', 'routes');

function rutasDePagina(carpeta: string): string[] {
	return readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
		const ruta = join(carpeta, entrada.name);
		if (entrada.isDirectory()) return rutasDePagina(ruta);
		if (entrada.name !== '+page.svelte') return [];
		return [`/${relative(RAIZ, carpeta).split(sep).join('/')}`];
	});
}

describe('catálogo de ayuda (RF-203)', () => {
	const rutas = [...rutasDePagina(join(RAIZ, '(app)')), ...rutasDePagina(join(RAIZ, '(visita)'))];

	it('CA-203: cada pantalla de (app) y (visita) tiene una entrada de ayuda con título y propósito', () => {
		expect(rutas.length).toBeGreaterThan(20);
		for (const ruta of rutas) {
			const id = pantallaDeRuta(ruta);
			expect(id, ruta).toBeDefined();
			if (id) expect(CATALOGO_AYUDA[id].proposito.length, ruta).toBeGreaterThan(10);
		}
	});

	it('CA-203: una ruta sin ayuda (la entrada) y la ruta nula no tienen pantalla; la lista no repite anclas', () => {
		expect(pantallaDeRuta('/(auth)/login')).toBeUndefined();
		expect(pantallaDeRuta(null)).toBeUndefined();
		const ids = listaAyuda().map((fila) => fila.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('está congelado', () => {
		expect(Object.isFrozen(CATALOGO_AYUDA)).toBe(true);
	});
});
