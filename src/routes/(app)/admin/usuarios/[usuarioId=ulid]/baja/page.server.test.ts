import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, usuario } from '#lib/server/usuarios';

// Acción de baja (RF-139, CA-135) con evento falso. La sesión recién iniciada supera la reautenticación.
const INSTANTE = '2026-10-21T09:00:00.000Z';

describe('acción baja de /admin/usuarios/[usuarioId]/baja', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function conSesion(rol: 'miembro' | 'administrador', nombre: string): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre, correo: `${nombre.toLowerCase()}-${usuarioId}@ejemplo.es`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	function darDeBaja(actor: Actor | undefined, usuarioId: string, datos: Record<string, string>) {
		return actions.baja(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/admin/usuarios/[usuarioId=ulid]/baja',
				params: { usuarioId },
				cuerpo: new URLSearchParams(datos),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('CA-135: una persona sin saldo pasa a baja y la acción redirige a su ficha', async () => {
		const admin = conSesion('administrador', 'Admin');
		const ana = conSesion('miembro', 'Ana');

		await expect(darDeBaja(admin, ana.usuarioId, { modo: 'ninguna', saldoPrevisto: '0' })).rejects.toMatchObject({
			status: 303,
			location: `/admin/usuarios/${ana.usuarioId}?baja=ok`,
		});
		const fila = entorno.ambiente.db
			.select()
			.from(usuario)
			.all()
			.find((persona) => persona.id === ana.usuarioId);
		expect(fila?.estado).toBe('baja');
	});

	it('CA-135: un modo que no corresponde al saldo se rechaza sin dar de baja', async () => {
		const admin = conSesion('administrador', 'Admin');
		const ana = conSesion('miembro', 'Ana');

		const { estado, datos } = desenvolverFallo(await darDeBaja(admin, ana.usuarioId, { modo: 'pago', saldoPrevisto: '0' }));

		expect(estado).toBe(400);
		expect(datos).toHaveProperty('errores.general');
		const fila = entorno.ambiente.db
			.select()
			.from(usuario)
			.all()
			.find((persona) => persona.id === ana.usuarioId);
		expect(fila?.estado).toBe('activo');
	});

	it('CAMBIO_CONCURRENTE: si el saldo ya no es el que vio la administración, no se da de baja', async () => {
		const admin = conSesion('administrador', 'Admin');
		const ana = conSesion('miembro', 'Ana');

		const { estado } = desenvolverFallo(await darDeBaja(admin, ana.usuarioId, { modo: 'devolucion', saldoPrevisto: '500' }));

		expect(estado).toBe(409);
		const fila = entorno.ambiente.db
			.select()
			.from(usuario)
			.all()
			.find((persona) => persona.id === ana.usuarioId);
		expect(fila?.estado).toBe('activo');
	});

	it('sin sesión la acción no hace nada y devuelve un fallo de sesión', async () => {
		const ana = conSesion('miembro', 'Ana');

		const { estado } = desenvolverFallo(await darDeBaja(undefined, ana.usuarioId, { modo: 'ninguna', saldoPrevisto: '0' }));

		expect(estado).toBe(401);
	});
});
