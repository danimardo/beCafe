import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { validarEnlaceVisitante, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';

// Enlaces de visitante de un miembro (RF-189, CA-189).
const INSTANTE = '2026-10-24T09:00:00.000Z';
const esquemaCreado = z.object({ enlace: z.object({ id: z.string(), url: z.string(), qr: z.string(), expiraEn: z.string() }) });

describe('enlaces de visitante de un miembro', () => {
	let entorno: EntornoPrueba;
	let ana: Actor;
	let luis: Actor;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		const persona = (nombre: string): Actor => {
			const id = nuevoId();
			crearUsuario(entorno.ambiente.db, { id, nombre, correo: `${id}@ejemplo.es`, rol: 'miembro', instante: INSTANTE });
			return { usuarioId: id, rol: 'miembro', autenticadoEn: INSTANTE, sesionIdHash: 'h' };
		};
		ana = persona('Ana');
		luis = persona('Luis');
	});

	afterEach(() => entorno.cerrar());

	function evento(actor: Actor | undefined, datos: Record<string, string> = {}) {
		return crearEventoAccion({
			locals: { ambiente: entorno.ambiente, actor },
			ruta: '/(app)/visitantes',
			params: {},
			cuerpo: new URLSearchParams(datos),
			cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
		});
	}

	it('CA-189: crear devuelve el enlace de la visita y su QR como imagen SVG', async () => {
		const resultado = esquemaCreado.parse(await actions.crear(evento(ana)));

		const token = resultado.enlace.url.split('/visita/')[1] ?? '';
		expect(resultado.enlace.qr.startsWith('data:image/svg+xml;base64,')).toBe(true);
		expect(validarEnlaceVisitante(entorno.ambiente.db, token, INSTANTE)).toMatchObject({ valido: true, enlaceId: resultado.enlace.id });
	});

	it('CA-189: un miembro no revoca el enlace de otro', async () => {
		const resultado = esquemaCreado.parse(await actions.crear(evento(ana)));

		const fallo = desenvolverFallo(await actions.revocar(evento(luis, { enlaceId: resultado.enlace.id })));

		expect(fallo.estado).toBe(403);
		expect(await actions.revocar(evento(ana, { enlaceId: resultado.enlace.id }))).toEqual({ revocado: true });
	});

	it('CA-189: sin sesión no se crea ningún enlace', async () => {
		expect(desenvolverFallo(await actions.crear(evento(undefined))).estado).toBe(401);
	});
});
