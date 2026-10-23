import { check, index, integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { usuario } from '#lib/server/usuarios';
import { TIPOS_DESACTIVABLES, TIPOS_NOTIFICACION } from '#lib/shared/contratos/push';

// Tablas de `notificaciones` (plan F6, data-model.md). Un aviso se guarda una vez por destinatario; la entrega push, una vez
// por dispositivo. Sin datos de suscripción en el log (constitución XVI).

export { TIPOS_DESACTIVABLES, TIPOS_NOTIFICACION };
export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[number];
export const ESTADOS_ENTREGA = ['pendiente', 'enviada', 'agotada', 'caducada'] as const;
export type TipoDesactivable = (typeof TIPOS_DESACTIVABLES)[number];

export const notificacion = sqliteTable(
	'notificacion',
	{
		id: text('id').primaryKey(),
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		tipo: text('tipo', { enum: TIPOS_NOTIFICACION }).notNull(),
		datos: text('datos').notNull(),
		origenId: text('origen_id'),
		creadaEn: text('creada_en').notNull(),
		vistaEn: text('vista_en'),
	},
	(tabla) => [
		index('notificacion_usuario_creada').on(tabla.usuarioId, tabla.creadaEn),
		index('notificacion_usuario_tipo_creada').on(tabla.usuarioId, tabla.tipo, tabla.creadaEn),
	],
);

export const suscripcionPush = sqliteTable('suscripcion_push', {
	id: text('id').primaryKey(),
	usuarioId: text('usuario_id')
		.notNull()
		.references(() => usuario.id),
	endpoint: text('endpoint').notNull().unique(),
	clavePdh: text('clave_p256dh').notNull(),
	claveAuth: text('clave_auth').notNull(),
	creadaEn: text('creada_en').notNull(),
	actualizadaEn: text('actualizada_en').notNull(),
});

export const entregaPush = sqliteTable(
	'entrega_push',
	{
		id: text('id').primaryKey(),
		notificacionId: text('notificacion_id')
			.notNull()
			.references(() => notificacion.id, { onDelete: 'cascade' }),
		suscripcionId: text('suscripcion_id')
			.notNull()
			.references(() => suscripcionPush.id, { onDelete: 'cascade' }),
		estado: text('estado', { enum: ESTADOS_ENTREGA }).notNull(),
		intentos: integer('intentos').notNull().default(0),
		proximoIntento: text('proximo_intento').notNull(),
		ultimoCodigo: integer('ultimo_codigo'),
	},
	(tabla) => [
		unique('entrega_push_unica').on(tabla.notificacionId, tabla.suscripcionId),
		index('entrega_push_estado_proximo').on(tabla.estado, tabla.proximoIntento),
		check('entrega_push_intentos_validos', sql`${tabla.intentos} >= 0`),
	],
);

export const preferenciaNotificacion = sqliteTable(
	'preferencia_notificacion',
	{
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		tipo: text('tipo', { enum: TIPOS_DESACTIVABLES }).notNull(),
		activada: integer('activada', { mode: 'boolean' }).notNull(),
	},
	(tabla) => [primaryKey({ columns: [tabla.usuarioId, tabla.tipo] })],
);
