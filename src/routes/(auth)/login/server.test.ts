import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { definirContrasenaConEnlace, generarEnlace, NOMBRE_COOKIE } from '#lib/server/auth';

const CONTRASENA_VALIDA = 'contraseña de prueba larga';

async function crearPersonaConContrasena(entorno: EntornoPrueba, correo: string): Promise<void> {
	const instante = entorno.reloj.ahora();
	const id = nuevoId();
	enTransaccion(entorno.ambiente.db, (tx) => crearUsuario(tx, { id, nombre: 'Persona de prueba', correo, rol: 'miembro', instante }));
	const { token } = enTransaccion(entorno.ambiente.db, (tx) =>
		generarEnlace(tx, { usuarioId: id, tipo: 'invitacion', origen: 'aplicacion', creadoPor: null, instante }),
	);
	await definirContrasenaConEnlace(entorno.ambiente.db, { token, contrasena: CONTRASENA_VALIDA, instante });
}

// Acción de inicio de sesión (RF-131, CA-133): validación, rechazo genérico y sesión nueva en éxito.
describe('acción de inicio de sesión', () => {
	let entorno: EntornoPrueba;

	beforeEach(async () => {
		entorno = crearEntornoPrueba();
		await crearPersonaConContrasena(entorno, 'ana@ejemplo.es');
	});

	afterEach(() => entorno.cerrar());

	function enviar(datos: Record<string, string>) {
		const evento = crearEventoAccion({
			locals: { ambiente: entorno.ambiente },
			ruta: '/(auth)/login',
			params: {},
			cuerpo: new URLSearchParams(datos),
			cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
		});
		return { evento, ejecutar: () => actions.default(evento) };
	}

	it('sin contraseña devuelve 400 con el error del campo y sin devolver el correo escrito como secreto', async () => {
		const { ejecutar } = enviar({ email: 'ana@ejemplo.es', contrasena: '' });

		const { estado, datos } = desenvolverFallo(await ejecutar());

		expect(estado).toBe(400);
		expect(datos).toMatchObject({ errores: { contrasena: { codigo: 'too_small' } }, valores: { email: 'ana@ejemplo.es' } });
		expect(datos.valores).not.toHaveProperty('contrasena');
	});

	it('CA-133: una contraseña incorrecta devuelve 401 con un mensaje único, sin contraseña en los valores', async () => {
		const { ejecutar } = enviar({ email: 'ana@ejemplo.es', contrasena: 'una contraseña incorrecta' });

		const { estado, datos } = desenvolverFallo(await ejecutar());

		expect(estado).toBe(401);
		expect(datos).toMatchObject({
			errores: { general: { codigo: 'CREDENCIALES_INCORRECTAS' } },
			valores: { email: 'ana@ejemplo.es' },
		});
		expect(JSON.stringify(datos)).not.toContain('una contraseña incorrecta');
	});

	it('con la contraseña correcta redirige a la raíz y deja la cookie de sesión', async () => {
		const { evento, ejecutar } = enviar({ email: 'ana@ejemplo.es', contrasena: CONTRASENA_VALIDA });

		let redireccion: { status: number; location: string } | undefined;
		try {
			await ejecutar();
		} catch (error) {
			if (!isRedirect(error)) throw error;
			redireccion = { status: error.status, location: error.location };
		}

		expect(redireccion).toEqual({ status: 303, location: '/' });
		expect(evento.cookies.get(NOMBRE_COOKIE)).toBeDefined();
	});
});
