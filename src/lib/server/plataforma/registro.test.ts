import { describe, expect, it } from 'vitest';
import { crearRegistroFalso } from './pruebas/registro-falso';
import { RUTAS_REDACTADAS } from './registro';
import { esquemasEntorno } from '../../../env';

describe('registro de pruebas (constitución XVI)', () => {
	it('falla si un evento contiene un campo prohibido', () => {
		const registro = crearRegistroFalso();
		const campos = { origen: 'x', campo: 'x', incidencia: 'x', email: 'x' };
		expect(() => registro.registrar('dato.invalido', campos)).toThrow('campo prohibido');
	});

	it('falla si un valor tiene forma de correo, aunque la clave sea inocente', () => {
		const registro = crearRegistroFalso();
		expect(() => registro.registrar('dato.invalido', { origen: 'x', campo: 'ana@ejemplo.es', incidencia: 'x' })).toThrow('forma de correo');
	});

	it('guarda los eventos válidos con su nivel y su origen', () => {
		const registro = crearRegistroFalso();
		registro.registrar('auth.acceso_fallido', { motivo: 'credenciales' });
		expect(registro.eventos).toEqual([
			{ codigo: 'auth.acceso_fallido', nivel: 'warn', origen: 'servidor', campos: { motivo: 'credenciales' } },
		]);
	});
});

describe('redacción del registro (RNF-014)', () => {
	it('la configuración oculta cada dato personal o secreto conocido', () => {
		for (const clave of ['contrasena', 'token', 'cookie', 'enlace', 'email', 'nombre', 'importe']) {
			expect(RUTAS_REDACTADAS.some((ruta) => ruta.endsWith(`.${clave}`))).toBe(true);
		}
	});
});

describe('LOG_LEVEL no válido (RNF-014, arranque)', () => {
	it('un nivel fuera del conjunto cerrado no pasa el esquema', () => {
		expect(esquemasEntorno.LOG_LEVEL.safeParse('verbose').success).toBe(false);
		expect(esquemasEntorno.LOG_LEVEL.safeParse('warn').success).toBe(true);
	});
});
