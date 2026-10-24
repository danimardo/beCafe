import { z } from 'zod';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import type { Actor } from '#lib/server/auth';
import { darDeAltaCapsula, registrarCompra, registrarConsumo, saldoPersona } from '#lib/server/economia';
import { notificacion } from '#lib/server/notificaciones';
import { crearEntornoPrueba, crearPlanificador, crearRelojFijo, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, marcarBaja } from '#lib/server/usuarios';
import { esquemaMes } from '#lib/shared/fechas/tipos';
import { enviarResumenMensual, mesAnteriorDe, TAREA_RESUMEN_MENSUAL } from './resumen-mensual';
import { determinarAguador, leerAguador, rellenoAgua, TAREA_AGUADOR } from '#lib/server/rellenos';

// Plan F6 D8, tarea T032: resumen mensual del mes anterior (CA-104). Solo API pública de `economia` y `usuarios`.
const INSTANTE_DISPARO = '2026-11-01T08:00:00.000Z';
const ADMIN_CATALOGO: Actor = {
	usuarioId: '01ADMIN0000000000000000000',
	rol: 'administrador',
	autenticadoEn: INSTANTE_DISPARO,
	sesionIdHash: 'hash-admin',
};

function actorDe(usuarioId: string): Actor {
	return { usuarioId, rol: 'miembro', autenticadoEn: INSTANTE_DISPARO, sesionIdHash: `hash-${usuarioId}` };
}

describe('mesAnteriorDe (D8)', () => {
	it('el disparo del 1 de noviembre a las 09:00 de Madrid resume octubre', () => {
		expect(mesAnteriorDe(new Date(INSTANTE_DISPARO))).toBe('2026-10');
	});

	it('cruza el año: el 1 de enero resume diciembre', () => {
		expect(mesAnteriorDe(new Date('2027-01-01T08:00:00.000Z'))).toBe('2026-12');
	});
});

describe('enviarResumenMensual (CA-104, D8)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE_DISPARO);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function persona(nombre: string): string {
		const id = nuevoId();
		crearUsuario(entorno.ambiente.db, { id, nombre, correo: `${id}@example.test`, rol: 'miembro', instante: INSTANTE_DISPARO });
		return id;
	}

	async function tipoConCoste(): Promise<string> {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN_CATALOGO, {
			nombre: `Tipo ${nuevoId()}`,
			marca: 'Marca de prueba',
			intensidad: 5,
			color: 'cap-ristretto',
			umbralMinimo: 0,
		});
		const comprador = persona('Comprador');
		await registrarCompra(entorno.ambiente, actorDe(comprador), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: id, cantidad: 100, importe: 3483 }],
			confirmoHuchaNegativa: true,
		});
		return id;
	}

	function toque(usuarioId: string, tipoCapsulaId: string, horaGesto: string, invitado = false) {
		return registrarConsumo(entorno.ambiente, actorDe(usuarioId), {
			clienteId: nuevoId(),
			tipoCapsulaId,
			invitado,
			horaGesto,
			via: 'directo',
		});
	}

	function avisosDe(usuarioId: string) {
		return entorno.ambiente.db
			.select()
			.from(notificacion)
			.where(eq(notificacion.usuarioId, usuarioId))
			.all()
			.filter((fila) => fila.tipo === 'resumen_mensual');
	}

	it('CA-104: cada miembro activo recibe sus cafés, invitados y saldo del mes anterior', async () => {
		const tipoCafe = await tipoConCoste();
		const ana = persona('Ana');
		toque(ana, tipoCafe, '2026-10-05T09:00:00.000Z');
		toque(ana, tipoCafe, '2026-10-06T09:00:00.000Z');
		toque(ana, tipoCafe, '2026-10-07T09:00:00.000Z', true);
		const { db } = entorno.ambiente;

		const registrados = enviarResumenMensual({ db, reloj: entorno.reloj, periodo: esquemaMes.parse('2026-10') });

		const avisos = avisosDe(ana);
		expect(registrados).toBeGreaterThan(0);
		expect(avisos).toHaveLength(1);
		expect(JSON.parse(avisos[0].datos)).toEqual({ mes: '2026-10', cafes: 2, invitados: 1, saldo: saldoPersona(db, ana) });
	});

	it('no repite el resumen de un mismo mes aunque la tarea se ejecute otra vez', () => {
		const { db } = entorno.ambiente;
		const periodo = esquemaMes.parse('2026-10');
		persona('Ana');

		const primera = enviarResumenMensual({ db, reloj: entorno.reloj, periodo });
		const segunda = enviarResumenMensual({ db, reloj: entorno.reloj, periodo });

		expect(primera).toBeGreaterThan(0);
		expect(segunda).toBe(0);
	});

	it('excluye a las personas de baja', () => {
		const { db } = entorno.ambiente;
		const bea = persona('Bea');
		marcarBaja(db, { usuarioId: bea, instante: INSTANTE_DISPARO });

		enviarResumenMensual({ db, reloj: entorno.reloj, periodo: esquemaMes.parse('2026-10') });

		expect(avisosDe(bea)).toHaveLength(0);
	});

	it('servidor parado a las 09:00: la recuperación al arrancar lo registra una vez', async () => {
		const { db } = entorno.ambiente;
		const ana = persona('Ana');
		// El servidor estuvo parado a las 09:00 del 1 de noviembre; arranca el 2 a las 10:00 UTC.
		const reloj = crearRelojFijo('2026-11-02T10:00:00.000Z');
		const planificador = crearPlanificador({ db, reloj });
		planificador.registrar({
			nombre: TAREA_RESUMEN_MENSUAL,
			cron: '0 9 1 * *',
			periodo: mesAnteriorDe,
			ejecutar: ({ periodo }) => {
				if (periodo) enviarResumenMensual({ db, reloj, periodo: esquemaMes.parse(periodo) });
			},
		});

		await planificador.recuperar();
		await planificador.recuperar();

		expect(avisosDe(ana)).toHaveLength(1);
	});
});

// Plan F8 D5 y tarea T023: tras una caída del día 1, el aguador se fija antes que el resumen y el resumen lo incluye.
describe('resumen mensual con el aguador (T023, Clarifications 5)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE_DISPARO);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('la recuperación ejecuta primero el aguador y el resumen lo incluye', async () => {
		const { db } = entorno.ambiente;
		const ana = nuevoId();
		crearUsuario(db, { id: ana, nombre: 'Ana', correo: `${ana}@example.test`, rol: 'miembro', instante: INSTANTE_DISPARO });
		for (let dia = 1; dia <= 3; dia++) {
			db.insert(rellenoAgua)
				.values({ id: nuevoId(), clienteId: nuevoId(), usuarioId: ana, registradoEn: `2026-10-0${dia}T10:00:00.000Z`, estado: 'vigente' })
				.run();
		}
		const reloj = crearRelojFijo('2026-11-02T10:00:00.000Z');
		const planificador = crearPlanificador({ db, reloj });
		planificador.registrar({
			nombre: TAREA_AGUADOR,
			cron: '5 0 1 * *',
			periodo: mesAnteriorDe,
			ejecutar: ({ periodo }) => {
				if (periodo) determinarAguador({ db, reloj, mes: esquemaMes.parse(periodo) });
			},
		});
		planificador.registrar({
			nombre: TAREA_RESUMEN_MENSUAL,
			cron: '0 9 1 * *',
			periodo: mesAnteriorDe,
			ejecutar: ({ periodo }) => {
				if (periodo) enviarResumenMensual({ db, reloj, periodo: esquemaMes.parse(periodo) });
			},
		});

		await planificador.recuperar();

		const avisos = db.select().from(notificacion).where(eq(notificacion.usuarioId, ana)).all();
		expect(avisos).toHaveLength(1);
		expect(z.object({ aguadores: z.array(z.string()) }).parse(JSON.parse(avisos[0].datos)).aguadores).toEqual(['Ana']);
		expect(leerAguador(db, esquemaMes.parse('2026-10'))).toHaveLength(1);
	});
});
