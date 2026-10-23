import { eq } from 'drizzle-orm';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { crearEntornoPrueba, nuevoId, type Db, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import type { Actor } from '#lib/server/auth';
import { notificacion, type TipoNotificacion } from '#lib/server/notificaciones';
import { registrarCompra } from './compras';
import { registrarConsumo } from './consumos';
import { prepararAportacion, prepararMiembros, prepararTipo } from './pruebas/constructores';

// RF-101 y CA-017, CA-023 y CA-043 (RN-072): cada origen de economía registra su aviso en la misma transacción.
const INSTANTE = '2026-10-22T10:00:00.000Z';

function actorDe(usuarioId: string, rol: Actor['rol'] = 'miembro'): Actor {
	return { usuarioId, rol, autenticadoEn: INSTANTE, sesionIdHash: `hash-${usuarioId}` };
}

function avisosDe(db: Db, tipo: TipoNotificacion): string[] {
	return db
		.select({ usuarioId: notificacion.usuarioId })
		.from(notificacion)
		.where(eq(notificacion.tipo, tipo))
		.all()
		.map((fila) => fila.usuarioId);
}

describe('avisos de economía (RF-101, RN-072, CA-017, CA-023, CA-043)', () => {
	let entorno: EntornoPrueba;
	let db: Db;
	let ana: string;
	let admin: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		db = entorno.ambiente.db;
		[ana] = prepararMiembros(db, 1);
		admin = nuevoId();
		crearUsuario(db, {
			id: admin,
			nombre: 'Admin de prueba',
			correo: `admin-${admin}@example.test`,
			rol: 'administrador',
			instante: INSTANTE,
		});
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('CA-023: al bajar al umbral, stock bajo avisa a todos los activos una vez; un negativo avisa solo a administradores', async () => {
		const tipo = await prepararTipo(entorno.ambiente);
		prepararAportacion(db, { usuarioId: ana, importe: 10_000, instante: INSTANTE });
		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 2, importe: 200 }],
			confirmoHuchaNegativa: false,
		});

		const consumo = (): void => {
			registrarConsumo(entorno.ambiente, actorDe(ana), {
				clienteId: nuevoId(),
				tipoCapsulaId: tipo,
				invitado: false,
				horaGesto: INSTANTE,
				via: 'directo',
			});
		};
		consumo();
		expect(avisosDe(db, 'stock_bajo')).toHaveLength(0);
		consumo();
		expect(avisosDe(db, 'stock_bajo').sort()).toEqual([ana, admin].sort());
		consumo();

		expect(avisosDe(db, 'stock_bajo')).toHaveLength(2);
		expect(avisosDe(db, 'stock_negativo')).toEqual([admin]);
	});

	it('CA-017: un consumo que deja el stock en negativo avisa solo a administradores activos', async () => {
		const tipo = await prepararTipo(entorno.ambiente);
		prepararAportacion(db, { usuarioId: ana, importe: 10_000, instante: INSTANTE });
		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 100 }],
			confirmoHuchaNegativa: false,
		});
		registrarConsumo(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			tipoCapsulaId: tipo,
			invitado: false,
			horaGesto: INSTANTE,
			via: 'directo',
		});
		registrarConsumo(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			tipoCapsulaId: tipo,
			invitado: false,
			horaGesto: INSTANTE,
			via: 'directo',
		});

		expect(avisosDe(db, 'stock_negativo')).toEqual([admin]);
	});

	it('CA-043: una compra que deja la hucha en negativo avisa a administradores, no a miembros', async () => {
		const tipo = await prepararTipo(entorno.ambiente);
		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 300 }],
			confirmoHuchaNegativa: true,
		});

		expect(avisosDe(db, 'hucha_negativa')).toEqual([admin]);
	});

	it('el aviso de hucha negativa guarda el saldo en céntimos, sin datos de la persona', async () => {
		const tipo = await prepararTipo(entorno.ambiente);
		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 300 }],
			confirmoHuchaNegativa: true,
		});

		const aviso = db.select().from(notificacion).where(eq(notificacion.tipo, 'hucha_negativa')).get();
		expect(aviso?.datos).toBe(JSON.stringify({ saldoHucha: -300 }));
	});
});
