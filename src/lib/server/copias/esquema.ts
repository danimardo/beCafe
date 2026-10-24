import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { usuario } from '#lib/server/usuarios';

// Tablas de `copias` (plan F8, data-model.md). Una copia guarda su estado y su código de error, nunca la URL firmada ni las claves (constitución XVI).

export const ESTADOS_COPIA = ['en_curso', 'correcta', 'fallida'] as const;
export const CODIGOS_COPIA = ['S3_CREDENCIALES', 'S3_RED', 'S3_RESPUESTA', 'INSTANTANEA', 'DISCO', 'INTERRUMPIDA'] as const;
export const RESULTADOS_PRUEBA = ['correcta', 'fallida'] as const;

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
	},
	(tabla) => [
		index('copia_seguridad_iniciada').on(tabla.iniciadaEn),
		check(
			'copia_seguridad_correcta_completa',
			sql`${tabla.estado} <> 'correcta' OR (${tabla.tamano} IS NOT NULL AND ${tabla.sha256} IS NOT NULL AND ${tabla.claveObjeto} IS NOT NULL)`,
		),
		check('copia_seguridad_fallida_con_codigo', sql`${tabla.estado} <> 'fallida' OR ${tabla.codigoError} IS NOT NULL`),
	],
);

export const pruebaRestauracion = sqliteTable(
	'prueba_restauracion',
	{
		id: text('id').primaryKey(),
		adminId: text('admin_id')
			.notNull()
			.references(() => usuario.id),
		realizadaEl: text('realizada_el').notNull(),
		resultado: text('resultado', { enum: RESULTADOS_PRUEBA }).notNull(),
		notas: text('notas'),
		anotadaEn: text('anotada_en').notNull(),
	},
	(tabla) => [check('prueba_restauracion_notas_longitud', sql`${tabla.notas} IS NULL OR length(${tabla.notas}) <= 500`)],
);
