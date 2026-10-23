import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST, DELETE } from './+server';
import { crearActor, crearSesion, resolverSesion } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { suscripcionPush } from '#lib/server/notificaciones';
import { crearEventoAccion } from '#lib/shared/pruebas/acciones';

// Contrato v1 de la suscripción push (contracts/api-push.md; RF-105, plan D6).
const INSTANTE = '2026-10-23T10:00:00.000Z';
const ENDPOINT = 'https://push.ejemplo.test/dispositivo-1';

function suscripcion(extra: Record<string, unknown> = {}, endpoint = ENDPOINT): string {
	return JSON.stringify({ version: 1, endpoint, claves: { p256dh: 'clave-p256dh', auth: 'clave-auth' }, ...extra });
}

describe('POST y DELETE /api/push/suscripcion (contrato v1)', () => {
	let entorno: EntornoPrueba;
	let ana: string;
	let beatriz: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		ana = nuevoId();
		beatriz = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => {
			crearUsuario(tx, { id: ana, nombre: 'Ana', correo: `ana-${ana}@ejemplo.test`, rol: 'miembro', instante: INSTANTE });
			crearUsuario(tx, { id: beatriz, nombre: 'Beatriz', correo: `bea-${beatriz}@ejemplo.test`, rol: 'miembro', instante: INSTANTE });
		});
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function localsDe(usuarioId: string | undefined) {
		if (usuarioId === undefined) return { ambiente: entorno.ambiente };
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return { ambiente: entorno.ambiente, actor: crearActor(sesion) };
	}

	function enviar(metodo: 'POST' | 'DELETE', usuarioId: string | undefined, cuerpo: string) {
		const evento = crearEventoAccion({
			locals: localsDe(usuarioId),
			ruta: '/api/push/suscripcion',
			params: {},
			metodo,
			cabeceras: { 'content-type': 'application/json' },
			cuerpo,
		});
		return metodo === 'POST' ? POST(evento) : DELETE(evento);
	}

	function filas() {
		return entorno.ambiente.db.select().from(suscripcionPush).all();
	}

	it('401 SIN_SESION sin sesión', async () => {
		const respuesta = await enviar('POST', undefined, suscripcion());
		expect(respuesta.status).toBe(401);
		expect(await respuesta.json()).toMatchObject({ codigo: 'SIN_SESION' });
	});

	it('201 con una suscripción nueva de la persona con sesión', async () => {
		const respuesta = await enviar('POST', ana, suscripcion());
		expect(respuesta.status).toBe(201);
		expect(filas()).toEqual([
			expect.objectContaining({ usuarioId: ana, endpoint: ENDPOINT, clavePdh: 'clave-p256dh', claveAuth: 'clave-auth' }),
		]);
	});

	it('201 con el mismo endpoint actualiza las claves sin duplicar la fila', async () => {
		await enviar('POST', ana, suscripcion());
		const respuesta = await enviar('POST', ana, suscripcion({ claves: { p256dh: 'nueva', auth: 'nueva' } }));

		expect(respuesta.status).toBe(201);
		expect(filas()).toHaveLength(1);
		expect(filas()[0]).toMatchObject({ clavePdh: 'nueva', claveAuth: 'nueva' });
	});

	it('201 y pasa a la persona con sesión si el endpoint era de otra (dispositivo compartido)', async () => {
		await enviar('POST', ana, suscripcion());
		const respuesta = await enviar('POST', beatriz, suscripcion());

		expect(respuesta.status).toBe(201);
		expect(filas()).toHaveLength(1);
		expect(filas()[0]?.usuarioId).toBe(beatriz);
	});

	it('400 VALIDACION con una clave extra, sin repetir el valor recibido', async () => {
		const respuesta = await enviar('POST', ana, suscripcion({ usuarioId: 'valor-secreto' }));
		const cuerpo = await respuesta.text();

		expect(respuesta.status).toBe(400);
		expect(cuerpo).toContain('VALIDACION');
		expect(cuerpo).not.toContain('valor-secreto');
		expect(filas()).toHaveLength(0);
	});

	it('400 con un endpoint que no es https', async () => {
		const respuesta = await enviar('POST', ana, suscripcion({}, 'http://push.ejemplo.test/x'));
		expect(respuesta.status).toBe(400);
	});

	it('413 si el cuerpo supera 4 KB', async () => {
		const respuesta = await enviar('POST', ana, suscripcion({ relleno: 'x'.repeat(5 * 1024) }));
		expect(respuesta.status).toBe(413);
	});

	it('DELETE 204 borra la suscripción propia', async () => {
		await enviar('POST', ana, suscripcion());
		const respuesta = await enviar('DELETE', ana, JSON.stringify({ version: 1, endpoint: ENDPOINT }));

		expect(respuesta.status).toBe(204);
		expect(filas()).toHaveLength(0);
	});

	it('DELETE 204 aunque el endpoint no exista, sin revelarlo', async () => {
		const respuesta = await enviar('DELETE', ana, JSON.stringify({ version: 1, endpoint: 'https://push.ejemplo.test/ninguno' }));
		expect(respuesta.status).toBe(204);
	});

	it('DELETE no borra la suscripción de otra persona', async () => {
		await enviar('POST', ana, suscripcion());
		await enviar('DELETE', beatriz, JSON.stringify({ version: 1, endpoint: ENDPOINT }));

		expect(filas().filter((fila) => fila.usuarioId === ana)).toHaveLength(1);
	});
});
