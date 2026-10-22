import { describe, expect, it } from 'vitest';
import { decidirPuertaPrivacidad } from './puerta-privacidad';

describe('puerta de privacidad (RF-160, CA-160)', () => {
	it('CA-160: con privacidad pendiente, una página en GET redirige a /aceptar-privacidad', () => {
		expect(decidirPuertaPrivacidad('/perfil', 'GET', true)).toBe('redirigir');
		expect(decidirPuertaPrivacidad('/admin/usuarios', 'GET', true)).toBe('redirigir');
	});

	it('CA-160: un POST o una ruta /api/* reciben 403, sin redirección', () => {
		expect(decidirPuertaPrivacidad('/perfil', 'POST', true)).toBe('rechazar');
		expect(decidirPuertaPrivacidad('/api/consumos', 'GET', true)).toBe('rechazar');
	});

	it('CA-160: las rutas libres no pasan por la puerta aunque la privacidad esté pendiente', () => {
		for (const ruta of ['/aceptar-privacidad', '/logout', '/api/salud', '/api/registro-cliente', '/robots.txt']) {
			expect(decidirPuertaPrivacidad(ruta, 'POST', true)).toBe('continuar');
		}
	});

	it('sin privacidad pendiente, todo continúa', () => {
		expect(decidirPuertaPrivacidad('/perfil', 'GET', false)).toBe('continuar');
	});
});
