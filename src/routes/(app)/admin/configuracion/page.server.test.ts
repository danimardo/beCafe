import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { leerConfiguracion } from '#lib/server/configuracion';

// Acción de configuración (CA-150, CA-138). El `load` no se prueba: lo cubren las pruebas E2E (AGENTS §7).
const INSTANTE = '2026-10-23T10:00:00.000Z';

describe('guardar la configuración desde el panel (CA-150, CA-138)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function sesionDe(rol: 'miembro' | 'administrador', instante: string): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre: 'Ana', correo: `ana-${usuarioId}@ejemplo.es`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante }));
		const sesion = resolverSesion(entorno.ambiente.db, token, instante);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	async function guardar(actor: Actor, campos: Record<string, string>) {
		return actions.guardar(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/admin/configuracion',
				params: {},
				cuerpo: new URLSearchParams(campos),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	const valoresValidos = { plazoAutoanulacionMin: '20', limiteDeudaCentimos: '-6', intervaloRellenosMin: '30' };

	it('CA-150: un administrador con sesión reciente guarda los valores', async () => {
		const admin = sesionDe('administrador', INSTANTE);

		await expect(guardar(admin, valoresValidos)).resolves.toEqual({ guardado: true });
		expect(leerConfiguracion(entorno.ambiente.db)).toEqual({
			plazoAutoanulacionMin: 20,
			limiteDeudaCentimos: -600,
			intervaloRellenosMin: 30,
		});
	});

	it('CA-138: con la sesión de hace más de 15 minutos sin contraseña, no cambia nada', async () => {
		const admin = sesionDe('administrador', INSTANTE);
		entorno.reloj.avanzar(16 * 60_000);

		const resultado = await guardar(admin, valoresValidos);

		expect(resultado).toMatchObject({ status: 401, data: { errores: { contrasenaActual: { codigo: 'REAUTENTICACION_REQUERIDA' } } } });
		expect(leerConfiguracion(entorno.ambiente.db).plazoAutoanulacionMin).toBe(15);
	});

	it('un valor fuera de rango responde con un error de ese campo y no pide contraseña', async () => {
		const admin = sesionDe('administrador', INSTANTE);

		const resultado = await guardar(admin, { ...valoresValidos, plazoAutoanulacionMin: '1441' });

		expect(resultado).toMatchObject({ status: 400, data: { errores: { plazoAutoanulacionMin: { codigo: 'VALIDACION' } } } });
		expect(leerConfiguracion(entorno.ambiente.db).plazoAutoanulacionMin).toBe(15);
	});

	it('un miembro no guarda (SIN_PERMISO)', async () => {
		const ana = sesionDe('miembro', INSTANTE);

		const resultado = await guardar(ana, valoresValidos);

		expect(resultado).toMatchObject({ status: 403 });
		expect(leerConfiguracion(entorno.ambiente.db).plazoAutoanulacionMin).toBe(15);
	});
});
