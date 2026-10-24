import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { leerPruebas } from '#lib/server/copias';

// Acción de la pantalla de copias (CA-143, RF-143). El `load` no se prueba: lo cubren las pruebas E2E (AGENTS §7).
const INSTANTE = '2026-10-23T10:00:00.000Z';

describe('anotar una prueba de restauración desde el panel (CA-143)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function sesionDe(rol: 'miembro' | 'administrador'): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre: 'Ana', correo: `ana-${usuarioId}@ejemplo.es`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	async function anotar(actor: Actor, campos: Record<string, string>) {
		return actions.anotarPrueba(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/admin/copias',
				params: {},
				cuerpo: new URLSearchParams(campos),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('un administrador anota una prueba correcta con su fecha', async () => {
		const admin = sesionDe('administrador');

		await expect(anotar(admin, { realizadaEl: '2026-10-22', resultado: 'correcta' })).resolves.toEqual({ anotada: true });
		expect(leerPruebas(entorno.ambiente.db, admin)).toHaveLength(1);
	});

	it('una fecha futura se rechaza y no se guarda', async () => {
		const admin = sesionDe('administrador');

		const resultado = await anotar(admin, { realizadaEl: '2026-10-24', resultado: 'correcta' });

		expect(resultado).toMatchObject({ status: 400 });
		expect(leerPruebas(entorno.ambiente.db, admin)).toHaveLength(0);
	});

	it('un miembro no anota pruebas (SIN_PERMISO)', async () => {
		const ana = sesionDe('miembro');

		const resultado = await anotar(ana, { realizadaEl: '2026-10-22', resultado: 'correcta' });

		expect(resultado).toMatchObject({ status: 403 });
	});
});
