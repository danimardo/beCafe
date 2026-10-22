import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Parámetros de negocio guardados (data-model.md). Sin fila, se usan los valores por defecto de `leer.ts`.
export const configuracion = sqliteTable('configuracion', {
	clave: text('clave').primaryKey(),
	valor: text('valor').notNull(),
	// Sin clave externa: F1 solo admite la arista auth → usuarios (ARCHITECTURE.md §4). El caso de uso guarda el id del actor.
	modificadoPor: text('modificado_por').notNull(),
	modificadoEn: text('modificado_en').notNull(),
});
