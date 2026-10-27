import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearPlanificador, marcarEjecucion, tieneEjecucion } from './planificador';
import { enTransaccion } from './db/conexion';
import { crearRelojFijo } from './reloj';
import { crearEntornoPrueba, type EntornoPrueba } from './pruebas/entorno-prueba';

// Plan F6 D6 y D8: tareas programadas en `Europe/Madrid`, con una sola ejecución por periodo (Clarifications 2).
// No se llama a `iniciar()`: los disparos reales no se prueban aquí, solo el cálculo de periodos y la recuperación.

const CRON_MENSUAL = '0 9 1 * *';

describe('marcarEjecucion y tieneEjecucion (D8)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba('2026-11-02T10:00:00.000Z');
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('la primera marca de un periodo devuelve true y la segunda false', () => {
		const { db } = entorno.ambiente;
		const instante = entorno.reloj.ahora();
		const primera = enTransaccion(db, (tx) => marcarEjecucion(tx, 'resumen', '2026-11', instante));
		const segunda = enTransaccion(db, (tx) => marcarEjecucion(tx, 'resumen', '2026-11', instante));
		expect(primera).toBe(true);
		expect(segunda).toBe(false);
	});

	it('tieneEjecucion distingue la tarea y el periodo', () => {
		const { db } = entorno.ambiente;
		enTransaccion(db, (tx) => marcarEjecucion(tx, 'resumen', '2026-11', entorno.reloj.ahora()));
		expect(tieneEjecucion(db, 'resumen', '2026-11')).toBe(true);
		expect(tieneEjecucion(db, 'resumen', '2026-10')).toBe(false);
		expect(tieneEjecucion(db, 'recordatorio', '2026-11')).toBe(false);
	});
});

describe('recuperar (D8, Clarifications 2)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba('2026-11-02T10:00:00.000Z');
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('ejecuta una vez la última ejecución programada que no tiene fila, y no la repite', async () => {
		const { db } = entorno.ambiente;
		const instantes: string[] = [];
		const planificador = crearPlanificador({ db, reloj: entorno.reloj });
		planificador.registrar({
			nombre: 'resumen',
			cron: CRON_MENSUAL,
			periodo: (instante) => instante.toISOString().slice(0, 7),
			ejecutar({ periodo, instante }) {
				instantes.push(`${periodo}@${instante}`);
				enTransaccion(db, (tx) => marcarEjecucion(tx, 'resumen', periodo ?? '', instante));
			},
		});

		await planificador.recuperar();
		await planificador.recuperar();

		// El 1 de noviembre a las 09:00 de Madrid (CET, UTC+1) son las 08:00 UTC.
		expect(instantes).toEqual([`2026-11@2026-11-02T10:00:00.000Z`]);
		expect(tieneEjecucion(db, 'resumen', '2026-11')).toBe(true);
	});

	it('no ejecuta nada si la última ejecución programada ya tiene fila', async () => {
		const { db } = entorno.ambiente;
		enTransaccion(db, (tx) => marcarEjecucion(tx, 'resumen', '2026-11', entorno.reloj.ahora()));
		let llamadas = 0;
		const planificador = crearPlanificador({ db, reloj: entorno.reloj });
		planificador.registrar({
			nombre: 'resumen',
			cron: CRON_MENSUAL,
			periodo: (instante) => instante.toISOString().slice(0, 7),
			ejecutar() {
				llamadas += 1;
			},
		});

		await planificador.recuperar();

		expect(llamadas).toBe(0);
	});

	it('una tarea sin periodo no se recupera tras una caída', async () => {
		const { db } = entorno.ambiente;
		let llamadas = 0;
		const planificador = crearPlanificador({ db, reloj: entorno.reloj });
		planificador.registrar({
			nombre: 'limpieza',
			cron: CRON_MENSUAL,
			ejecutar() {
				llamadas += 1;
			},
		});

		await planificador.recuperar();

		expect(llamadas).toBe(0);
	});

	it('calcula la última instancia con el horario de verano de Madrid', async () => {
		const { db } = entorno.ambiente;
		// El 1 de abril (CEST, UTC+2) a las 09:00 de Madrid son las 07:00 UTC. El reloj está el 2 de abril a las 10:00 UTC.
		const reloj = crearRelojFijo('2026-04-02T10:00:00.000Z');
		const ultimas: string[] = [];
		const planificador = crearPlanificador({ db, reloj });
		planificador.registrar({
			nombre: 'resumen',
			cron: CRON_MENSUAL,
			periodo: (instante) => {
				ultimas.push(instante.toISOString());
				return instante.toISOString().slice(0, 7);
			},
			ejecutar() {
				return undefined;
			},
		});

		await planificador.recuperar();

		expect(ultimas).toEqual(['2026-04-01T07:00:00.000Z']);
	});

	it('el orden de registro es el de ejecución durante la recuperación', async () => {
		const { db } = entorno.ambiente;
		const orden: string[] = [];
		const planificador = crearPlanificador({ db, reloj: entorno.reloj });
		for (const nombre of ['primera', 'segunda']) {
			planificador.registrar({
				nombre,
				cron: CRON_MENSUAL,
				periodo: (instante) => instante.toISOString().slice(0, 7),
				ejecutar() {
					orden.push(nombre);
				},
			});
		}

		await planificador.recuperar();

		expect(orden).toEqual(['primera', 'segunda']);
	});
});

describe('iniciar con el mismo nombre (recarga en caliente)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba('2026-11-02T10:00:00.000Z');
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('un planificador nuevo sustituye al anterior en vez de fallar con «name already taken»', () => {
		const { db } = entorno.ambiente;
		const crear = () => {
			const planificador = crearPlanificador({ db, reloj: entorno.reloj });
			planificador.registrar({ nombre: 'recordatorio_deuda', cron: CRON_MENSUAL, ejecutar: () => {} });
			return planificador;
		};
		const primero = crear();
		const segundo = crear();
		try {
			primero.iniciar();
			expect(() => segundo.iniciar()).not.toThrow();
		} finally {
			primero.detener();
			segundo.detener();
		}
		// Tras detener los dos, el nombre queda libre para un tercero.
		const tercero = crear();
		expect(() => tercero.iniciar()).not.toThrow();
		tercero.detener();
	});
});
