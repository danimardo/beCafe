import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { leerControl } from '#lib/server/economia';

// Acciones de control (CA-064, CA-080, CA-138, RF-081) con evento falso.
const INSTANTE = '2026-10-21T09:00:00.000Z';

describe('acciones de /admin/control', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function sesionDe(rol: 'miembro' | 'administrador', nombre: string): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre, correo: `${nombre.toLowerCase()}-${usuarioId}@ejemplo.es`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	function enviar(accion: 'previsualizarArqueo' | 'confirmarArqueo', actor: Actor | undefined, datos: Record<string, string>) {
		return actions[accion](
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/admin/control',
				params: {},
				cuerpo: new URLSearchParams(datos),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('CA-080: la vista previa del arqueo calcula el efecto y no escribe nada', async () => {
		const admin = sesionDe('administrador', 'Admin');

		await expect(enviar('previsualizarArqueo', admin, { contado: '3,50' })).resolves.toMatchObject({
			previsionArqueo: { contado: 350, diferencia: 350 },
		});
		expect(leerControl(entorno.ambiente.db, admin).arqueos).toHaveLength(0);
	});

	it('CA-064: una persona miembro no puede hacer la vista previa del arqueo', async () => {
		const ana = sesionDe('miembro', 'Ana');

		const { estado, datos } = desenvolverFallo(await enviar('previsualizarArqueo', ana, { contado: '3,50' }));

		expect(estado).toBe(403);
		expect(datos).toHaveProperty('errores.general');
	});

	it('RF-081: confirmar con un contado distinto del previsto responde CAMBIO_CONCURRENTE y no guarda el arqueo', async () => {
		const admin = sesionDe('administrador', 'Admin');

		const { datos } = desenvolverFallo(
			await enviar('confirmarArqueo', admin, { contado: '5,00', contadoPrevisto: '400', saldoTeoricoPrevisto: '0' }),
		);

		expect(datos).toMatchObject({ errores: { general: { codigo: 'CAMBIO_CONCURRENTE' } } });
		expect(leerControl(entorno.ambiente.db, admin).arqueos).toHaveLength(0);
	});
});
