import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { siguienteEstadoInstalacion, type EstadoInstalacion } from './instalacion';

// F16 (RF-280, EV-116): las transiciones del estado de instalación.
const estado = fc.constantFrom<EstadoInstalacion>('instalada', 'rechazada');

describe('transiciones del estado de instalación', () => {
	it('CA-280: de «sin datos» pasa a cualquier estado', () => {
		expect(siguienteEstadoInstalacion(null, 'rechazada')).toEqual({ estado: 'rechazada', cambia: true });
		expect(siguienteEstadoInstalacion(null, 'instalada')).toEqual({ estado: 'instalada', cambia: true });
	});

	it('CA-280: de rechazada pasa a instalada', () => {
		expect(siguienteEstadoInstalacion('rechazada', 'instalada')).toEqual({ estado: 'instalada', cambia: true });
	});

	it('CA-280: instalada no pasa a rechazada', () => {
		expect(siguienteEstadoInstalacion('instalada', 'rechazada')).toEqual({ estado: 'instalada', cambia: false });
	});

	it('EV-116: para cualquier secuencia, instalada nunca vuelve a rechazada y repetir no cambia nada', () => {
		fc.assert(
			fc.property(fc.array(estado, { maxLength: 30 }), (secuencia) => {
				let actual: EstadoInstalacion | null = null;
				let instaladaVista = false;
				for (const entrante of secuencia) {
					const resultado = siguienteEstadoInstalacion(actual, entrante);
					if (instaladaVista) expect(resultado.estado).toBe('instalada');
					if (actual === entrante) expect(resultado.cambia).toBe(false);
					actual = resultado.estado;
					if (actual === 'instalada') instaladaVista = true;
				}
			}),
		);
	});
});
