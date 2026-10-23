import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntornoPrueba, enTransaccion, nuevoId, type Db, type EntornoPrueba } from '#lib/server/plataforma';
import { eq } from 'drizzle-orm';
import { crearUsuario, usuario } from '#lib/server/usuarios';
import { configuracion } from '#lib/server/configuracion';
import { notificacion } from '#lib/server/notificaciones';
import { anotarMovimientos } from './libro';
import { recordarDeudas } from './recordatorio-deuda';

// EV-101 y CA-074 (RN-074, Clarifications 7 y 8): aviso al cruzar el límite y recordatorio diario por tramos.
// Límite por defecto: −500 céntimos (−5 €).
const INICIO = '2026-10-21T09:00:00.000Z';
const DIA = 24 * 60 * 60 * 1000;

describe('deuda: aviso al cruzar y recordatorio diario (CA-074, EV-101)', () => {
	let entorno: EntornoPrueba;
	let db: Db;
	let ana: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INICIO);
		db = entorno.ambiente.db;
		ana = nuevoId();
		crearUsuario(db, { id: ana, nombre: 'Ana', correo: `ana-${ana}@ejemplo.test`, rol: 'miembro', instante: INICIO });
	});

	afterEach(() => {
		entorno.cerrar();
	});

	/** Mueve el saldo de Ana en el libro, como lo haría un consumo o una compra: con su misma transacción. */
	function mover(importe: number): void {
		enTransaccion(db, (tx) =>
			anotarMovimientos(tx, [
				{
					cuenta: 'persona',
					usuarioId: ana,
					tipo: 'cargo_consumo',
					importe,
					origenTipo: 'consumo',
					origenId: nuevoId(),
					creadoEn: entorno.reloj.ahora(),
				},
			]),
		);
	}

	function avisosDeuda(): number {
		return db
			.select()
			.from(notificacion)
			.all()
			.filter((fila) => fila.tipo === 'deuda' && fila.usuarioId === ana).length;
	}

	function recordar(): number {
		return recordarDeudas({ db, reloj: entorno.reloj });
	}

	it('CA-074: cruzar el límite registra un aviso de deuda; seguir por debajo no registra otro', () => {
		mover(-480);
		expect(avisosDeuda()).toBe(0);
		mover(-40);
		expect(avisosDeuda()).toBe(1);
		mover(-10);
		expect(avisosDeuda()).toBe(1);
	});

	it('CA-074: volver por encima y bajar de nuevo genera un aviso nuevo', () => {
		mover(-600);
		mover(300);
		mover(-400);
		expect(avisosDeuda()).toBe(2);
	});

	it('EV-101: con −6 € el recordatorio llega cada 7 días, no antes', () => {
		mover(-600);
		entorno.reloj.avanzar(6 * DIA);
		expect(recordar()).toBe(0);
		entorno.reloj.avanzar(DIA);
		expect(recordar()).toBe(1);
	});

	it('EV-101: con −12 € el recordatorio llega cada 3 días', () => {
		mover(-1200);
		entorno.reloj.avanzar(2 * DIA);
		expect(recordar()).toBe(0);
		entorno.reloj.avanzar(DIA);
		expect(recordar()).toBe(1);
	});

	it('EV-101: con −25 € el recordatorio llega cada día', () => {
		mover(-2500);
		entorno.reloj.avanzar(DIA);
		expect(recordar()).toBe(1);
	});

	it('CA-074 punto 3: con el límite cambiado a −10 €, −12 € pasa a recibirlo cada 7 días', () => {
		mover(-1200);
		db.insert(configuracion).values({ clave: 'limite_deuda_centimos', valor: '-1000', modificadoPor: ana, modificadoEn: INICIO }).run();
		entorno.reloj.avanzar(6 * DIA);
		expect(recordar()).toBe(0);
		entorno.reloj.avanzar(DIA);
		expect(recordar()).toBe(1);
	});

	it('Clarifications 7: una segunda ejecución del mismo día no envía nada', () => {
		mover(-2500);
		entorno.reloj.avanzar(DIA);
		expect(recordar()).toBe(1);
		expect(recordar()).toBe(0);
	});

	it('una persona de baja no recibe recordatorios', () => {
		mover(-2500);
		db.update(usuario).set({ estado: 'baja', bajaEn: INICIO }).where(eq(usuario.id, ana)).run();
		entorno.reloj.avanzar(DIA);
		expect(recordar()).toBe(0);
	});
});
