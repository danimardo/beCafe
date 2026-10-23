import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Ejecuciones de tareas programadas (plan F6 D8; Clarifications 2). La clave primaria impide la doble ejecución de una tarea
// en un mismo periodo, aunque el servidor arranque dos veces o se recupere tras una caída.
export const ejecucionTarea = sqliteTable(
	'ejecucion_tarea',
	{
		tarea: text('tarea').notNull(),
		periodo: text('periodo').notNull(),
		ejecutadaEn: text('ejecutada_en').notNull(),
	},
	(tabla) => [primaryKey({ columns: [tabla.tarea, tabla.periodo] })],
);
