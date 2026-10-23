import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Tabla de `catalogo` (data-model.md de F2). Solo las escribe este módulo.
// El stock, el umbral y el coste medio son de `economia` (tabla `existencia`, plan D1).
export const tipoCapsula = sqliteTable(
	'tipo_capsula',
	{
		id: text('id').primaryKey(),
		nombre: text('nombre').notNull(),
		nombreNormalizado: text('nombre_normalizado').notNull(),
		marca: text('marca').notNull(),
		intensidad: integer('intensidad'),
		color: text('color').notNull(),
		fotoRuta: text('foto_ruta'),
		estado: text('estado', { enum: ['activo', 'retirado'] }).notNull(),
		creadoEn: text('creado_en').notNull(),
		actualizadoEn: text('actualizado_en').notNull(),
	},
	(tabla) => [
		uniqueIndex('tipo_capsula_nombre_activo')
			.on(tabla.nombreNormalizado)
			.where(sql`${tabla.estado} = 'activo'`),
		check('tipo_capsula_estado_valido', sql`${tabla.estado} IN ('activo', 'retirado')`),
		check('tipo_capsula_intensidad_valida', sql`${tabla.intensidad} IS NULL OR ${tabla.intensidad} BETWEEN 1 AND 13`),
		check('tipo_capsula_nombre_valido', sql`length(${tabla.nombre}) BETWEEN 1 AND 60`),
	],
);
