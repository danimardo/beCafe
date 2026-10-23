import { describe, expect, it } from 'vitest';
import { esquemaBajaSuscripcion, esquemaMensajePush, esquemaSuscripcion } from './push';

// Contrato v1 de la suscripción push (contracts/api-push.md).
const suscripcion = { version: 1, endpoint: 'https://push.ejemplo.es/abc', claves: { p256dh: 'clave', auth: 'auth' } };

describe('esquemaSuscripcion', () => {
	it('acepta una suscripción v1 con https', () => {
		expect(esquemaSuscripcion.safeParse(suscripcion).success).toBe(true);
	});

	it('rechaza http, una versión distinta y una clave extra', () => {
		expect(esquemaSuscripcion.safeParse({ ...suscripcion, endpoint: 'http://push.ejemplo.es/abc' }).success).toBe(false);
		expect(esquemaSuscripcion.safeParse({ ...suscripcion, version: 2 }).success).toBe(false);
		expect(esquemaSuscripcion.safeParse({ ...suscripcion, usuarioId: 'x' }).success).toBe(false);
	});

	it('limita el endpoint a 1000 caracteres y las claves a 200 y 100', () => {
		expect(esquemaSuscripcion.safeParse({ ...suscripcion, endpoint: `https://e.es/${'a'.repeat(1000)}` }).success).toBe(false);
		expect(esquemaSuscripcion.safeParse({ ...suscripcion, claves: { p256dh: 'a'.repeat(201), auth: 'a' } }).success).toBe(false);
		expect(esquemaSuscripcion.safeParse({ ...suscripcion, claves: { p256dh: 'a', auth: 'a'.repeat(101) } }).success).toBe(false);
	});
});

describe('esquemaBajaSuscripcion', () => {
	it('acepta solo el endpoint y la versión', () => {
		expect(esquemaBajaSuscripcion.safeParse({ version: 1, endpoint: suscripcion.endpoint }).success).toBe(true);
		expect(esquemaBajaSuscripcion.safeParse({ version: 1, endpoint: suscripcion.endpoint, claves: {} }).success).toBe(false);
	});
});

describe('esquemaMensajePush', () => {
	const mensaje = { version: 1, tipo: 'stock_bajo', titulo: 'Stock bajo', texto: 'Quedan 2.', enlace: '/' };

	it('acepta un mensaje v1 con enlace relativo', () => {
		expect(esquemaMensajePush.safeParse(mensaje).success).toBe(true);
	});

	it('rechaza un tipo desconocido y un enlace que no empieza por /', () => {
		expect(esquemaMensajePush.safeParse({ ...mensaje, tipo: 'otro' }).success).toBe(false);
		expect(esquemaMensajePush.safeParse({ ...mensaje, enlace: 'https://ajeno.es' }).success).toBe(false);
	});
});
