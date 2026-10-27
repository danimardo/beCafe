import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Tablas de `copias` (plan F8, data-model.md). Una copia guarda su estado y su código de error, nunca la URL firmada ni las claves (constitución XVI).

export const ESTADOS_COPIA = ['en_curso', 'correcta', 'fallida'] as const;
export const CODIGOS_COPIA = ['S3_CREDENCIALES', 'S3_RED', 'S3_RESPUESTA', 'INSTANTANEA', 'DISCO', 'INTERRUMPIDA'] as const;
/** Tipo de una copia registrada: la diaria de las 03:00 o la que lanza un administrador (RF-286). El resguardo no se registra aquí. */
export const TIPOS_REGISTRO_COPIA = ['diaria', 'manual'] as const;
export type TipoRegistroCopia = (typeof TIPOS_REGISTRO_COPIA)[number];

export const copiaSeguridad = sqliteTable(
	'copia_seguridad',
	{
		id: text('id').primaryKey(),
		iniciadaEn: text('iniciada_en').notNull(),
		finalizadaEn: text('finalizada_en'),
		estado: text('estado', { enum: ESTADOS_COPIA }).notNull(),
		tamano: integer('tamano'),
		sha256: text('sha256'),
		claveObjeto: text('clave_objeto'),
		codigoError: text('codigo_error', { enum: CODIGOS_COPIA }),
		estadoHttp: integer('estado_http'),
		tipo: text('tipo', { enum: TIPOS_REGISTRO_COPIA }).notNull().default('diaria'),
	},
	(tabla) => [
		index('copia_seguridad_iniciada').on(tabla.iniciadaEn),
		check(
			'copia_seguridad_correcta_completa',
			sql`${tabla.estado} <> 'correcta' OR (${tabla.tamano} IS NOT NULL AND ${tabla.sha256} IS NOT NULL AND ${tabla.claveObjeto} IS NOT NULL)`,
		),
		check('copia_seguridad_tipo_valido', sql`${tabla.tipo} IN ('diaria', 'manual')`),
		check('copia_seguridad_fallida_con_codigo', sql`${tabla.estado} <> 'fallida' OR ${tabla.codigoError} IS NOT NULL`),
	],
);
