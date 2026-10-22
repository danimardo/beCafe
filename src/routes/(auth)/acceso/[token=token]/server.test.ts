import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { generarEnlace, NOMBRE_COOKIE } from '#lib/server/auth';

// Enlace de acceso (RF-132, CA-132): el `load` no consume el enlace; la acción sí.
const CONTRASENA = 'contraseña de prueba larga';

describe('página de acceso por enlace', () => {
	let entorno: EntornoPrueba;
	let token: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
		const id = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id, nombre: 'Luis', correo: 'luis@ejemplo.es', rol: 'miembro', instante: entorno.reloj.ahora() }),
		);
		token = enTransaccion(entorno.ambiente.db, (tx) =>
			generarEnlace(tx, {
				usuarioId: id,
				tipo: 'invitacion',
				origen: 'aplicacion',
				creadoPor: null,
				instante: entorno.reloj.ahora(),
			}),
		).token;
	});

	afterEach(() => entorno.cerrar());

	function evento(ruta: string, cuerpo?: URLSearchParams) {
		return crearEventoAccion({
			locals: { ambiente: entorno.ambiente },
			ruta: '/(auth)/acceso/[token=token]',
			params: { token: ruta },
			cuerpo,
			cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
		});
	}

	it('CA-132: una contraseña de 14 caracteres devuelve 400 CONTRASENA_NO_VALIDA', async () => {
		const corta = 'catorce-chars!'.slice(0, 14);
		const cuerpo = new URLSearchParams({ contrasena: corta, repeticion: corta });

		const { estado, datos } = desenvolverFallo(await actions.default(evento(token, cuerpo)));

		expect(estado).toBe(400);
		expect(datos).toMatchObject({ errores: { contrasena: { codigo: 'CONTRASENA_NO_VALIDA' } } });
	});

	it('con las dos contraseñas distintas devuelve 400 sin tocar el enlace', async () => {
		const cuerpo = new URLSearchParams({ contrasena: CONTRASENA, repeticion: 'otra contraseña distinta' });

		const { estado } = desenvolverFallo(await actions.default(evento(token, cuerpo)));

		expect(estado).toBe(400);
	});

	it('CA-132: con un enlace válido define la contraseña, deja la cookie y redirige a la raíz', async () => {
		const cuerpo = new URLSearchParams({ contrasena: CONTRASENA, repeticion: CONTRASENA });
		const e = evento(token, cuerpo);

		let redireccion: { status: number; location: string } | undefined;
		try {
			await actions.default(e);
		} catch (error) {
			if (!isRedirect(error)) throw error;
			redireccion = { status: error.status, location: error.location };
		}

		expect(redireccion).toEqual({ status: 303, location: '/' });
		expect(e.cookies.get(NOMBRE_COOKIE)).toBeDefined();
	});

	it('CA-132: un enlace ya usado devuelve 410 ENLACE_NO_VALIDO', async () => {
		const cuerpo = new URLSearchParams({ contrasena: CONTRASENA, repeticion: CONTRASENA });
		try {
			await actions.default(evento(token, cuerpo));
		} catch {
			// La primera vez el enlace se usa y SvelteKit lanza la redirección.
		}

		const { estado, datos } = desenvolverFallo(await actions.default(evento(token, cuerpo)));

		expect(estado).toBe(410);
		expect(datos).toMatchObject({ errores: { general: { codigo: 'ENLACE_NO_VALIDO' } } });
	});
});
