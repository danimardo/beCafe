import { createECDH } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { clavePublicaDesde } from './entrega-push';

// Derivación de la clave pública VAPID desde la privada (plan F6 D6): el servidor no guarda una segunda copia.
describe('clavePublicaDesde', () => {
	it('deriva la misma clave pública que generó el par, como punto P-256 sin comprimir', () => {
		const par = createECDH('prime256v1');
		par.generateKeys();
		const privada = par.getPrivateKey('base64url');
		const publica = par.getPublicKey('base64url');

		const derivada = clavePublicaDesde(privada);

		expect(derivada).toBe(publica);
		expect(Buffer.from(derivada, 'base64url')).toHaveLength(65);
		expect(Buffer.from(derivada, 'base64url')[0]).toBe(0x04);
	});
});
