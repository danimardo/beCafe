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

// Sesiones cerradas por una baja (F4, plan D5). Guarda el hash del identificador de sesión, nunca el token.
export const sesionCerradaPorBaja = sqliteTable(
	'sesion_cerrada_por_baja',
	{
		idHash: text('id_hash').primaryKey(),
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		cerradaEn: text('cerrada_en').notNull(),
	},
	(tabla) => [index('sesion_cerrada_por_baja_usuario').on(tabla.usuarioId)],
);

// Enlaces de visitante (plan F10 D1, RF-189, RF-190). El token viaja en la URL y en el QR; la base guarda su SHA-256.
export const enlaceVisitante = sqliteTable(
	'enlace_visitante',
	{
		id: text('id').primaryKey(),
		tokenHash: text('token_hash').notNull().unique(),
		creadoPor: text('creado_por')
			.notNull()
			.references(() => usuario.id),
		creadoEn: text('creado_en').notNull(),
		expiraEn: text('expira_en').notNull(),
		revocadoEn: text('revocado_en'),
		revocadoPor: text('revocado_por').references(() => usuario.id),
	},
	(tabla) => [index('enlace_visitante_creador').on(tabla.creadoPor)],
);

// Visitas abiertas con un enlace (RF-190, RF-210). La cookie `becafe_visita` lleva el token; aquí solo su SHA-256.
export const visita = sqliteTable(
	'visita',
	{
		id: text('id').primaryKey(),
		enlaceId: text('enlace_id')
			.notNull()
			.references(() => enlaceVisitante.id),
		tokenHash: text('token_hash').notNull().unique(),
		nombre: text('nombre'),
		nombreEliminadoEn: text('nombre_eliminado_en'),
		creadaEn: text('creada_en').notNull(),
	},
	(tabla) => [
		index('visita_enlace').on(tabla.enlaceId),
		check(
			'visita_nombre_valido',
			sql`${tabla.nombre} IS NULL OR (length(${tabla.nombre}) BETWEEN 1 AND 60 AND ${tabla.nombre} = trim(${tabla.nombre}))`,
		),
	],
);
