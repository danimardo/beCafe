import { check, index, integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { usuario } from '#lib/server/usuarios';

// Tablas de `rellenos` (plan F8, data-model.md). Un relleno no mueve dinero (RN-080): no hay tablas económicas aquí.
// Un relleno anulado no vuelve a estar vigente (historias.md §6). El aguador del mes se fija el día 1 y no cambia (Clarifications 1).

export const ESTADOS_RELLENO = ['vigente', 'anulado'] as const;

export const rellenoAgua = sqliteTable(
	'relleno_agua',
	{
		id: text('id').primaryKey(),
		clienteId: text('cliente_id').notNull(),
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		registradoEn: text('registrado_en').notNull(),
		estado: text('estado', { enum: ESTADOS_RELLENO }).notNull(),
		anuladoPor: text('anulado_por').references(() => usuario.id),
		anuladoEn: text('anulado_en'),
		motivoAnulacion: text('motivo_anulacion'),
	},
	(tabla) => [
		unique('relleno_agua_cliente').on(tabla.clienteId),
		index('relleno_agua_estado_registrado').on(tabla.estado, tabla.registradoEn),
		index('relleno_agua_usuario_registrado').on(tabla.usuarioId, tabla.registradoEn),
		check(
			'relleno_agua_anulacion_coherente',
			sql`(${tabla.estado} = 'vigente' AND ${tabla.anuladoPor} IS NULL AND ${tabla.anuladoEn} IS NULL AND ${tabla.motivoAnulacion} IS NULL)
				OR (${tabla.estado} = 'anulado' AND ${tabla.anuladoPor} IS NOT NULL AND ${tabla.anuladoEn} IS NOT NULL AND ${tabla.motivoAnulacion} IS NOT NULL)`,
		),
		check('relleno_agua_motivo_longitud', sql`${tabla.motivoAnulacion} IS NULL OR length(${tabla.motivoAnulacion}) BETWEEN 1 AND 200`),
	],
);

export const aguadorMes = sqliteTable(
	'aguador_mes',
	{
		mes: text('mes').notNull(),
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		rellenos: integer('rellenos').notNull(),
		determinadoEn: text('determinado_en').notNull(),
	},
	(tabla) => [primaryKey({ columns: [tabla.mes, tabla.usuarioId] }), check('aguador_mes_rellenos_positivos', sql`${tabla.rellenos} > 0`)],
);
