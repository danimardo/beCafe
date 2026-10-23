import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearSesion, sesion, sesionCerradaPorBaja, limpiarSesionesCerradasPorBaja, type Actor } from '#lib/server/auth';
import { crearAzarFijo, crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, registroAuditoria, usuario } from '#lib/server/usuarios';
import { registrarAportacion } from './aportaciones';
import { darDeBaja, leerLiquidacion, modosPosibles } from './baja';
import { anotarMovimientos, saldoHucha, saldoPersona } from './libro';
import { aportacion, avisoEconomia, movimiento, reparto } from './esquema';
import { prepararMiembros } from './pruebas/constructores';

const INSTANTE = '2026-10-21T09:00:00.000Z';

function actorDe(usuarioId: string, rol: Actor['rol'] = 'miembro'): Actor {
	return { usuarioId, rol, autenticadoEn: INSTANTE, sesionIdHash: `hash-${usuarioId}` };
}

function crearAdmin(entorno: EntornoPrueba): Actor {
	const id = nuevoId();
	crearUsuario(entorno.ambiente.db, { id, nombre: 'Admin', correo: `admin-${id}@ejemplo.test`, rol: 'administrador', instante: INSTANTE });
	return actorDe(id, 'administrador');
}

/** Un saldo de la persona sin pasar por un caso de uso: solo para preparar la prueba (cargo de consumo). */
function cargar(entorno: EntornoPrueba, usuarioId: string, importe: number): void {
	enTransaccion(entorno.ambiente.db, (tx) =>
		anotarMovimientos(tx, [
			{ cuenta: 'persona', usuarioId, tipo: 'cargo_consumo', importe, origenTipo: 'consumo', origenId: nuevoId(), creadoEn: INSTANTE },
		]),
	);
}

describe('baja con liquidación (CA-135, CA-136, INV-06, EV-040, RF-139c)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE, crearAzarFijo(Array.from({ length: 20 }, () => 0)));
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('CA-135, incobrable: −6,00 € pasa a 0 y los demás activos reparten −6,00 €; las sesiones se cierran y se guardan', async () => {
		const admin = crearAdmin(entorno);
		const [ana, bea, carla] = prepararMiembros(entorno.ambiente.db, 3);
		cargar(entorno, ana, -600);
		enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId: ana, instante: INSTANTE }));
		expect(modosPosibles(-600)).toEqual(['pago', 'incobrable']);

		await darDeBaja(entorno.ambiente, admin, {
			usuarioId: ana,
			modo: 'incobrable',
			saldoPrevisto: -600,
			confirmoHuchaNegativa: false,
			contrasenaActual: undefined,
		});

		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(0);
		const reparto2 = entorno.ambiente.db
			.select()
			.from(movimiento)
			.all()
			.filter((m) => m.tipo === 'reparto_incobrable');
		expect(reparto2.map((m) => m.usuarioId).sort()).toEqual([bea, carla, admin.usuarioId].sort());
		expect(reparto2.reduce((suma, m) => suma + m.importe, 0)).toBe(-600);
		expect(
			entorno.ambiente.db
				.select()
				.from(sesion)
				.all()
				.filter((s) => s.usuarioId === ana),
		).toHaveLength(0);
		expect(
			entorno.ambiente.db
				.select()
				.from(sesionCerradaPorBaja)
				.all()
				.filter((s) => s.usuarioId === ana),
		).toHaveLength(1);
		expect(
			entorno.ambiente.db
				.select()
				.from(usuario)
				.all()
				.find((u) => u.id === ana)?.estado,
		).toBe('baja');
		expect(entorno.ambiente.db.select().from(reparto).all()).toHaveLength(1);
	});

	it('CA-135, pago: −6,00 € se liquida con una aportación de la baja registrada por el administrador', async () => {
		const admin = crearAdmin(entorno);
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		cargar(entorno, ana, -600);

		await darDeBaja(entorno.ambiente, admin, {
			usuarioId: ana,
			modo: 'pago',
			saldoPrevisto: -600,
			confirmoHuchaNegativa: false,
			contrasenaActual: undefined,
		});

		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(0);
		expect(saldoHucha(entorno.ambiente.db)).toBe(600);
		expect(entorno.ambiente.db.select().from(aportacion).get()).toMatchObject({
			origen: 'baja',
			registradaPor: admin.usuarioId,
			usuarioId: ana,
		});
	});

	it('CA-135, devolución: +10,00 € sale de la hucha y deja a la persona en 0', async () => {
		const admin = crearAdmin(entorno);
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 1000 });

		await darDeBaja(entorno.ambiente, admin, {
			usuarioId: ana,
			modo: 'devolucion',
			saldoPrevisto: 1000,
			confirmoHuchaNegativa: false,
			contrasenaActual: undefined,
		});

		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(0);
		expect(saldoHucha(entorno.ambiente.db)).toBe(0);
	});

	it('devolución que deja la hucha en negativo: sin confirmar se rechaza; confirmada, queda en −6,00 € con aviso', async () => {
		const admin = crearAdmin(entorno);
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 1000 });
		enTransaccion(entorno.ambiente.db, (tx) =>
			anotarMovimientos(tx, [
				{
					cuenta: 'hucha',
					usuarioId: null,
					tipo: 'hucha_compra',
					importe: -600,
					origenTipo: 'compra',
					origenId: nuevoId(),
					creadoEn: INSTANTE,
				},
			]),
		);
		const entrada = { usuarioId: ana, modo: 'devolucion' as const, saldoPrevisto: 1000, contrasenaActual: undefined };

		await expect(darDeBaja(entorno.ambiente, admin, { ...entrada, confirmoHuchaNegativa: false })).rejects.toThrow(
			'CONFIRMACION_REQUERIDA',
		);
		expect(saldoHucha(entorno.ambiente.db)).toBe(400);

		await darDeBaja(entorno.ambiente, admin, { ...entrada, confirmoHuchaNegativa: true });

		expect(saldoHucha(entorno.ambiente.db)).toBe(-600);
		expect(entorno.ambiente.db.select().from(avisoEconomia).all()).toHaveLength(1);
	});

	it('con saldo 0 solo se ofrece el modo ninguno; otro modo se rechaza', async () => {
		const admin = crearAdmin(entorno);
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		expect(leerLiquidacion(entorno.ambiente.db, admin, ana).modos).toEqual(['ninguna']);

		await expect(
			darDeBaja(entorno.ambiente, admin, {
				usuarioId: ana,
				modo: 'pago',
				saldoPrevisto: 0,
				confirmoHuchaNegativa: false,
				contrasenaActual: undefined,
			}),
		).rejects.toThrow('VALIDACION');
	});

	it('CAMBIO_CONCURRENTE: si el saldo cambió desde la previsión, la baja no se aplica', async () => {
		const admin = crearAdmin(entorno);
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		cargar(entorno, ana, -600);

		await expect(
			darDeBaja(entorno.ambiente, admin, {
				usuarioId: ana,
				modo: 'pago',
				saldoPrevisto: -500,
				confirmoHuchaNegativa: false,
				contrasenaActual: undefined,
			}),
		).rejects.toThrow('CAMBIO_CONCURRENTE');
		expect(
			entorno.ambiente.db
				.select()
				.from(usuario)
				.all()
				.find((u) => u.id === ana)?.estado,
		).toBe('activo');
	});

	it('el último administrador activo no se puede dar de baja (INV-03)', async () => {
		const admin = crearAdmin(entorno);

		await expect(
			darDeBaja(entorno.ambiente, admin, {
				usuarioId: admin.usuarioId,
				modo: 'ninguna',
				saldoPrevisto: 0,
				confirmoHuchaNegativa: false,
				contrasenaActual: undefined,
			}),
		).rejects.toThrow('ULTIMO_ADMIN');
	});

	it('RF-139c: la baja deja una fila de auditoría con el autor y el modo', async () => {
		const admin = crearAdmin(entorno);
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);

		await darDeBaja(entorno.ambiente, admin, {
			usuarioId: ana,
			modo: 'ninguna',
			saldoPrevisto: 0,
			confirmoHuchaNegativa: false,
			contrasenaActual: undefined,
		});

		expect(entorno.ambiente.db.select().from(registroAuditoria).all()).toEqual([
			expect.objectContaining({
				actorId: admin.usuarioId,
				accion: 'usuario.baja',
				objetoId: ana,
				detalle: JSON.stringify({ modo: 'ninguna' }),
			}),
		]);
	});

	it('CA-136: al reactivar, se borran las marcas de sesiones cerradas por la baja', async () => {
		const admin = crearAdmin(entorno);
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId: ana, instante: INSTANTE }));
		await darDeBaja(entorno.ambiente, admin, {
			usuarioId: ana,
			modo: 'ninguna',
			saldoPrevisto: 0,
			confirmoHuchaNegativa: false,
			contrasenaActual: undefined,
		});

		enTransaccion(entorno.ambiente.db, (tx) => limpiarSesionesCerradasPorBaja(tx, ana));

		expect(entorno.ambiente.db.select().from(sesionCerradaPorBaja).all()).toHaveLength(0);
	});

	it('un miembro no puede dar de baja a nadie', async () => {
		const [ana, bea] = prepararMiembros(entorno.ambiente.db, 2);

		await expect(
			darDeBaja(entorno.ambiente, actorDe(bea), {
				usuarioId: ana,
				modo: 'ninguna',
				saldoPrevisto: 0,
				confirmoHuchaNegativa: false,
				contrasenaActual: undefined,
			}),
		).rejects.toThrow('SIN_PERMISO');
	});
});
