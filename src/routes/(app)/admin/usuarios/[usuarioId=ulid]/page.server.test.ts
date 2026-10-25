import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, leerFotoUsuario, type Rol } from '#lib/server/usuarios';
import sharp from 'sharp';
import { z } from 'zod';

// Acciones de una persona (RF-133, RF-134, RF-136; CA-134, CA-136, CA-138). Los casos de baja están en `auth/reactivar.test.ts`.
const INSTANTE = '2026-10-21T09:00:00.000Z';
const ORIGEN = 'http://localhost:4300';
const DIECISEIS_MINUTOS = 16 * 60 * 1000;

describe('acciones sobre una persona', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function personaCon(rol: Rol, correo: string): string {
		const id = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => crearUsuario(tx, { id, nombre: 'Persona', correo, rol, instante: INSTANTE }));
		return id;
	}

	function actorDe(usuarioId: string): Actor {
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	function ejecutar(accion: keyof typeof actions, actor: Actor | undefined, usuarioId: string, datos: Record<string, string>) {
		return actions[accion](
			crearEventoAccion({
				locals: { ambiente: { ...entorno.ambiente, origen: ORIGEN }, actor },
				ruta: '/(app)/admin/usuarios/[usuarioId=ulid]',
				params: { usuarioId },
				cuerpo: new URLSearchParams(datos),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('un miembro no puede cambiar el rol de otra persona: 403 SIN_PERMISO', async () => {
		const miembro = actorDe(personaCon('miembro', 'luis@ejemplo.es'));
		const otra = personaCon('miembro', 'pedro@ejemplo.es');

		const { estado, datos } = desenvolverFallo(await ejecutar('cambiarRol', miembro, otra, { rol: 'administrador' }));

		expect(estado).toBe(403);
		expect(datos).toMatchObject({ errores: { general: { codigo: 'SIN_PERMISO' } } });
	});

	it('CA-134: un administrador cambia el rol de otra persona y recibe la confirmación', async () => {
		const admin = actorDe(personaCon('administrador', 'ana@ejemplo.es'));
		const otra = personaCon('miembro', 'pedro@ejemplo.es');

		const resultado = await ejecutar('cambiarRol', admin, otra, { rol: 'administrador' });

		expect(resultado).toEqual({ confirmacion: 'Rol cambiado.' });
	});

	it('ULTIMO_ADMIN: el último administrador no puede quitarse el rol: 409 en el aviso general', async () => {
		const admin = personaCon('administrador', 'ana@ejemplo.es');

		const { estado, datos } = desenvolverFallo(await ejecutar('cambiarRol', actorDe(admin), admin, { rol: 'miembro' }));

		expect(estado).toBe(409);
		expect(datos).toMatchObject({ errores: { general: { codigo: 'ULTIMO_ADMIN' } } });
	});

	it('CA-138: con la ventana vencida, cambiar el rol pide la contraseña actual: 401 en su campo', async () => {
		const admin = actorDe(personaCon('administrador', 'ana@ejemplo.es'));
		const otra = personaCon('miembro', 'pedro@ejemplo.es');
		entorno.reloj.avanzar(DIECISEIS_MINUTOS);

		const { estado, datos } = desenvolverFallo(await ejecutar('cambiarRol', admin, otra, { rol: 'administrador' }));

		expect(estado).toBe(401);
		expect(datos).toMatchObject({ errores: { contrasenaActual: { codigo: 'REAUTENTICACION_REQUERIDA' } } });
	});

	it('CA-136: reactivar a una persona que ya está activa devuelve 409 ESTADO_INCORRECTO', async () => {
		const admin = actorDe(personaCon('administrador', 'ana@ejemplo.es'));
		const otra = personaCon('miembro', 'pedro@ejemplo.es');

		const { estado, datos } = desenvolverFallo(await ejecutar('reactivar', admin, otra, {}));

		expect(estado).toBe(409);
		expect(datos).toMatchObject({ errores: { general: { codigo: 'ESTADO_INCORRECTO' } } });
	});

	it('generar un enlace para una persona activa devuelve el enlace y su confirmación', async () => {
		const admin = actorDe(personaCon('administrador', 'ana@ejemplo.es'));
		const otra = personaCon('miembro', 'pedro@ejemplo.es');

		const resultado = await ejecutar('generarEnlace', admin, otra, {});

		const { enlace, confirmacion } = z.object({ enlace: z.string(), confirmacion: z.string() }).parse(resultado);
		expect(enlace.startsWith(`${ORIGEN}/acceso/`)).toBe(true);
		expect(confirmacion).toBe('Enlace generado. Cópialo y envíaselo; no se volverá a mostrar.');
	});

	it('los valores de la reautenticación nunca vuelven al formulario', async () => {
		const admin = actorDe(personaCon('administrador', 'ana@ejemplo.es'));
		const otra = personaCon('miembro', 'pedro@ejemplo.es');
		entorno.reloj.avanzar(DIECISEIS_MINUTOS);

		const { datos } = desenvolverFallo(
			await ejecutar('cambiarRol', admin, otra, { rol: 'administrador', contrasenaActual: 'una contraseña de prueba' }),
		);

		expect(JSON.stringify(datos)).not.toContain('una contraseña de prueba');
	});
});

describe('foto de otra persona desde su ficha (RF-208, CA-208)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function personaCon(rol: Rol, correo: string): string {
		const id = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => crearUsuario(tx, { id, nombre: 'Persona', correo, rol, instante: INSTANTE }));
		return id;
	}

	function actorDe(usuarioId: string): Actor {
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	function ejecutar(accion: 'foto' | 'quitarFoto', actor: Actor, usuarioId: string, cuerpo: FormData) {
		return actions[accion](
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/admin/usuarios/[usuarioId=ulid]',
				params: { usuarioId },
				cuerpo,
			}),
		);
	}

	async function fotoValida(): Promise<FormData> {
		const imagen = await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 120, g: 70, b: 40 } } })
			.png()
			.toBuffer();
		const datos = new FormData();
		datos.append('foto', new File([new Uint8Array(imagen)], 'foto.png', { type: 'image/png' }));
		return datos;
	}

	it('CA-208: el administrador sube y quita la foto de otra persona', async () => {
		const admin = personaCon('administrador', 'ana@ejemplo.es');
		const otra = personaCon('miembro', 'marta@ejemplo.es');

		expect(await ejecutar('foto', actorDe(admin), otra, await fotoValida())).toEqual({ confirmacion: 'Foto guardada.' });
		expect(leerFotoUsuario(entorno.ambiente.db, otra)).not.toBeNull();

		const quitar = new FormData();
		quitar.append('quitar', 'si');
		expect(await ejecutar('quitarFoto', actorDe(admin), otra, quitar)).toEqual({ confirmacion: 'Foto quitada.' });
		expect(leerFotoUsuario(entorno.ambiente.db, otra)).toBeNull();
	});

	it('CA-208: un miembro no puede cambiar la foto de otra persona (SIN_PERMISO) y la foto no cambia', async () => {
		const miembro = personaCon('miembro', 'luis@ejemplo.es');
		const otra = personaCon('miembro', 'marta@ejemplo.es');

		const { datos } = desenvolverFallo(await ejecutar('foto', actorDe(miembro), otra, await fotoValida()));

		expect(datos).toMatchObject({ errores: { general: { codigo: 'SIN_PERMISO' } } });
		expect(leerFotoUsuario(entorno.ambiente.db, otra)).toBeNull();
	});
});
