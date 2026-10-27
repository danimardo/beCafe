import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { esquemaClaveCopia } from '../subida-s3';
import { construirClave, leerClave, ORIGEN_LOCAL, origenDeSistema, TIPOS_COPIA_CLAVE } from './clave-copia';

const INSTANTE = '2026-10-27T03:00:00.000Z';

describe('clave de copia con origen y tipo (RF-289)', () => {
	it('CA-289: localhost y 127.0.0.1 se guardan como «local», con o sin puerto', () => {
		expect(origenDeSistema('http://localhost:3000')).toBe(ORIGEN_LOCAL);
		expect(origenDeSistema('http://127.0.0.1:5173')).toBe(ORIGEN_LOCAL);
	});

	it('CA-289: un dominio de producción se guarda en minúsculas y sin puerto', () => {
		expect(origenDeSistema('https://BeCafe.Mardomingo.com')).toBe('becafe.mardomingo.com');
		expect(origenDeSistema('https://becafe.mardomingo.com:8443')).toBe('becafe.mardomingo.com');
	});

	it('CA-289: la clave de una copia manual lleva su origen y su tipo y es una clave válida', () => {
		const clave = construirClave({ instante: INSTANTE, origen: 'becafe.mardomingo.com', tipo: 'manual' });
		expect(clave).toBe('becafe/2026/10/becafe-2026-10-27T03-00-00.000Z__becafe.mardomingo.com__manual.tar.gz');
		expect(esquemaClaveCopia.safeParse(clave).success).toBe(true);
		expect(leerClave(clave)).toEqual({ origen: 'becafe.mardomingo.com', tipo: 'manual' });
	});

	it('CA-289: un resguardo va bajo becafe/resguardos/ y se lee como resguardo', () => {
		const clave = construirClave({ instante: INSTANTE, origen: ORIGEN_LOCAL, tipo: 'resguardo' });
		expect(clave.startsWith('becafe/resguardos/2026/10/')).toBe(true);
		expect(esquemaClaveCopia.safeParse(clave).success).toBe(true);
		expect(leerClave(clave)).toEqual({ origen: ORIGEN_LOCAL, tipo: 'resguardo' });
	});

	it('CA-289: las claves anteriores a F17 siguen leyéndose, sin origen', () => {
		expect(leerClave('becafe/2026/10/becafe-2026-10-23T01-00-00.000Z.tar.gz')).toEqual({ origen: null, tipo: 'diaria' });
		expect(leerClave('becafe/resguardos/2026/10/becafe-2026-10-26T10-00-00.000Z.tar.gz')).toEqual({ origen: null, tipo: 'resguardo' });
	});

	it('CA-289: una clave que no sigue el formato no inventa origen', () => {
		expect(leerClave('becafe/otra-cosa.tar.gz')).toEqual({ origen: null, tipo: 'diaria' });
	});

	it('CA-289: para cualquier instante, origen y tipo, construir y leer devuelven lo mismo', () => {
		const origen = fc.stringMatching(/^[a-z0-9]([a-z0-9-]{0,20}[a-z0-9])?(\.[a-z0-9]{2,6}){0,2}$/);
		fc.assert(
			fc.property(
				fc.date({ min: new Date('2024-01-01'), max: new Date('2040-01-01'), noInvalidDate: true }),
				origen,
				fc.constantFrom(...TIPOS_COPIA_CLAVE),
				(fecha, nombre, tipo) => {
					const clave = construirClave({ instante: fecha.toISOString(), origen: nombre, tipo });
					expect(esquemaClaveCopia.safeParse(clave).success).toBe(true);
					expect(leerClave(clave)).toEqual({ origen: nombre, tipo });
				},
			),
		);
	});
});
