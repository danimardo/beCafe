import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { leerVisitas, type Actor, type VisitaResuelta } from '#lib/server/auth';
import { darDeAltaCapsula, leerCafesVisitante, registrarAportacion, registrarCafeVisitante, registrarCompra } from '#lib/server/economia';
import { crearEntornoPrueba, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { abrirVisita, crearEnlaceVisitante, resolverVisita } from '#lib/server/auth';

// Revisión de cafés de visitante (RF-193, RF-210, CA-193, CA-210).
const INSTANTE = '2026-10-24T09:00:00.000Z';

describe('revisión de cafés de visitante', () => {
	let entorno: EntornoPrueba;
	let admin: Actor;
	let miembro: Actor;
	let visita: VisitaResuelta;
	let tipo: string;

	beforeEach(async () => {
		entorno = crearEntornoPrueba(INSTANTE);
		const persona = (rol: Actor['rol']): Actor => {
			const id = nuevoId();
			crearUsuario(entorno.ambiente.db, { id, nombre: `P ${id}`, correo: `${id}@ejemplo.es`, rol, instante: INSTANTE });
			return { usuarioId: id, rol, autenticadoEn: INSTANTE, sesionIdHash: 'h' };
		};
		admin = persona('administrador');
		miembro = persona('miembro');
		({ id: tipo } = await darDeAltaCapsula(entorno.ambiente, admin, {
			nombre: 'Ristretto',
			marca: 'Marca',
			intensidad: 9,
			color: 'cap-ristretto',
			umbralMinimo: 0,
		}));
		registrarAportacion(entorno.ambiente, admin, { clienteId: nuevoId(), importe: 5000 });
		await registrarCompra(entorno.ambiente, admin, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 10, importe: 400 }],
			confirmoHuchaNegativa: false,
		});
		const { token } = crearEnlaceVisitante(entorno.ambiente, miembro);
		const { tokenVisita } = abrirVisita(entorno.ambiente, token, 'Marta');
		const resuelta = resolverVisita(entorno.ambiente.db, tokenVisita, INSTANTE);
		if (!resuelta) throw new Error('La visita de prueba debe resolverse');
		visita = resuelta;
	});

	afterEach(() => entorno.cerrar());

	function evento(actor: Actor, cuerpo: URLSearchParams) {
		return crearEventoAccion({
			locals: { ambiente: entorno.ambiente, actor },
			ruta: '/(app)/admin/visitantes',
			params: {},
			cuerpo,
			cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
		});
	}

	const cafe = () =>
		registrarCafeVisitante(entorno.ambiente, visita, { clienteId: nuevoId(), tipoCapsulaId: tipo, horaGesto: INSTANTE }).id;

	it('CA-193: el administrador aprueba varios cafés marcados de una vez', async () => {
		const ids = [cafe(), cafe()];
		const cuerpo = new URLSearchParams([...ids.map((id): [string, string] => ['ids', id]), ['decision', 'aprobar']]);

		expect(await actions.revisar(evento(admin, cuerpo))).toEqual({ revision: { aprobados: 2, rechazados: 0, yaRevisados: 0 } });
		expect(leerCafesVisitante(entorno.ambiente.db, admin, { vista: 'pendientes', pagina: 1 }).total).toBe(0);
	});

	it('CA-193: un miembro no puede revisar ni anular', async () => {
		const id = cafe();

		expect(
			desenvolverFallo(
				await actions.revisar(
					evento(
						miembro,
						new URLSearchParams([
							['ids', id],
							['decision', 'aprobar'],
						]),
					),
				),
			).estado,
		).toBe(403);
		expect(desenvolverFallo(await actions.anular(evento(miembro, new URLSearchParams({ id, motivo: 'x' })))).estado).toBe(403);
	});

	it('CA-193: sin cafés marcados la revisión se rechaza por validación', async () => {
		expect(desenvolverFallo(await actions.revisar(evento(admin, new URLSearchParams({ decision: 'aprobar' })))).estado).toBe(400);
	});

	it('CA-193: anular un café pendiente devuelve NO_ANULABLE', async () => {
		const fallo = desenvolverFallo(await actions.anular(evento(admin, new URLSearchParams({ id: cafe(), motivo: 'Error' }))));

		expect(fallo.estado).toBe(409);
	});

	it('CA-210: eliminar el nombre exige la confirmación y lo sustituye por nulo', async () => {
		cafe();

		expect(desenvolverFallo(await actions.eliminarNombre(evento(admin, new URLSearchParams({ visitaId: visita.id })))).estado).toBe(400);
		await actions.eliminarNombre(evento(admin, new URLSearchParams({ visitaId: visita.id, confirmar: 'si' })));
		expect(leerVisitas(entorno.ambiente.db, [visita.id])[0]?.nombre).toBeNull();
	});
});
