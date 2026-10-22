import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cambiarContrasena } from './cambiar-contrasena';
import { crearSesion, resolverSesion, hashToken } from './sesiones';
import { CONTRASENA_VALIDA, crearPersona, definirContrasena } from './pruebas/persona';
import { enTransaccion } from '../plataforma';
import { crearEntornoPrueba, type EntornoPrueba } from '../plataforma/pruebas/entorno-prueba';

const NUEVA = 'otra contraseña muy larga';

describe('cambiar contraseña (RF-137, aclaración 9, CA-137)', () => {
	let entorno: EntornoPrueba;
	let usuarioId: string;

	beforeEach(async () => {
		entorno = crearEntornoPrueba();
		const persona = crearPersona(entorno.ambiente, { correo: 'ana@ejemplo.es' });
		usuarioId = persona.id;
		await definirContrasena(entorno.ambiente, persona);
	});

	afterEach(() => entorno.cerrar());

	const abrir = () => enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: entorno.reloj.ahora() }));
	const resolver = (token: string) => resolverSesion(entorno.ambiente.db, token, entorno.reloj.ahora());

	it('CA-137: cambiar desde el perfil cierra las demás sesiones y mantiene la actual', async () => {
		const otra = abrir();
		const actual = abrir();
		await cambiarContrasena(entorno.ambiente.db, {
			usuarioId,
			sesionIdHash: hashToken(actual),
			contrasenaActual: CONTRASENA_VALIDA,
			contrasenaNueva: NUEVA,
			instante: entorno.reloj.ahora(),
		});
		expect(resolver(otra)).toBeNull();
		expect(resolver(actual)).not.toBeNull();
	});

	it('CA-137: la contraseña actual incorrecta rechaza el cambio sin tocar las sesiones', async () => {
		const otra = abrir();
		await expect(
			cambiarContrasena(entorno.ambiente.db, {
				usuarioId,
				sesionIdHash: hashToken(abrir()),
				contrasenaActual: 'no es la actual',
				contrasenaNueva: NUEVA,
				instante: entorno.reloj.ahora(),
			}),
		).rejects.toMatchObject({ codigo: 'CREDENCIALES_INCORRECTAS' });
		expect(resolver(otra)).not.toBeNull();
	});

	it('RN-053: la contraseña nueva se valida también en el cambio', async () => {
		await expect(
			cambiarContrasena(entorno.ambiente.db, {
				usuarioId,
				sesionIdHash: hashToken(abrir()),
				contrasenaActual: CONTRASENA_VALIDA,
				contrasenaNueva: 'corta',
				instante: entorno.reloj.ahora(),
			}),
		).rejects.toMatchObject({ codigo: 'CONTRASENA_NO_VALIDA' });
	});
});
