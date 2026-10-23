import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { POST } from './+server';
import { cerrarSesionesPorBaja, crearActor, crearSesion, resolverSesion } from '#lib/server/auth';
import { darDeAltaCapsula, registrarAportacion, registrarCompra } from '#lib/server/economia';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { crearEventoAccion } from '#lib/shared/pruebas/acciones';

// Contrato v1 de `POST /api/consumos` (contracts/api-consumos.md; CA-015, CA-016, EV-010, EV-041, plan D6, D9).
const INSTANTE = '2026-10-22T10:00:00.000Z';

describe('POST /api/consumos (contrato v1)', () => {
	let entorno: EntornoPrueba;
	let usuarioId: string;
	let token: string;
	let tipoId: string;

	beforeEach(async () => {
		entorno = crearEntornoPrueba(INSTANTE);
		usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre: 'Ana', correo: `ana-${usuarioId}@ejemplo.es`, rol: 'miembro', instante: INSTANTE }),
		);
		token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const administradorId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, {
				id: administradorId,
				nombre: 'Admin',
				correo: `admin-${administradorId}@ejemplo.es`,
				rol: 'administrador',
				instante: INSTANTE,
			}),
		);
		const administrador = { usuarioId: administradorId, rol: 'administrador' as const, autenticadoEn: INSTANTE, sesionIdHash: 'h' };
		const { id } = await darDeAltaCapsula(entorno.ambiente, administrador, {
			nombre: 'Ristretto',
			marca: 'Marca de prueba',
			intensidad: 9,
			color: 'cap-ristretto',
			umbralMinimo: 0,
		});
		tipoId = id;
		registrarAportacion(
			entorno.ambiente,
			{ usuarioId, rol: 'miembro', autenticadoEn: INSTANTE, sesionIdHash: 'h' },
			{ clienteId: nuevoId(), importe: 5000 },
		);
		await registrarCompra(entorno.ambiente, administrador, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipoId, cantidad: 100, importe: 3483 }],
			confirmoHuchaNegativa: true,
		});
	});

	afterEach(() => entorno.cerrar());

	function localsConSesion(): App.Locals {
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return { ambiente: entorno.ambiente, actor: crearActor(sesion) };
	}

	function cuerpoV1(extra: Record<string, unknown> = {}): string {
		return JSON.stringify({ version: 1, clienteId: nuevoId(), tipoCapsulaId: tipoId, invitado: false, horaGesto: INSTANTE, ...extra });
	}

	function enviar(locals: App.Locals, cuerpo: string, cabeceras: Record<string, string> = { 'content-type': 'application/json' }) {
		return POST(crearEventoAccion({ locals, ruta: '/api/consumos', params: {}, cabeceras, cuerpo }));
	}

	it('401 SIN_SESION sin cookie de sesión', async () => {
		const respuesta = await enviar({ ambiente: entorno.ambiente }, cuerpoV1());
		expect(respuesta.status).toBe(401);
		expect(await respuesta.json()).toMatchObject({ codigo: 'SIN_SESION' });
	});

	it('CA-015: con sesión válida, un consumo nuevo responde 201 con id, precio y descuadre', async () => {
		const respuesta = await enviar(localsConSesion(), cuerpoV1());
		expect(respuesta.status).toBe(201);
		expect(await respuesta.json()).toMatchObject({ precio: 35, descuadre: false });
	});

	it('CA-016, EV-010: el mismo clienteId responde 200 con el consumo original', async () => {
		const cuerpo = cuerpoV1();
		const { id } = z.object({ id: z.string() }).parse(await (await enviar(localsConSesion(), cuerpo)).json());
		const reenvio = await enviar(localsConSesion(), cuerpo);

		expect(reenvio.status).toBe(200);
		expect(await reenvio.json()).toMatchObject({ id, precio: 35 });
	});

	it('400 VALIDACION con una clave desconocida y con una versión que no existe', async () => {
		const conClaveExtra = await enviar(localsConSesion(), cuerpoV1({ usuarioId: nuevoId() }));
		const versionDos = await enviar(localsConSesion(), cuerpoV1({ version: 2 }));

		expect(conClaveExtra.status).toBe(400);
		expect(versionDos.status).toBe(400);
		expect(await conClaveExtra.json()).toMatchObject({ codigo: 'VALIDACION' });
	});

	it('413 si el cuerpo supera 2 KB, aunque la cabecera no lo declare', async () => {
		const cuerpo = cuerpoV1({ relleno: 'x'.repeat(3 * 1024) });
		const respuesta = await enviar(localsConSesion(), cuerpo);
		expect(respuesta.status).toBe(413);
	});

	it('EV-041, D9: una sesión cerrada por la baja responde 403 USUARIO_DE_BAJA, sin revelar nada más', async () => {
		enTransaccion(entorno.ambiente.db, (tx) => cerrarSesionesPorBaja(tx, usuarioId, INSTANTE));
		const locals: App.Locals = { ambiente: entorno.ambiente, tokenNoValido: token };

		const respuesta = await enviar(locals, cuerpoV1());

		expect(respuesta.status).toBe(403);
		expect(await respuesta.json()).toMatchObject({ codigo: 'USUARIO_DE_BAJA' });
	});

	it('una sesión caducada que no fue de baja responde 401 SIN_SESION', async () => {
		const locals: App.Locals = { ambiente: entorno.ambiente, tokenNoValido: 'token-inventado' };
		expect((await enviar(locals, cuerpoV1())).status).toBe(401);
	});

	it('409 TIPO_SIN_COSTE para un tipo sin coste medio, y el mensaje no incluye el valor recibido', async () => {
		const { id: sinCoste } = await darDeAltaCapsula(
			entorno.ambiente,
			{ usuarioId, rol: 'administrador', autenticadoEn: INSTANTE, sesionIdHash: 'h' },
			{
				nombre: 'Sin coste',
				marca: 'Marca de prueba',
				intensidad: 3,
				color: 'cap-lungo',
				umbralMinimo: 0,
			},
		);

		const respuesta = await enviar(localsConSesion(), cuerpoV1({ tipoCapsulaId: sinCoste }));

		expect(respuesta.status).toBe(409);
		const cuerpo: unknown = await respuesta.json();
		expect(cuerpo).toMatchObject({ codigo: 'TIPO_SIN_COSTE' });
		expect(JSON.stringify(cuerpo)).not.toContain(sinCoste);
	});
});
