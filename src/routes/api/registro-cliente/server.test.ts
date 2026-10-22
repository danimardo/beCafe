import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { POST } from './+server';
import { crearActor, crearSesion, resolverSesion } from '#lib/server/auth';
import { crearEntornoPrueba, crearLimitador, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { crearEventoAccion } from '#lib/shared/pruebas/acciones';

// Contrato de `/api/registro-cliente` (contracts/api.md, research R14): 401, 415, 413, 429, 400 y 204.
const INSTANTE = '2026-10-21T09:00:00.000Z';
const EVENTO = { codigo: 'dato.invalido', instante: INSTANTE, campos: { origen: 'consumo', campo: 'cantidad', incidencia: 'vacio' } };

describe('POST /api/registro-cliente', () => {
	let entorno: EntornoPrueba;
	let token: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		token = enTransaccion(entorno.ambiente.db, (tx) => {
			const usuarioId = nuevoId();
			crearUsuario(tx, { id: usuarioId, nombre: 'Ana', correo: 'ana@ejemplo.es', rol: 'miembro', instante: INSTANTE });
			return crearSesion(tx, { usuarioId, instante: INSTANTE });
		});
	});

	afterEach(() => entorno.cerrar());

	function evento(locals: App.Locals, cuerpo: string, tipo = 'application/json') {
		return POST(crearEventoAccion({ locals, ruta: '/api/registro-cliente', params: {}, cabeceras: { 'content-type': tipo }, cuerpo }));
	}

	function localsConSesion(): App.Locals {
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return { ambiente: entorno.ambiente, actor: crearActor(sesion) };
	}

	it('401 SIN_SESION sin sesión', async () => {
		const respuesta = await evento({ ambiente: entorno.ambiente }, JSON.stringify({ version: 1, eventos: [EVENTO] }));
		expect(respuesta.status).toBe(401);
		expect(await respuesta.json()).toMatchObject({ codigo: 'SIN_SESION' });
	});

	it('415 si el cuerpo no es JSON', async () => {
		const respuesta = await evento(localsConSesion(), 'hola', 'text/plain');
		expect(respuesta.status).toBe(415);
	});

	it('413 LIMITE_SUPERADO por encima de 16 KiB, y avisa del rechazo', async () => {
		const respuesta = await evento(localsConSesion(), 'x'.repeat(17 * 1024));
		expect(respuesta.status).toBe(413);
		expect(await respuesta.json()).toMatchObject({ codigo: 'LIMITE_SUPERADO' });
		expect(entorno.eventos().map((e) => e.codigo)).toContain('cliente.registro_rechazado');
	});

	it('400 VALIDACION con un campo que no está en el contrato', async () => {
		const cuerpo = JSON.stringify({ version: 1, eventos: [{ ...EVENTO, campos: { ...EVENTO.campos, extra: 'x' } }] });
		const respuesta = await evento(localsConSesion(), cuerpo);
		expect(respuesta.status).toBe(400);
		expect(await respuesta.json()).toMatchObject({ codigo: 'VALIDACION' });
	});

	it('429 LIMITE_SUPERADO por encima de 30 eventos por minuto y sesión', async () => {
		const lote = JSON.stringify({ version: 1, eventos: Array.from({ length: 10 }, () => EVENTO) });
		const locals = localsConSesion();
		locals.ambiente.limitadorRegistro = crearLimitador({ maximo: 30, ventanaMs: 60_000 });
		for (let i = 0; i < 3; i++) expect((await evento(locals, lote)).status).toBe(204);
		const respuesta = await evento(locals, lote);
		expect(respuesta.status).toBe(429);
		expect(await respuesta.json()).toMatchObject({ codigo: 'LIMITE_SUPERADO' });
	});

	it('204 y registra el evento con origen cliente', async () => {
		const respuesta = await evento(localsConSesion(), JSON.stringify({ version: 1, eventos: [EVENTO] }));
		expect(respuesta.status).toBe(204);
		expect(entorno.eventos()).toContainEqual(expect.objectContaining({ codigo: 'dato.invalido', origen: 'cliente' }));
	});
});
