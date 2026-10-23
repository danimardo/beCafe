import { afterEach, describe, expect, it } from 'vitest';
import { anadirElemento, borrarElemento, listarElementos } from './cola';
import { enviarPendientes, type Enviador } from './envio';
import type { ElementoCola } from '#lib/shared/contratos/consumos';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';

// Cola de consumos con IndexedDB real (navegador, Vitest Browser Mode; plan «Pruebas» y CA-015, CA-063, EV-041).
const USUARIO = '01ARZ3NDEKTSV4RRFFQ69G5FA1';
const OTRO = '01ARZ3NDEKTSV4RRFFQ69G5FA2';
const TIPO = '01ARZ3NDEKTSV4RRFFQ69G5FA9';

function elemento(clienteId: string, usuarioId = USUARIO, horaGesto = '2026-10-22T08:15:03.000Z'): ElementoCola {
	return {
		version: 1,
		clienteId,
		usuarioId,
		tipoCapsulaId: TIPO,
		invitado: false,
		horaGesto: esquemaInstanteUtc.parse(horaGesto),
		estado: 'pendiente',
	};
}

function respuesta(estado: number, cuerpo?: unknown): Response {
	return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado });
}

describe('cola de consumos sin conexión (CA-015, CA-063, EV-041)', () => {
	const creados: string[] = [];

	afterEach(async () => {
		for (const clienteId of creados.splice(0)) await borrarElemento(clienteId);
	});

	async function guardar(elementoNuevo: ElementoCola) {
		creados.push(elementoNuevo.clienteId);
		await anadirElemento(elementoNuevo);
	}

	it('CA-015: un consumo guardado sin red aparece como pendiente de su persona', async () => {
		const clienteId = '01ARZ3NDEKTSV4RRFFQ69G5F01';
		await guardar(elemento(clienteId));

		const pendientes = await listarElementos(USUARIO);

		expect(pendientes.map((e) => e.clienteId)).toContain(clienteId);
	});

	it('Clarifications 10: los consumos de otra persona no se listan para quien tiene la sesión', async () => {
		const clienteId = '01ARZ3NDEKTSV4RRFFQ69G5F02';
		await guardar(elemento(clienteId, OTRO));

		expect((await listarElementos(USUARIO)).map((e) => e.clienteId)).not.toContain(clienteId);
	});

	it('CA-063: borrar un elemento de la cola lo quita; el servidor no lo recibe', async () => {
		const clienteId = '01ARZ3NDEKTSV4RRFFQ69G5F03';
		await guardar(elemento(clienteId));

		await borrarElemento(clienteId);

		expect((await listarElementos(USUARIO)).map((e) => e.clienteId)).not.toContain(clienteId);
	});

	it('los pendientes se devuelven en orden de hora del toque', async () => {
		const tarde = '01ARZ3NDEKTSV4RRFFQ69G5F04';
		const pronto = '01ARZ3NDEKTSV4RRFFQ69G5F05';
		await guardar(elemento(tarde, USUARIO, '2026-10-22T09:00:00.000Z'));
		await guardar(elemento(pronto, USUARIO, '2026-10-22T08:00:00.000Z'));

		const ids = (await listarElementos(USUARIO)).map((e) => e.clienteId);

		expect(ids.indexOf(pronto)).toBeLessThan(ids.indexOf(tarde));
	});

	it('envío: 201 borra el elemento de la cola', async () => {
		const clienteId = '01ARZ3NDEKTSV4RRFFQ69G5F06';
		await guardar(elemento(clienteId));
		const enviador: Enviador = () => Promise.resolve(respuesta(201, { id: 'x', precio: 35, descuadre: false }));

		const resultado = await enviarPendientes(USUARIO, enviador);

		expect(resultado).toMatchObject({ sesionCaducada: false, reintentoEnMs: null });
		expect((await listarElementos(USUARIO)).map((e) => e.clienteId)).not.toContain(clienteId);
	});

	it('EV-041: un 403 USUARIO_DE_BAJA marca el elemento como rechazado con su código', async () => {
		const clienteId = '01ARZ3NDEKTSV4RRFFQ69G5F07';
		await guardar(elemento(clienteId));
		const enviador: Enviador = () =>
			Promise.resolve(respuesta(403, { codigo: 'USUARIO_DE_BAJA', mensaje: 'Tu cuenta está dada de baja.' }));

		await enviarPendientes(USUARIO, enviador);

		const fila = (await listarElementos(USUARIO)).find((e) => e.clienteId === clienteId);
		expect(fila).toMatchObject({ estado: 'rechazado', codigo: 'USUARIO_DE_BAJA' });
	});

	it('401 conserva el elemento y avisa de la sesión caducada', async () => {
		const clienteId = '01ARZ3NDEKTSV4RRFFQ69G5F08';
		await guardar(elemento(clienteId));
		const enviador: Enviador = () => Promise.resolve(respuesta(401, { codigo: 'SIN_SESION', mensaje: 'Inicia sesión.' }));

		const resultado = await enviarPendientes(USUARIO, enviador);

		expect(resultado.sesionCaducada).toBe(true);
		expect((await listarElementos(USUARIO)).map((e) => e.clienteId)).toContain(clienteId);
	});

	it('un 500 o un fallo de red conserva el elemento y reintenta a los 30 segundos', async () => {
		const clienteId = '01ARZ3NDEKTSV4RRFFQ69G5F09';
		await guardar(elemento(clienteId));
		const enviador: Enviador = () => Promise.resolve(respuesta(500, { codigo: 'SIN_SESION' }));

		const resultado = await enviarPendientes(USUARIO, enviador);

		expect(resultado.reintentoEnMs).toBe(30_000);
		expect((await listarElementos(USUARIO)).map((e) => e.clienteId)).toContain(clienteId);
	});

	it('409 TIPO_SIN_COSTE rechaza el elemento con su código', async () => {
		const clienteId = '01ARZ3NDEKTSV4RRFFQ69G5F10';
		await guardar(elemento(clienteId));
		const enviador: Enviador = () => Promise.resolve(respuesta(409, { codigo: 'TIPO_SIN_COSTE', mensaje: 'Sin precio.' }));
		await enviarPendientes(USUARIO, enviador);

		const fila = (await listarElementos(USUARIO)).find((e) => e.clienteId === clienteId);
		expect(fila).toMatchObject({ estado: 'rechazado', codigo: 'TIPO_SIN_COSTE' });
	});
});
