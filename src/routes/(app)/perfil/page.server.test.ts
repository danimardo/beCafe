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
import { crearUsuario, leerFotoUsuario } from '#lib/server/usuarios';
import sharp from 'sharp';

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

describe('foto propia en el perfil (RF-208, CA-208)', () => {
	let entorno: EntornoPrueba;
	let usuarioId: string;
	let actor: Actor;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre: 'Luis', correo: 'luis@ejemplo.es', rol: 'miembro', instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		actor = crearActor(sesion);
	});

	afterEach(() => entorno.cerrar());

	function ejecutar(accion: 'foto' | 'quitarFoto', conActor: Actor | undefined, cuerpo: FormData) {
		return actions[accion](
			crearEventoAccion({ locals: { ambiente: entorno.ambiente, actor: conActor }, ruta: '/(app)/perfil', params: {}, cuerpo }),
		);
	}

	async function fotoValida(): Promise<File> {
		const imagen = await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 120, g: 70, b: 40 } } })
			.png()
			.toBuffer();
		return new File([new Uint8Array(imagen)], 'foto.png', { type: 'image/png' });
	}

	it('CA-208: subir una foto válida la guarda en la cuenta y quitarla la borra', async () => {
		const subida = await ejecutar('foto', actor, formulario({ foto: await fotoValida() }));
		expect(subida).toEqual({ confirmacion: 'Foto guardada.' });
		expect(leerFotoUsuario(entorno.ambiente.db, usuarioId)).toMatch(/\.webp$/);

		const quitada = await ejecutar('quitarFoto', actor, formulario({ quitar: 'si' }));
		expect(quitada).toEqual({ confirmacion: 'Foto quitada.' });
		expect(leerFotoUsuario(entorno.ambiente.db, usuarioId)).toBeNull();
	});

	it('CA-208: un archivo que no es una imagen devuelve el fallo en el campo foto y no cambia nada', async () => {
		const texto = new File([new TextEncoder().encode('no soy una imagen')], 'foto.png', { type: 'image/png' });

		const { datos } = desenvolverFallo(await ejecutar('foto', actor, formulario({ foto: texto })));

		expect(datos).toMatchObject({ errores: { foto: { codigo: 'FOTO_NO_VALIDA' } } });
		expect(leerFotoUsuario(entorno.ambiente.db, usuarioId)).toBeNull();
	});

	it('CA-208: sin archivo o con más de 5 MB devuelve 400 en el campo foto', async () => {
		const grande = new File([new Uint8Array(6 * 1024 * 1024)], 'foto.png', { type: 'image/png' });

		for (const cuerpo of [formulario({}), formulario({ foto: new File([], 'vacio.png') }), formulario({ foto: grande })]) {
			const { estado, datos } = desenvolverFallo(await ejecutar('foto', actor, cuerpo));
			expect(estado).toBe(400);
			expect(datos).toHaveProperty(['errores', 'foto']);
		}
	});

	it('quitar la foto exige la confirmación y, sin sesión, devuelve el fallo de sesión', async () => {
		expect(desenvolverFallo(await ejecutar('quitarFoto', actor, formulario({}))).estado).toBe(400);
		expect(desenvolverFallo(await ejecutar('foto', undefined, formulario({ foto: await fotoValida() }))).datos).toMatchObject({
			errores: { general: { codigo: 'SIN_SESION' } },
		});
	});
});

function formulario(campos: Record<string, string | File>): FormData {
	const datos = new FormData();
	for (const [nombre, valor] of Object.entries(campos)) datos.append(nombre, valor);
	return datos;
}
