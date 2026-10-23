import { Cron } from 'croner';
import { and, eq } from 'drizzle-orm';
import type { InstanteUtc } from '#lib/shared/fechas/tipos';
import { conOperacion } from './contexto-operacion';
import type { Db, Tx } from './db/conexion';
import { ejecucionTarea } from './db/esquema-planificador';
import { registrar } from './registro';
import type { Reloj } from './reloj';

// Planificador de tareas programadas (plan F6 D6, D8; ARCHITECTURE.md §11). Único archivo que importa `croner`.
// Las horas se calculan en `Europe/Madrid`. Una tarea con periodo se recupera al arrancar si su última ejecución programada
// no tiene fila en `ejecucion_tarea` (Clarifications 2: solo el último periodo).

export const ZONA_TAREAS = 'Europe/Madrid';

export type ContextoEjecucion = { periodo: string | undefined; instante: InstanteUtc };

export type DefinicionTarea = {
	/** Nombre estable: forma parte de la clave de `ejecucion_tarea` y del registro. */
	nombre: string;
	/** Expresión cron de cinco campos, en hora de Madrid. */
	cron: string;
	/** Periodo al que pertenece la ejecución programada en ese instante. Sin él, la tarea no se recupera tras una caída. */
	periodo?: (instante: Date) => string;
	ejecutar: (contexto: ContextoEjecucion) => void | Promise<void>;
};

export type Planificador = {
	registrar(definicion: DefinicionTarea): void;
	iniciar(): void;
	detener(): void;
	recuperar(): Promise<void>;
};

/** Inserta la ejecución de una tarea en su periodo. Devuelve `false` si ya existía: la tarea no debe repetir su trabajo. */
export function marcarEjecucion(tx: Tx, tarea: string, periodo: string, instante: InstanteUtc): boolean {
	const resultado = tx.insert(ejecucionTarea).values({ tarea, periodo, ejecutadaEn: instante }).onConflictDoNothing().run();
	return resultado.changes > 0;
}

export function tieneEjecucion(db: Db | Tx, tarea: string, periodo: string): boolean {
	return (
		db
			.select({ tarea: ejecucionTarea.tarea })
			.from(ejecucionTarea)
			.where(and(eq(ejecucionTarea.tarea, tarea), eq(ejecucionTarea.periodo, periodo)))
			.get() !== undefined
	);
}

/** Crea el planificador. El reloj llega por parámetro; en pruebas no se llama a `iniciar()`. */
export function crearPlanificador({ db, reloj }: { db: Db; reloj: Reloj }): Planificador {
	const definiciones: DefinicionTarea[] = [];
	const trabajos: Cron[] = [];

	async function ejecutar(definicion: DefinicionTarea, periodo: string | undefined, instante: InstanteUtc): Promise<void> {
		const inicio = Date.now();
		await conOperacion(async () => {
			registrar('tarea.iniciada', periodo === undefined ? { tarea: definicion.nombre } : { tarea: definicion.nombre, periodo });
			try {
				await definicion.ejecutar({ periodo, instante });
				registrar('tarea.completada', { tarea: definicion.nombre, duracionMs: Date.now() - inicio });
			} catch (causa) {
				const tipo = causa instanceof Error ? causa.name : 'desconocido';
				registrar('tarea.fallida', { tarea: definicion.nombre, duracionMs: Date.now() - inicio, tipo });
			}
		});
	}

	return {
		registrar(definicion) {
			definiciones.push(definicion);
		},
		iniciar() {
			for (const definicion of definiciones) {
				trabajos.push(
					new Cron(definicion.cron, { timezone: ZONA_TAREAS, protect: true, name: definicion.nombre }, () => {
						const instante = reloj.ahora();
						const periodo = definicion.periodo?.(new Date(instante));
						void ejecutar(definicion, periodo, instante);
					}),
				);
			}
		},
		detener() {
			for (const trabajo of trabajos.splice(0)) trabajo.stop();
		},
		async recuperar() {
			const ahora = reloj.ahora();
			for (const definicion of definiciones) {
				if (!definicion.periodo) continue;
				const calendario = new Cron(definicion.cron, { timezone: ZONA_TAREAS, paused: true });
				// `previousRun()` solo devuelve la última ejecución real de este proceso; `previousRuns` calcula la programada.
				const ultima = calendario.previousRuns(1, new Date(ahora)).at(0);
				calendario.stop();
				if (!ultima) continue;
				const periodo = definicion.periodo(ultima);
				if (!tieneEjecucion(db, definicion.nombre, periodo)) {
					await ejecutar(definicion, periodo, ahora);
				}
			}
		},
	};
}
