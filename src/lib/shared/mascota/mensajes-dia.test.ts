import { describe, expect, it } from 'vitest';
import { IDS_MENSAJES_DIA, MENSAJES_DIA } from './mensajes-dia';
import { formatearTextoMascota } from './momentos';

// RF-267, CA-267: el catálogo de mensajes del día.
describe('catálogo de mensajes del día', () => {
	it('CA-267: tiene al menos 40 mensajes con identificador único', () => {
		expect(MENSAJES_DIA.length).toBeGreaterThanOrEqual(40);
		expect(new Set(IDS_MENSAJES_DIA).size).toBe(MENSAJES_DIA.length);
	});

	it('CA-267: el único marcador permitido es {nombre}', () => {
		for (const mensaje of MENSAJES_DIA) {
			const marcadores = mensaje.texto.match(/\{[^}]*\}/g) ?? [];
			expect(marcadores.every((marcador) => marcador === '{nombre}')).toBe(true);
		}
	});

	it('RF-267: ningún mensaje queda con llaves tras formatearlo, con o sin nombre', () => {
		for (const mensaje of MENSAJES_DIA) {
			expect(formatearTextoMascota(mensaje.texto, { nombre: 'Ana' })).not.toMatch(/[{}]/);
			expect(formatearTextoMascota(mensaje.texto)).not.toMatch(/[{}]/);
		}
	});
});
