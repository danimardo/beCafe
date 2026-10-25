import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearEnlaceVisitante, NOMBRE_COOKIE_VISITA, resolverVisita, revocarEnlaceVisitante, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';

// Entrada de un visitante con su enlace (RF-190, CA-190).
const INSTANTE = '2026-10-24T09:00:00.000Z';

async function capturar(operacion: () => unknown): Promise<unknown> {
	try {
		return await operacion();
	} catch (causa) {
		return causa;
	}
}

describe('entrada de visitante', () => {
	let entorno: EntornoPrueba;
	let ana: Actor;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		const id = nuevoId();
		crearUsuario(entorno.ambiente.db, { id, nombre: 'Ana', correo: 'ana@ejemplo.es', rol: 'miembro', instante: INSTANTE });
		ana = { usuarioId: id, rol: 'miembro', autenticadoEn: INSTANTE, sesionIdHash: 'h' };
	});

	afterEach(() => entorno.cerrar());

	function evento(token: string, datos: Record<string, string>) {
		return crearEventoAccion({
			locals: { ambiente: entorno.ambiente },
			ruta: '/(visita)/visita/[token=token]',
			params: { token },
			cuerpo: new URLSearchParams(datos),
			cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
		});
	}

	it('CA-190: con nombre y privacidad aceptada abre la visita, fija la cookie y redirige a /visita', async () => {
		const { token } = crearEnlaceVisitante(entorno.ambiente, ana);
		const e = evento(token, { nombre: 'Marta', privacidad: 'si' });

		const lanzado = await capturar(() => actions.entrar(e));

		expect(isRedirect(lanzado) && lanzado.location).toBe('/visita');
		const cookie = e.cookies.get(NOMBRE_COOKIE_VISITA);
		expect(cookie && resolverVisita(entorno.ambiente.db, cookie, INSTANTE)?.nombre).toBe('Marta');
	});

	it('CA-190: sin nombre o sin aceptar la privacidad devuelve 400 y no abre visita', async () => {
		const { token } = crearEnlaceVisitante(entorno.ambiente, ana);

		const sinNombre = desenvolverFallo(await actions.entrar(evento(token, { nombre: ' ', privacidad: 'si' })));
		const sinPrivacidad = desenvolverFallo(await actions.entrar(evento(token, { nombre: 'Marta' })));

		expect(sinNombre.estado).toBe(400);
		expect(sinPrivacidad.estado).toBe(400);
		expect(sinPrivacidad.datos).toMatchObject({ valores: { nombre: 'Marta' } });
	});

	it('CA-189: un enlace revocado no abre ninguna visita', async () => {
		const { enlaceId, token } = crearEnlaceVisitante(entorno.ambiente, ana);
		revocarEnlaceVisitante(entorno.ambiente, ana, enlaceId);

		const fallo = desenvolverFallo(await actions.entrar(evento(token, { nombre: 'Marta', privacidad: 'si' })));

		expect(fallo.estado).toBe(410);
	});
});
