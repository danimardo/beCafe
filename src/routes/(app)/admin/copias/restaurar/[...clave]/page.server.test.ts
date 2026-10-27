import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion } from '#lib/shared/pruebas/acciones';
import { crearActor, definirContrasenaConEnlace, generarEnlace, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';

// Acción de restaurar una copia (plan F14 D1, CA-254, contracts/restauracion.md). El `load` lo cubre el E2E (AGENTS §7).
// Ninguna prueba habla con un bucket real: el punto de acceso apunta a un puerto sin nadie escuchando.
const INSTANTE = '2026-10-26T10:00:00.000Z';
const CLAVE = 'becafe/2026/10/becafe-2026-10-25T02-00-00.000Z.tar.gz';
const CONTRASENA = 'una contraseña larga de prueba';

describe('restaurar una copia desde el formulario (CA-254, RF-254)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		entorno.ambiente.copias.s3 = {
			endpoint: 'http://127.0.0.1:1',
			bucket: 'prueba',
			region: 'eu-south-2',
			claveAcceso: 'clave-de-prueba',
			claveSecreta: 'secreto-de-prueba',
		};
	});

	afterEach(() => entorno.cerrar());

	async function sesionDe(rol: 'miembro' | 'administrador'): Promise<Actor> {
		const db = entorno.ambiente.db;
		const usuarioId = nuevoId();
		enTransaccion(db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre: 'Ana', correo: `ana-${usuarioId}@ejemplo.es`, rol, instante: INSTANTE }),
		);
		const { token } = enTransaccion(db, (tx) =>
			generarEnlace(tx, { usuarioId, tipo: 'invitacion', origen: 'aplicacion', creadoPor: null, instante: INSTANTE }),
		);
		const { sesionToken } = await definirContrasenaConEnlace(db, { token, contrasena: CONTRASENA, instante: INSTANTE });
		const sesion = resolverSesion(db, sesionToken, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	function restaurar(actor: Actor | undefined, campos: Record<string, string>) {
		return actions.restaurar(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/admin/copias/restaurar/[...clave]',
				params: { clave: CLAVE },
				cuerpo: new URLSearchParams(campos),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('CA-254: una contraseña incorrecta se rechaza en su campo y no devuelve la contraseña', async () => {
		const admin = await sesionDe('administrador');

		const resultado = await restaurar(admin, { clave: CLAVE, contrasena: 'contraseña equivocada' });

		expect(resultado).toMatchObject({
			status: 400,
			data: { errores: { contrasena: { mensaje: 'La contraseña no es correcta.' } }, valores: { clave: CLAVE } },
		});
		expect(JSON.stringify(resultado)).not.toContain('equivocada');
		expect(entorno.ambiente.mantenimiento.restaurando).toBe(false);
	});

	it('EV-113: si el bucket no responde, devuelve el rechazo 502 y deja la aplicación aceptando registros', async () => {
		const admin = await sesionDe('administrador');

		const resultado = await restaurar(admin, { clave: CLAVE, contrasena: CONTRASENA });

		expect(resultado).toMatchObject({ status: 502, data: { errores: { general: { codigo: 'BUCKET' } } } });
		expect(entorno.ambiente.mantenimiento.restaurando).toBe(false);
	});

	it('una clave que no es de una copia se rechaza por su esquema', async () => {
		const admin = await sesionDe('administrador');

		const resultado = await restaurar(admin, { clave: '../../etc/passwd', contrasena: CONTRASENA });

		expect(resultado).toMatchObject({ status: 400 });
	});

	it('CA-254: un miembro recibe 403', async () => {
		const miembro = await sesionDe('miembro');

		await expect(restaurar(miembro, { clave: CLAVE, contrasena: CONTRASENA })).rejects.toMatchObject({ status: 403 });
	});

	it('CA-253: sin S3 configurado responde 404', async () => {
		const admin = await sesionDe('administrador');
		entorno.ambiente.copias.s3 = undefined;

		await expect(restaurar(admin, { clave: CLAVE, contrasena: CONTRASENA })).rejects.toMatchObject({ status: 404 });
	});

	it('sin sesión, redirige a la entrada', async () => {
		await expect(restaurar(undefined, { clave: CLAVE, contrasena: CONTRASENA })).rejects.toMatchObject({ status: 303 });
	});
});
