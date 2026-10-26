import { existsSync, readdirSync } from 'node:fs';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, type Rol } from '#lib/server/usuarios';
import { z } from 'zod';

// Acción de alta (RF-130, RF-131, CA-130, CA-131): permisos, reautenticación, CORREO_DUPLICADO y valores sin secretos.
const INSTANTE = '2026-10-21T09:00:00.000Z';
const ORIGEN = 'http://localhost:4300';
const DIECISEIS_MINUTOS = 16 * 60 * 1000;

describe('acción de alta de personas', () => {
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

	function alta(actor: Actor | undefined, datos: Record<string, string | File>) {
		const cuerpo = new FormData();
		for (const [clave, valor] of Object.entries(datos)) cuerpo.append(clave, valor);
		return altaConCuerpo(actor, cuerpo);
	}

	function altaConCuerpo(actor: Actor | undefined, cuerpo: FormData) {
		return actions.alta(
			crearEventoAccion({
				locals: { ambiente: { ...entorno.ambiente, origen: ORIGEN }, actor },
				ruta: '/(app)/admin/usuarios',
				params: {},
				cuerpo,
			}),
		);
	}

	const DATOS = { nombre: 'Pedro', email: 'pedro@ejemplo.es', rol: 'miembro' };

	it('un miembro recibe 403 SIN_PERMISO y el intento queda registrado', async () => {
		const miembro = actorDe(personaCon('miembro', 'luis@ejemplo.es'));

		const { estado, datos } = desenvolverFallo(await alta(miembro, DATOS));

		expect(estado).toBe(403);
		expect(datos).toMatchObject({ errores: { general: { codigo: 'SIN_PERMISO' } } });
		expect(entorno.eventos()).toContainEqual(expect.objectContaining({ codigo: 'auth.permiso_denegado' }));
	});

	it('CA-130 y CA-131: un administrador da de alta a Pedro y recibe un enlace de invitación de 24 horas, una sola vez', async () => {
		const admin = actorDe(personaCon('administrador', 'ana@ejemplo.es'));

		const resultado = await alta(admin, DATOS);

		const { enlace, expiraEn, confirmacion, origen } = z
			.object({ enlace: z.string(), expiraEn: z.string(), confirmacion: z.string(), origen: z.string() })
			.parse(resultado);
		// CA-239: la página pinta el enlace bajo el botón del formulario que lo generó.
		expect(origen).toBe('alta');
		expect(enlace.startsWith(`${ORIGEN}/acceso/`)).toBe(true);
		expect(expiraEn).toBe('2026-10-22T09:00:00.000Z');
		expect(confirmacion).toBe('Persona dada de alta. Copia el enlace y envíaselo.');
	});

	it('CORREO_DUPLICADO: un correo ya usado devuelve 409 en el campo del correo', async () => {
		const admin = actorDe(personaCon('administrador', 'ana@ejemplo.es'));
		personaCon('miembro', 'pedro@ejemplo.es');

		const { estado, datos } = desenvolverFallo(await alta(admin, { ...DATOS, email: 'PEDRO@ejemplo.es' }));

		expect(estado).toBe(409);
		expect(datos).toMatchObject({ errores: { email: { codigo: 'CORREO_DUPLICADO' } } });
	});

	it('CA-138: con la ventana vencida y sin contraseña, devuelve 401 en el campo de la contraseña actual', async () => {
		const admin = actorDe(personaCon('administrador', 'ana@ejemplo.es'));
		entorno.reloj.avanzar(DIECISEIS_MINUTOS);

		const { estado, datos } = desenvolverFallo(await alta(admin, DATOS));

		expect(estado).toBe(401);
		expect(datos).toMatchObject({ errores: { contrasenaActual: { codigo: 'REAUTENTICACION_REQUERIDA' } } });
	});

	it('los valores que vuelven al formulario nunca llevan la contraseña', async () => {
		const admin = actorDe(personaCon('administrador', 'ana@ejemplo.es'));
		entorno.reloj.avanzar(DIECISEIS_MINUTOS);

		const { datos } = desenvolverFallo(await alta(admin, { ...DATOS, contrasenaActual: 'una contraseña de prueba' }));

		expect(datos.valores).not.toHaveProperty('contrasenaActual');
		expect(JSON.stringify(datos)).not.toContain('una contraseña de prueba');
	});

	it('un nombre vacío devuelve 400 en el campo del nombre', async () => {
		const admin = actorDe(personaCon('administrador', 'ana@ejemplo.es'));

		const { estado, datos } = desenvolverFallo(await alta(admin, { ...DATOS, nombre: '   ' }));

		expect(estado).toBe(400);
		expect(datos).toHaveProperty(['errores', 'nombre']);
	});
	it('CA-223: el alta con foto válida la guarda; con una foto de 6 MB responde 400, no crea a la persona y no deja archivos', async () => {
		const admin = actorDe(personaCon('administrador', 'ana@ejemplo.es'));
		const archivos = (): string[] => (existsSync(entorno.ambiente.directorioFotos) ? readdirSync(entorno.ambiente.directorioFotos) : []);
		const jpeg = new Uint8Array(
			await sharp({ create: { width: 320, height: 240, channels: 3, background: { r: 90, g: 50, b: 30 } } })
				.jpeg()
				.toBuffer(),
		);

		const grande = desenvolverFallo(
			await alta(admin, { ...DATOS, foto: new File([new Uint8Array(6 * 1024 * 1024)], 'grande.jpg', { type: 'image/jpeg' }) }),
		);
		expect(grande.estado).toBe(400);
		expect(grande.datos).toHaveProperty('errores.foto');
		expect(grande.datos).toMatchObject({ valores: { nombre: 'Pedro' } });
		expect(JSON.stringify(grande.datos)).not.toContain('grande.jpg');
		expect(archivos()).toEqual([]);

		const resultado = await alta(admin, { ...DATOS, foto: new File([jpeg], 'foto.jpg', { type: 'image/jpeg' }) });
		expect(z.object({ enlace: z.string() }).safeParse(resultado).success).toBe(true);
		expect(archivos()).toHaveLength(1);
	});
});
