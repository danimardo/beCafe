import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { ZodError } from 'zod';
import { crearEntornoPrueba, enTransaccion, nuevoId, usarRegistro, type Db, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, usuario, type Rol } from '#lib/server/usuarios';
import { crearRegistroFalso } from '../plataforma/pruebas/registro-falso';
import { entregaPush, notificacion, preferenciaNotificacion, suscripcionPush } from './esquema';
import { registrarAviso } from './registrar';

// CA-101, CA-100 y RN-074 (plan D2, Clarifications 3, 5 y 6): destinatarios, entregas y registro sin datos personales.
const ULID_TIPO = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

describe('registrarAviso', () => {
	let entorno: EntornoPrueba;
	let registro: ReturnType<typeof crearRegistroFalso>;
	let db: Db;

	beforeEach(() => {
		entorno = crearEntornoPrueba('2026-10-23T09:00:00.000Z');
		db = entorno.ambiente.db;
		registro = crearRegistroFalso();
		usarRegistro(registro);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function persona(nombre: string, rol: Rol = 'miembro', estado: 'activo' | 'baja' = 'activo'): string {
		const id = nuevoId();
		crearUsuario(db, { id, nombre, correo: `${id}@ejemplo.es`, rol, instante: entorno.reloj.ahora() });
		if (estado === 'baja') db.update(usuario).set({ estado: 'baja', bajaEn: entorno.reloj.ahora() }).where(eq(usuario.id, id)).run();
		return id;
	}

	function dispositivo(usuarioId: string): string {
		const id = nuevoId();
		const instante = entorno.reloj.ahora();
		db.insert(suscripcionPush)
			.values({
				id,
				usuarioId,
				endpoint: `https://push.ejemplo.es/${id}`,
				clavePdh: 'clave',
				claveAuth: 'auth',
				creadaEn: instante,
				actualizadaEn: instante,
			})
			.run();
		return id;
	}

	function avisar(entrada: Parameters<typeof registrarAviso>[1]): number {
		return enTransaccion(db, (tx) => registrarAviso(tx, entrada));
	}

	const stockBajo = { tipoCapsulaId: ULID_TIPO, nombreTipo: 'Lungo', stock: 2 };
	const stockNegativo = { tipoCapsulaId: ULID_TIPO, nombreTipo: 'Lungo', stock: -1 };

	it('CA-101: stock negativo llega solo a administradores activos, y stock bajo a todos los activos', () => {
		persona('Ana', 'administrador');
		persona('Bea');
		persona('Carlos', 'administrador', 'baja');
		persona('Dani', 'miembro', 'baja');

		const negativos = avisar({ tipo: 'stock_negativo', datos: stockNegativo, instante: entorno.reloj.ahora() });
		const bajos = avisar({ tipo: 'stock_bajo', datos: stockBajo, instante: entorno.reloj.ahora() });

		expect(negativos).toBe(1);
		expect(bajos).toBe(2);
	});

	it('CA-100: una persona sin suscripción recibe el aviso sin entregas push', () => {
		const ana = persona('Ana');
		avisar({ tipo: 'stock_bajo', datos: stockBajo, instante: entorno.reloj.ahora() });

		const avisos = db.select().from(notificacion).where(eq(notificacion.usuarioId, ana)).all();
		const entregas = db.select().from(entregaPush).all();
		expect(avisos).toHaveLength(1);
		expect(entregas).toHaveLength(0);
	});

	it('preferencia desactivada: el aviso se guarda y no genera entregas (Clarifications 6)', () => {
		const ana = persona('Ana');
		dispositivo(ana);
		db.insert(preferenciaNotificacion).values({ usuarioId: ana, tipo: 'stock_bajo', activada: false }).run();

		avisar({ tipo: 'stock_bajo', datos: stockBajo, instante: entorno.reloj.ahora() });

		expect(db.select().from(notificacion).all()).toHaveLength(1);
		expect(db.select().from(entregaPush).all()).toHaveLength(0);
	});

	it('preferencia sin fila: el aviso genera una entrega pendiente por dispositivo (Clarifications 5)', () => {
		const ana = persona('Ana');
		dispositivo(ana);
		dispositivo(ana);

		avisar({ tipo: 'stock_bajo', datos: stockBajo, instante: entorno.reloj.ahora() });

		const entregas = db.select().from(entregaPush).all();
		expect(entregas).toHaveLength(2);
		expect(entregas.every((entrega) => entrega.estado === 'pendiente' && entrega.intentos === 0)).toBe(true);
	});

	it('deuda siempre genera entregas, aunque la persona tenga otras preferencias', () => {
		const ana = persona('Ana');
		dispositivo(ana);

		avisar({ tipo: 'deuda', destinatario: ana, datos: { saldo: -600, limite: -500 }, instante: entorno.reloj.ahora() });

		expect(db.select().from(entregaPush).all()).toHaveLength(1);
	});

	it('Clarifications 3: un dispositivo suscrito después no recibe el aviso anterior', () => {
		const ana = persona('Ana');
		avisar({ tipo: 'stock_bajo', datos: stockBajo, instante: entorno.reloj.ahora() });
		dispositivo(ana);

		expect(db.select().from(entregaPush).all()).toHaveLength(0);

		avisar({ tipo: 'stock_bajo', datos: stockBajo, instante: entorno.reloj.ahora() });
		expect(db.select().from(entregaPush).all()).toHaveLength(1);
	});

	it('un tipo dirigido a la persona sin destinatario se rechaza', () => {
		expect(() => avisar({ tipo: 'deuda', datos: { saldo: -600, limite: -500 }, instante: entorno.reloj.ahora() })).toThrow(
			'AVISO_SIN_DESTINATARIO',
		);
	});

	it('datos que no cumplen el esquema del tipo se rechazan sin escribir nada', () => {
		persona('Ana', 'administrador');
		expect(() => avisar({ tipo: 'stock_negativo', datos: { stock: -1 }, instante: entorno.reloj.ahora() })).toThrow(ZodError);
		expect(db.select().from(notificacion).all()).toHaveLength(0);
	});

	it('el evento aviso.registrado solo lleva el tipo y el número de destinatarios', () => {
		persona('Ana', 'administrador');
		avisar({ tipo: 'stock_negativo', datos: stockNegativo, origenId: ULID_TIPO, instante: entorno.reloj.ahora() });

		const evento = registro.eventos.find((item) => item.codigo === 'aviso.registrado');
		expect(evento?.campos).toEqual({ tipo: 'stock_negativo', destinatarios: 1 });
	});

	it('la notificación guarda el origen del registro', () => {
		persona('Ana', 'administrador');
		avisar({ tipo: 'stock_negativo', datos: stockNegativo, origenId: ULID_TIPO, instante: entorno.reloj.ahora() });
		expect(db.select().from(notificacion).get()?.origenId).toBe(ULID_TIPO);
	});
});
