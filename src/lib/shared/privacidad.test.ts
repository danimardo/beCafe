import { describe, expect, it } from 'vitest';
import { TEXTO_PRIVACIDAD, TEXTO_VISITANTES, VERSION_PRIVACIDAD } from './privacidad';

// RF-160: el texto que se acepta debe tener una versión entera y bloques con contenido.
describe('texto de privacidad (RF-160, PEND-014)', () => {
	it('CA-160: la versión vigente es un entero positivo', () => {
		expect(Number.isInteger(VERSION_PRIVACIDAD)).toBe(true);
		expect(VERSION_PRIVACIDAD).toBeGreaterThanOrEqual(1);
	});

	it('empieza por un título y no tiene bloques vacíos', () => {
		expect(TEXTO_PRIVACIDAD[0]).toEqual({ tipo: 'titulo', texto: 'Privacidad en beCafé' });
		for (const bloque of TEXTO_PRIVACIDAD) {
			if (bloque.tipo === 'lista') expect(bloque.elementos.length).toBeGreaterThan(0);
			else expect(bloque.texto.trim().length).toBeGreaterThan(0);
		}
	});

	it('PEND-014: los marcadores que faltan por completar siguen visibles mientras el texto no sea definitivo', () => {
		const textos = TEXTO_PRIVACIDAD.map((bloque) => (bloque.tipo === 'lista' ? bloque.elementos.join(' ') : bloque.texto));
		expect(textos.some((texto) => texto.includes('[proveedor y ubicación del almacenamiento S3]'))).toBe(true);
		expect(textos.some((texto) => texto.includes('[contacto]'))).toBe(true);
	});

	it('CA-224: la versión 3 nombra al responsable y al gestor, sin correo ni teléfono, e informa de las frases dichas', () => {
		const completo = TEXTO_PRIVACIDAD.map((bloque) => (bloque.tipo === 'lista' ? bloque.elementos.join(' ') : bloque.texto)).join(' ');
		expect(VERSION_PRIVACIDAD).toBe(3);
		expect(completo).toContain(
			'Mardomingo Software. Gestiona la aplicación, dentro de la empresa, el responsable del departamento de informática, Daniel Diez Mardomingo: contacta con él en persona o por el canal interno del departamento.',
		);
		expect(completo).toContain('Las frases de Capsulito que ya te ha dicho y la hora de su último saludo, para no repetírtelas.');
		expect(completo).not.toContain('[Nombre de la empresa]');
		expect(completo).not.toMatch(/@|\+?\d{9}/);
	});

	it('CAMBIO-019: el texto conserva lo de la versión 2: informa de la foto, las estadísticas visibles y los visitantes', () => {
		const completo = TEXTO_PRIVACIDAD.map((bloque) => (bloque.tipo === 'lista' ? bloque.elementos.join(' ') : bloque.texto)).join(' ');
		expect(completo).toContain('tu foto');
		expect(completo).toContain('Todos los miembros ven tu foto y tus estadísticas de consumo');
		expect(completo).toContain(TEXTO_VISITANTES);
	});
});
