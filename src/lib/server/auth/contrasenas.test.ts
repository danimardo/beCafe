import { describe, expect, it } from 'vitest';
import { contrasenaAceptable, hashContrasena, verificarContrasena } from './contrasenas';

describe('contraseñas (RN-053)', () => {
	it('CA-132: rechaza 14 caracteres y acepta 15', () => {
		expect(contrasenaAceptable('a'.repeat(14))).toBe(false);
		expect(contrasenaAceptable('cafe-del-depto2')).toBe(true);
	});

	it('CA-132: acepta 256 caracteres y rechaza 257', () => {
		expect(contrasenaAceptable('x'.repeat(256))).toBe(true);
		expect(contrasenaAceptable('x'.repeat(257))).toBe(false);
	});

	it('cuenta los puntos de código después de NFC: 15 «é» descompuestas valen 15', () => {
		expect(contrasenaAceptable('é'.repeat(15))).toBe(true);
		expect(contrasenaAceptable('é'.repeat(14))).toBe(false);
	});

	it('rechaza una contraseña de la lista de bloqueo', () => {
		expect(contrasenaAceptable('1234567890123456')).toBe(false);
	});

	it('verifica el hash Argon2id y rechaza una contraseña distinta', async () => {
		const hash = await hashContrasena('contraseña de prueba larga');
		expect(hash.startsWith('$argon2id$')).toBe(true);
		await expect(verificarContrasena(hash, 'contraseña de prueba larga')).resolves.toBe(true);
		await expect(verificarContrasena(hash, 'otra contraseña distinta')).resolves.toBe(false);
	});

	it('un hash mal formado cuenta como incorrecto', async () => {
		await expect(verificarContrasena('no-es-un-hash', 'contraseña de prueba larga')).resolves.toBe(false);
	});
});
