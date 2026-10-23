import type { APIResponse } from '@playwright/test';
import { ulid } from 'ulid';
import { z } from 'zod';
import { test, expect } from '../fixtures/errores-navegador';
import { tipoConCoste } from '../fixtures/consumos';

// Contrato v1 de `POST /api/consumos` (contracts/api-consumos.md): el ejemplo v1 sigue respondiendo 201 o 200 (T032, CA-016).
const CABECERAS = { 'content-type': 'application/json' };

test('contrato v1: sin sesión, POST /api/consumos responde 401 SIN_SESION', async ({ request, servidor }) => {
	const respuesta = await request.post(`${servidor.url}/api/consumos`, {
		headers: { ...CABECERAS, origin: servidor.url },
		data: { version: 1, clienteId: ulid(), tipoCapsulaId: ulid(), invitado: false, horaGesto: '2026-10-22T10:00:00.000Z' },
	});

	expect(respuesta.status()).toBe(401);
	expect(await respuesta.json()).toMatchObject({ codigo: 'SIN_SESION' });
});

test('contrato v1: con sesión, el ejemplo v1 responde 201 y repetirlo con el mismo clienteId responde 200', async ({ page, servidor }) => {
	await tipoConCoste(page, servidor);
	// La pantalla principal lista solo los tipos registrables: su primer tipo es válido para el contrato.
	const html = await (await page.request.get(`${servidor.url}/`)).text();
	const tipoCapsulaId = /name="tipoCapsulaId" value="([0-9A-Z]{26})"/.exec(html)?.[1];
	expect(tipoCapsulaId).toBeDefined();

	const cuerpo = { version: 1, clienteId: ulid(), tipoCapsulaId, invitado: false, horaGesto: new Date().toISOString() };
	const primera = await page.request.post(`${servidor.url}/api/consumos`, {
		headers: { ...CABECERAS, origin: servidor.url },
		data: cuerpo,
	});
	const reenvio = await page.request.post(`${servidor.url}/api/consumos`, {
		headers: { ...CABECERAS, origin: servidor.url },
		data: cuerpo,
	});

	expect(primera.status()).toBe(201);
	expect(reenvio.status()).toBe(200);
	expect(await reenvio.json()).toMatchObject({ id: await idDe(primera) });
});

/** Lee el `id` de una respuesta JSON; la forma se comprueba antes de usarla. */
async function idDe(respuesta: APIResponse): Promise<string> {
	const cuerpo = z.object({ id: z.string() }).parse(await respuesta.json());
	return cuerpo.id;
}
