import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Tablas de `usuarios` (data-model.md). Solo las escribe este módulo.
export const usuario = sqliteTable(
	'usuario',
	{
		id: text('id').primaryKey(),
		nombre: text('nombre').notNull(),
		email: text('email').notNull().unique(),
		rol: text('rol', { enum: ['miembro', 'administrador'] }).notNull(),
		estado: text('estado', { enum: ['activo', 'baja'] }).notNull(),
		privacidadVersion: integer('privacidad_version'),
		privacidadLeidaEn: text('privacidad_leida_en'),
		creadoEn: text('creado_en').notNull(),
		bajaEn: text('baja_en'),
	},
	(tabla) => [
		index('usuario_rol_estado').on(tabla.rol, tabla.estado),
		check('usuario_rol_valido', sql`${tabla.rol} IN ('miembro', 'administrador')`),
		check('usuario_estado_valido', sql`${tabla.estado} IN ('activo', 'baja')`),
		check('usuario_nombre_valido', sql`length(${tabla.nombre}) BETWEEN 1 AND 80 AND ${tabla.nombre} = trim(${tabla.nombre})`),
	],
);

export const registroAuditoria = sqliteTable(
	'registro_auditoria',
	{
		id: text('id').primaryKey(),
		actorId: text('actor_id').references(() => usuario.id),
		accion: text('accion').notNull(),
		objetoTipo: text('objeto_tipo').notNull(),
		objetoId: text('objeto_id').notNull(),
		detalle: text('detalle').notNull(),
		creadoEn: text('creado_en').notNull(),
	},
	(tabla) => [index('registro_auditoria_objeto').on(tabla.objetoTipo, tabla.objetoId)],
);
