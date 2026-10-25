import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import type { Actor, VisitaResuelta } from '#lib/server/auth';
import { notificacion } from '#lib/server/notificaciones';
import {
	crearEntornoPrueba,
	crearLimitador,
	ErrorDeNegocio,
	nuevoId,
	RecursoNoEncontrado,
	type EntornoPrueba,
} from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import {
	anularCafeVisitante,
	contarCafesVisitante,
	contarCafesVisitantePendientes,
	leerCafesDeVisita,
	leerCafesVisitante,
	registrarCafeVisitante,
	leerTiposParaVisitante,
	revisarCafesVisitante,
} from './cafes-visitante';
import { cambiarEstadoCapsula } from './capsulas';
import { registrarAportacion } from './aportaciones';
import { anularCompra, registrarCompra } from './compras';
import { existencia, movimiento } from './esquema';
import { saldoHucha } from './libro';
import { prepararTipo } from './pruebas/constructores';

// Cafés de visitante (plan F10 D2; RF-191 a RF-193, RN-086).
const INSTANTE = '2026-10-21T09:00:00.000Z';

function crearPersona(entorno: EntornoPrueba, rol: Actor['rol']): Actor {
	const id = nuevoId();
	crearUsuario(entorno.ambiente.db, { id, nombre: `Persona ${id}`, correo: `${id}@ejemplo.test`, rol, instante: INSTANTE });
	return { usuarioId: id, rol, autenticadoEn: INSTANTE, sesionIdHash: 'hash' };
}

function visitaDePrueba(): VisitaResuelta {
	return { id: nuevoId(), enlaceId: nuevoId(), nombre: 'Marta', expiraEn: '2026-10-22T09:00:00.000Z' };
}

describe('cafés de visitante (CA-191 a CA-193, RN-086)', () => {
	let entorno: EntornoPrueba;
	let admin: Actor;
	let otroAdmin: Actor;
	let miembro: Actor;
	let tipo: string;

	const stock = () => entorno.ambiente.db.select().from(existencia).where(eq(existencia.tipoCapsulaId, tipo)).get()?.stock;
	const costeMedio = () => entorno.ambiente.db.select().from(existencia).where(eq(existencia.tipoCapsulaId, tipo)).get()?.costeMedio;
	const movimientos = () => entorno.ambiente.db.select().from(movimiento).all().length;
	const registrarCafe = (visita = visitaDePrueba()) =>
		registrarCafeVisitante(entorno.ambiente, visita, { clienteId: nuevoId(), tipoCapsulaId: tipo, horaGesto: entorno.reloj.ahora() });

	beforeEach(async () => {
		entorno = crearEntornoPrueba(INSTANTE);
		admin = crearPersona(entorno, 'administrador');
		otroAdmin = crearPersona(entorno, 'administrador');
		miembro = crearPersona(entorno, 'miembro');
		tipo = await prepararTipo(entorno.ambiente);
		registrarAportacion(entorno.ambiente, admin, { clienteId: nuevoId(), importe: 5000 });
		await registrarCompra(entorno.ambiente, admin, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 10, importe: 400 }],
			confirmoHuchaNegativa: false,
		});
	});

	afterEach(() => entorno.cerrar());

	it('CA-191: el café queda pendiente sin tocar stock, saldos ni movimientos', () => {
		const antes = { stock: stock(), movimientos: movimientos(), hucha: saldoHucha(entorno.ambiente.db) };

		const { id } = registrarCafe();

		expect(leerCafesVisitante(entorno.ambiente.db, admin, { vista: 'pendientes', pagina: 1 }).filas.map((f) => f.id)).toEqual([id]);
		expect({ stock: stock(), movimientos: movimientos(), hucha: saldoHucha(entorno.ambiente.db) }).toEqual(antes);
	});

	it('CA-191: repetir el mismo identificador de cliente devuelve el café original', () => {
		const visita = visitaDePrueba();
		const datos = { clienteId: nuevoId(), tipoCapsulaId: tipo, horaGesto: INSTANTE };

		const primero = registrarCafeVisitante(entorno.ambiente, visita, datos);
		const segundo = registrarCafeVisitante(entorno.ambiente, visita, datos);

		expect(segundo).toEqual({ id: primero.id, duplicado: true });
		expect(contarCafesVisitantePendientes(entorno.ambiente.db)).toBe(1);
	});

	it('CA-191: un tipo inexistente se rechaza', () => {
		expect(() =>
			registrarCafeVisitante(entorno.ambiente, visitaDePrueba(), { clienteId: nuevoId(), tipoCapsulaId: nuevoId(), horaGesto: INSTANTE }),
		).toThrow(ErrorDeNegocio);
	});

	it('CA-192: cada administrador recibe un aviso sin el nombre del visitante', () => {
		registrarCafe();

		const avisos = entorno.ambiente.db.select().from(notificacion).where(eq(notificacion.tipo, 'cafe_visitante_pendiente')).all();
		expect(avisos.map((a) => a.usuarioId).sort()).toEqual([admin.usuarioId, otroAdmin.usuarioId].sort());
		expect(JSON.stringify(avisos)).not.toContain('Marta');
	});

	it('CA-193, RN-086: aprobar resta una cápsula sin movimientos ni cambio del coste medio', () => {
		const { id } = registrarCafe();
		const antes = { stock: stock(), coste: costeMedio(), movimientos: movimientos(), hucha: saldoHucha(entorno.ambiente.db) };

		const resultado = revisarCafesVisitante(entorno.ambiente, admin, { ids: [id], decision: 'aprobar' });

		expect(resultado).toEqual({ aprobados: 1, rechazados: 0, yaRevisados: 0 });
		expect(stock()).toBe((antes.stock ?? 0) - 1);
		expect(costeMedio()).toBe(antes.coste);
		expect(movimientos()).toBe(antes.movimientos);
		expect(saldoHucha(entorno.ambiente.db)).toBe(antes.hucha);
		expect(contarCafesVisitante(entorno.ambiente.db, { desde: INSTANTE, hasta: '2026-11-01T00:00:00.000Z' })).toHaveLength(1);
	});

	it('CA-193: rechazar descarta el café sin efectos y una segunda revisión no hace nada', () => {
		const { id } = registrarCafe();
		const antes = stock();

		expect(revisarCafesVisitante(entorno.ambiente, admin, { ids: [id], decision: 'rechazar' })).toEqual({
			aprobados: 0,
			rechazados: 1,
			yaRevisados: 0,
		});
		expect(revisarCafesVisitante(entorno.ambiente, admin, { ids: [id], decision: 'aprobar' })).toEqual({
			aprobados: 0,
			rechazados: 0,
			yaRevisados: 1,
		});
		expect(stock()).toBe(antes);
		expect(leerCafesVisitante(entorno.ambiente.db, admin, { vista: 'revisados', pagina: 1 }).filas[0]?.estado).toBe('rechazado');
	});

	it('CA-193: varios cafés se aprueban de una vez', () => {
		const visita = visitaDePrueba();
		const ids = [registrarCafe(visita).id, registrarCafe(visita).id, registrarCafe(visita).id];

		expect(revisarCafesVisitante(entorno.ambiente, admin, { ids, decision: 'aprobar' }).aprobados).toBe(3);
		expect(stock()).toBe(7);
		expect(leerCafesDeVisita(entorno.ambiente.db, visita.id).every((c) => c.estado === 'aprobado')).toBe(true);
	});

	it('CA-193: anular un café aprobado devuelve la cápsula; un café pendiente no se anula', () => {
		const aprobado = registrarCafe().id;
		const pendiente = registrarCafe().id;
		revisarCafesVisitante(entorno.ambiente, admin, { ids: [aprobado], decision: 'aprobar' });

		anularCafeVisitante(entorno.ambiente, admin, aprobado, 'Lo registró por error');

		expect(stock()).toBe(10);
		expect(() => anularCafeVisitante(entorno.ambiente, admin, aprobado, 'Otra vez')).toThrow(ErrorDeNegocio);
		expect(() => anularCafeVisitante(entorno.ambiente, admin, pendiente, 'Pendiente')).toThrow(ErrorDeNegocio);
	});

	it('CA-193: un miembro no revisa, no anula ni lee la lista', () => {
		const { id } = registrarCafe();

		expect(() => revisarCafesVisitante(entorno.ambiente, miembro, { ids: [id], decision: 'aprobar' })).toThrow(ErrorDeNegocio);
		expect(() => anularCafeVisitante(entorno.ambiente, miembro, id, 'Motivo')).toThrow(ErrorDeNegocio);
		expect(() => leerCafesVisitante(entorno.ambiente.db, miembro, { vista: 'pendientes', pagina: 1 })).toThrow(ErrorDeNegocio);
	});

	it('INV-02: anular una compra tras aprobar un café de visitante mantiene la reconstrucción del stock', async () => {
		const { id: compraId } = await registrarCompra(entorno.ambiente, admin, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 5, importe: 250 }],
			confirmoHuchaNegativa: false,
		});
		const { id } = registrarCafe();
		revisarCafesVisitante(entorno.ambiente, admin, { ids: [id], decision: 'aprobar' });

		anularCompra(entorno.ambiente, admin, compraId, 'Ticket duplicado');

		expect(stock()).toBe(9);
	});

	it('research R11: superar el límite de frecuencia de la visita rechaza el café', () => {
		const ambiente = { ...entorno.ambiente, limitadorVisitantes: crearLimitador({ maximo: 2, ventanaMs: 60_000 }) };
		const visita = visitaDePrueba();
		const registrar = () => registrarCafeVisitante(ambiente, visita, { clienteId: nuevoId(), tipoCapsulaId: tipo, horaGesto: INSTANTE });

		registrar();
		registrar();

		expect(registrar).toThrow(ErrorDeNegocio);
		expect(contarCafesVisitantePendientes(entorno.ambiente.db)).toBe(2);
	});

	it('CA-194: el visitante solo ve los tipos activos con coste, sin precio ni stock; sin visita no ve nada', async () => {
		const sinCoste = await prepararTipo(entorno.ambiente);
		const retirado = await prepararTipo(entorno.ambiente);
		await registrarCompra(entorno.ambiente, admin, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: retirado, cantidad: 2, importe: 100 }],
			confirmoHuchaNegativa: false,
		});
		cambiarEstadoCapsula(entorno.ambiente, admin, retirado, 'retirado');

		const tipos = leerTiposParaVisitante(entorno.ambiente.db, visitaDePrueba());

		expect(tipos.map((t) => t.id)).toEqual([tipo]);
		expect(Object.keys(tipos[0] ?? {})).not.toContain('precio');
		expect(tipos.some((t) => t.id === sinCoste)).toBe(false);
		expect(() => leerTiposParaVisitante(entorno.ambiente.db, undefined)).toThrow(ErrorDeNegocio);
	});

	it('CA-191: un tipo sin coste medio se rechaza y una hora del toque futura se sustituye por la de registro', async () => {
		const sinCoste = await prepararTipo(entorno.ambiente);
		const visita = visitaDePrueba();

		expect(() =>
			registrarCafeVisitante(entorno.ambiente, visita, { clienteId: nuevoId(), tipoCapsulaId: sinCoste, horaGesto: INSTANTE }),
		).toThrow(ErrorDeNegocio);
		registrarCafeVisitante(entorno.ambiente, visita, { clienteId: nuevoId(), tipoCapsulaId: tipo, horaGesto: '2099-01-01T00:00:00.000Z' });
		expect(leerCafesDeVisita(entorno.ambiente.db, visita.id)[0]?.horaGesto).toBe(INSTANTE);
	});

	it('CA-193: un identificador desconocido cuenta como ya revisado y anularlo responde no encontrado', () => {
		expect(revisarCafesVisitante(entorno.ambiente, admin, { ids: [nuevoId()], decision: 'rechazar' })).toEqual({
			aprobados: 0,
			rechazados: 0,
			yaRevisados: 1,
		});
		expect(() => anularCafeVisitante(entorno.ambiente, admin, nuevoId(), 'Motivo')).toThrow(RecursoNoEncontrado);
	});

	it('CA-193: la lista de revisados empieza por el último revisado y se pagina', () => {
		const primero = registrarCafe().id;
		revisarCafesVisitante(entorno.ambiente, admin, { ids: [primero], decision: 'rechazar' });
		entorno.reloj.avanzar(60_000);
		const segundo = registrarCafe().id;
		revisarCafesVisitante(entorno.ambiente, admin, { ids: [segundo], decision: 'aprobar' });

		const revisados = leerCafesVisitante(entorno.ambiente.db, admin, { vista: 'revisados', pagina: 1 });
		expect(revisados.filas.map((f) => f.id)).toEqual([segundo, primero]);
		expect(revisados.total).toBe(2);
		expect(leerCafesVisitante(entorno.ambiente.db, admin, { vista: 'revisados', pagina: 2 }).filas).toEqual([]);
	});
});
