import { describe, expect, it, vi } from 'vitest';

// Las variables llegan de `$app/env/private`; la prueba simula ese módulo y comprueba que `entorno` las expone sin cambiarlas.
vi.mock('$app/env/private', () => ({
	ORIGIN: 'https://becafe.ejemplo.es',
	DIRECTORIO_DATOS: '/datos',
	LOG_LEVEL: 'warn',
	ADMIN_INICIAL_EMAIL: 'admin@ejemplo.es',
	ADMIN_INICIAL_NOMBRE: 'Admin',
	VAPID_PRIVATE_KEY: undefined,
	VAPID_SUBJECT: undefined,
}));

describe('configuración de entorno (ARCHITECTURE.md §8)', () => {
	it('expone cada variable con su nombre y no permite modificarla', async () => {
		const { entorno } = await import('./entorno');

		expect(entorno).toEqual({
			origen: 'https://becafe.ejemplo.es',
			directorioDatos: '/datos',
			nivelLog: 'warn',
			adminInicialEmail: 'admin@ejemplo.es',
			adminInicialNombre: 'Admin',
			vapid: undefined,
		});
		expect(Object.isFrozen(entorno)).toBe(true);
	});
});
