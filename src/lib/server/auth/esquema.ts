import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { usuario } from '../usuarios';

// Tablas de `auth` (data-model.md, research R11). La clave externa a `usuario` la declara este módulo.
export const credencial = sqliteTable(
	'credencial',
	{
		usuarioId: text('usuario_id')
			.primaryKey()
			.references(() => usuario.id),
		hash: text('hash').notNull(),
		intentosFallidos: integer('intentos_fallidos').notNull().default(0),
		bloqueadoHasta: text('bloqueado_hasta'),
		actualizadaEn: text('actualizada_en').notNull(),
	},
	(tabla) => [check('credencial_intentos_no_negativos', sql`${tabla.intentosFallidos} >= 0`)],
);

export const sesion = sqliteTable(
	'sesion',
	{
		idHash: text('id_hash').primaryKey(),
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		creadaEn: text('creada_en').notNull(),
		ultimoUsoEn: text('ultimo_uso_en').notNull(),
		ultimaAutenticacionEn: text('ultima_autenticacion_en').notNull(),
	},
	(tabla) => [index('sesion_usuario').on(tabla.usuarioId)],
);

export const enlaceAcceso = sqliteTable(
	'enlace_acceso',
	{
		id: text('id').primaryKey(),
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		tipo: text('tipo').notNull(),
		tokenHash: text('token_hash').notNull().unique(),
		expiraEn: text('expira_en').notNull(),
		usadoEn: text('usado_en'),
		anuladoEn: text('anulado_en'),
		creadoPor: text('creado_por').references(() => usuario.id),
		creadoEn: text('creado_en').notNull(),
	},
	(tabla) => [
		index('enlace_acceso_usuario').on(tabla.usuarioId),
		check('enlace_acceso_tipo_valido', sql`${tabla.tipo} IN ('invitacion', 'recuperacion')`),
	],
);
