import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { definirContrasenaConEnlace, generarEnlace } from './enlaces';
import { sesion } from './esquema';
import { crearSesion } from './sesiones';
import { iniciarSesion } from './iniciar-sesion';
import { CONTRASENA_VALIDA, crearPersona } from './pruebas/persona';
import { enTransaccion } from '../plataforma';
import { crearEntornoPrueba, type EntornoPrueba } from '../plataforma/pruebas/entorno-prueba';

describe('definir contraseña con un enlace (RF-132, RN-053, RN-051, CA-132)', () => {
	let entorno: EntornoPrueba;
	let usuarioId: string;
	let token: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
		usuarioId = crearPersona(entorno.ambiente, { correo: 'pedro@ejemplo.es' }).id;
		token = enTransaccion(entorno.ambiente.db, (tx) =>
			generarEnlace(tx, { usuarioId, tipo: 'invitacion', origen: 'aplicacion', creadoPor: null, instante: entorno.reloj.ahora() }),
		).token;
	});

	afterEach(() => entorno.cerrar());

	it('CA-132: rechaza 14 caracteres y acepta 15', async () => {
		await expect(
			definirContrasenaConEnlace(entorno.ambiente.db, { token, contrasena: 'a'.repeat(14), instante: entorno.reloj.ahora() }),
		).rejects.toMatchObject({ codigo: 'CONTRASENA_NO_VALIDA' });
		await expect(
			definirContrasenaConEnlace(entorno.ambiente.db, { token, contrasena: 'cafe-del-depto2', instante: entorno.reloj.ahora() }),
		).resolves.toMatchObject({ usuarioId });
	});

	it('RN-053: rechaza una contraseña de la lista de bloqueo', async () => {
		await expect(
			definirContrasenaConEnlace(entorno.ambiente.db, { token, contrasena: '1234567890123456', instante: entorno.reloj.ahora() }),
		).rejects.toMatchObject({ codigo: 'CONTRASENA_NO_VALIDA' });
	});

	it('RN-051: al definir la contraseña se borran las sesiones anteriores y se abre una nueva', async () => {
		const anterior = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: entorno.reloj.ahora() }));
		const { sesionToken } = await definirContrasenaConEnlace(entorno.ambiente.db, {
			token,
			contrasena: CONTRASENA_VALIDA,
			instante: entorno.reloj.ahora(),
		});
		const sesiones = entorno.base.db.select().from(sesion).where(eq(sesion.usuarioId, usuarioId)).all();
		expect(sesiones).toHaveLength(1);
		expect(sesiones[0]?.idHash).not.toBe(anterior);
		expect(sesionToken).not.toBe(anterior);
	});

	it('CA-132: tras el éxito, el enlace queda usado y la contraseña entra en el inicio de sesión', async () => {
		await definirContrasenaConEnlace(entorno.ambiente.db, { token, contrasena: CONTRASENA_VALIDA, instante: entorno.reloj.ahora() });
		await expect(
			iniciarSesion(entorno.ambiente.db, { correo: 'pedro@ejemplo.es', contrasena: CONTRASENA_VALIDA, instante: entorno.reloj.ahora() }),
		).resolves.toMatchObject({ usuarioId });
	});
});
