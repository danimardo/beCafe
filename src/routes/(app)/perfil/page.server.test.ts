import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import {
	crearActor,
	crearSesion,
	definirContrasenaConEnlace,
	generarEnlace,
	NOMBRE_COOKIE,
	resolverSesion,
	type Actor,
} from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';

// Perfil (RF-137, RF-138, CA-137): cambio de contraseña con sus errores y cierre de sesiones.
const INSTANTE = '2026-10-21T09:00:00.000Z';
const CONTRASENA_ACTUAL = 'contraseña de prueba actual';
const CONTRASENA_NUEVA = 'contraseña de prueba nueva';

describe('acciones de perfil', () => {
	let entorno: EntornoPrueba;
	let usuarioId: string;

	beforeEach(async () => {
		entorno = crearEntornoPrueba(INSTANTE);
		usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre: 'Luis', correo: 'luis@ejemplo.es', rol: 'miembro', instante: INSTANTE }),
		);
		// Contraseña definida por el flujo real de enlace; también abre la sesión actual.
		const { token } = enTransaccion(entorno.ambiente.db, (tx) =>
			generarEnlace(tx, { usuarioId, tipo: 'invitacion', origen: 'aplicacion', creadoPor: null, instante: INSTANTE }),
		);
		await definirContrasenaConEnlace(entorno.ambiente.db, { token, contrasena: CONTRASENA_ACTUAL, instante: INSTANTE });
	});

	afterEach(() => entorno.cerrar());

	function actorDeSesion(token: string): Actor {
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	function sesionAbierta(): string {
		return enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
	}

	function ejecutar(accion: 'cambiarContrasena' | 'cerrarSesionesGlobal', actor: Actor | undefined, datos: Record<string, string>) {
		return actions[accion](
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/perfil',
				params: {},
				cuerpo: new URLSearchParams(datos),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	const CAMBIO = { contrasenaActual: CONTRASENA_ACTUAL, contrasenaNueva: CONTRASENA_NUEVA, repeticion: CONTRASENA_NUEVA };

	it('CA-137: cambiar la contraseña cierra las demás sesiones y deja abierta la actual', async () => {
		const tokenActual = sesionAbierta();
		const otra = sesionAbierta();

		const resultado = await ejecutar('cambiarContrasena', actorDeSesion(tokenActual), CAMBIO);

		expect(resultado).toEqual({ confirmacion: 'Contraseña cambiada. Las demás sesiones se han cerrado.' });
		expect(resolverSesion(entorno.ambiente.db, otra, INSTANTE)).toBeNull();
		expect(resolverSesion(entorno.ambiente.db, tokenActual, INSTANTE)).not.toBeNull();
	});

	it('la contraseña actual incorrecta devuelve el fallo en su campo y no cambia nada', async () => {
		const tokenActual = sesionAbierta();

		const { datos } = desenvolverFallo(
			await ejecutar('cambiarContrasena', actorDeSesion(tokenActual), { ...CAMBIO, contrasenaActual: 'otra contraseña equivocada' }),
		);

		expect(datos).toMatchObject({ errores: { contrasenaActual: { codigo: 'CREDENCIALES_INCORRECTAS' } } });
		expect(resolverSesion(entorno.ambiente.db, tokenActual, INSTANTE)).not.toBeNull();
	});

	it('una contraseña nueva que no pasa la lista de comunes devuelve 400 en su campo', async () => {
		const tokenActual = sesionAbierta();

		const { estado, datos } = desenvolverFallo(
			await ejecutar('cambiarContrasena', actorDeSesion(tokenActual), {
				...CAMBIO,
				contrasenaNueva: 'contraseña',
				repeticion: 'contraseña',
			}),
		);

		expect(estado).toBe(400);
		expect(datos).toHaveProperty(['errores', 'contrasenaNueva']);
	});

	it('las repeticiones distintas se rechazan en el campo de la repetición sin tocar la contraseña', async () => {
		const tokenActual = sesionAbierta();

		const { datos } = desenvolverFallo(
			await ejecutar('cambiarContrasena', actorDeSesion(tokenActual), { ...CAMBIO, repeticion: 'otra contraseña de prueba' }),
		);

		expect(datos).toHaveProperty(['errores', 'repeticion']);
	});

	it('los valores que vuelven al formulario nunca llevan contraseñas', async () => {
		const tokenActual = sesionAbierta();

		const { datos } = desenvolverFallo(
			await ejecutar('cambiarContrasena', actorDeSesion(tokenActual), { ...CAMBIO, contrasenaActual: 'otra contraseña equivocada' }),
		);

		expect(JSON.stringify(datos)).not.toContain('contraseña de prueba');
		expect(JSON.stringify(datos)).not.toContain('otra contraseña equivocada');
	});

	it('sin sesión, cambiar la contraseña devuelve SIN_SESION', async () => {
		const { datos } = desenvolverFallo(await ejecutar('cambiarContrasena', undefined, CAMBIO));

		expect(datos).toMatchObject({ errores: { general: { codigo: 'SIN_SESION' } } });
	});

	it('cerrar sesión en todos los dispositivos borra todas las sesiones, la cookie y redirige a la entrada', async () => {
		const tokenActual = sesionAbierta();
		const otra = sesionAbierta();
		const evento = crearEventoAccion({
			locals: { ambiente: entorno.ambiente, actor: actorDeSesion(tokenActual) },
			ruta: '/(app)/perfil',
			params: {},
		});

		let redireccion: { status: number; location: string } | undefined;
		try {
			await actions.cerrarSesionesGlobal(evento);
		} catch (error) {
			if (!isRedirect(error)) throw error;
			redireccion = { status: error.status, location: error.location };
		}

		expect(redireccion).toEqual({ status: 303, location: '/login' });
		expect(resolverSesion(entorno.ambiente.db, tokenActual, INSTANTE)).toBeNull();
		expect(resolverSesion(entorno.ambiente.db, otra, INSTANTE)).toBeNull();
		expect(evento.cookies.get(NOMBRE_COOKIE)).toBeUndefined();
	});
});
