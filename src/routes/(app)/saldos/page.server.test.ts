import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { leerSaldoPropio } from '#lib/server/economia';

// Acción de aportación (RF-040 a RF-046, CA-030, CA-031) con evento falso.
const INSTANTE = '2026-10-21T09:00:00.000Z';

describe('acción aportar de /saldos', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function miembro(rol: 'miembro' | 'administrador' = 'miembro', nombre = 'Ana'): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre, correo: `${nombre}-${usuarioId}@ejemplo.es`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	function aportar(actor: Actor | undefined, datos: Record<string, string>) {
		return actions.aportar(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/saldos',
				params: {},
				cuerpo: new URLSearchParams(datos),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('CA-030: una aportación de 5,00 € suma al saldo y confirma el registro', async () => {
		const ana = miembro();
		const clienteId = nuevoId();

		const resultado = await aportar(ana, { clienteId, importe: '5,00' });

		expect(resultado).toMatchObject({ duplicado: false });
		expect(leerSaldoPropio(entorno.ambiente.db, ana)).toBe(500);
	});

	it('CA-031: un importe de 500,01 € se rechaza con error en el campo importe y sin escribir', async () => {
		const ana = miembro();

		const { estado, datos } = desenvolverFallo(await aportar(ana, { clienteId: nuevoId(), importe: '500,01' }));

		expect(estado).toBe(400);
		expect(datos).toHaveProperty('errores.importe');
		expect(leerSaldoPropio(entorno.ambiente.db, ana)).toBe(0);
	});

	it('RF-046: reenviar el mismo clienteId no duplica la aportación', async () => {
		const ana = miembro();
		const clienteId = nuevoId();
		await aportar(ana, { clienteId, importe: '5,00' });

		const segunda = await aportar(ana, { clienteId, importe: '5,00' });

		expect(segunda).toMatchObject({ duplicado: true });
		expect(leerSaldoPropio(entorno.ambiente.db, ana)).toBe(500);
	});

	it('CA-200: un administrador registra una aportación para otra persona y la confirmación nombra a la beneficiaria', async () => {
		const admin = miembro('administrador', 'Admin');
		const marta = miembro('miembro', 'Marta');

		const resultado = await aportar(admin, { clienteId: nuevoId(), importe: '10,00', beneficiarioId: marta.usuarioId });

		expect(resultado).toMatchObject({ confirmacion: 'Aportación registrada a nombre de Marta' });
		expect(leerSaldoPropio(entorno.ambiente.db, marta)).toBe(1000);
		expect(leerSaldoPropio(entorno.ambiente.db, admin)).toBe(0);
	});

	it('EV-105: un miembro que envía a mano otra beneficiaria recibe 403 y no se escribe nada', async () => {
		const ana = miembro();
		const marta = miembro('miembro', 'Marta');

		const { estado, datos } = desenvolverFallo(
			await aportar(ana, { clienteId: nuevoId(), importe: '10,00', beneficiarioId: marta.usuarioId }),
		);

		expect(estado).toBe(403);
		expect(datos).toMatchObject({ errores: { general: { codigo: 'SIN_PERMISO' } } });
		expect(leerSaldoPropio(entorno.ambiente.db, marta)).toBe(0);
	});

	it('CA-200: «Yo» llega vacío y la aportación es de quien la registra', async () => {
		const admin = miembro('administrador', 'Admin');
		await expect(aportar(admin, { clienteId: nuevoId(), importe: '5,00', beneficiarioId: '' })).resolves.toMatchObject({
			confirmacion: 'Aportación registrada',
		});
		expect(leerSaldoPropio(entorno.ambiente.db, admin)).toBe(500);
	});
});
