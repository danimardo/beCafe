import { sql } from 'drizzle-orm';
import { check, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
		/** Nombre del archivo de la foto en `/data/fotos/usuarios/` (RF-208). Sin foto, iniciales (RF-209). */
		fotoRuta: text('foto_ruta'),
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

// Marcas de la cuenta (plan F10 D8 y D9, RF-204, RF-206, RF-207). Se guardan en el servidor y no en el navegador (constitución V).
export const CLAVES_CUENTA = ['tour_inicio_visto', 'instalacion_descartada', 'oferta_avisos_vista'] as const;

export const preferenciaCuenta = sqliteTable(
	'preferencia_cuenta',
	{
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		clave: text('clave', { enum: CLAVES_CUENTA }).notNull(),
		valorEn: text('valor_en').notNull(),
	},
	(tabla) => [
		primaryKey({ columns: [tabla.usuarioId, tabla.clave] }),
		check('preferencia_cuenta_clave_valida', sql`${tabla.clave} IN ('tour_inicio_visto', 'instalacion_descartada', 'oferta_avisos_vista')`),
	],
);

// Frases de Capsulito ya entregadas a cada persona (F11, RN-088, RN-089). El ciclo vive en la cuenta, no en el navegador
// (constitución V). La clave primaria impide entregar dos veces la misma frase en un ciclo.
export const LISTAS_FRASE = ['registro', 'saludo'] as const;

export const fraseEntregada = sqliteTable(
	'frase_entregada',
	{
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		lista: text('lista', { enum: LISTAS_FRASE }).notNull(),
		ciclo: integer('ciclo').notNull(),
		fraseId: text('frase_id').notNull(),
		entregadaEn: text('entregada_en').notNull(),
	},
	(tabla) => [
		primaryKey({ columns: [tabla.usuarioId, tabla.lista, tabla.ciclo, tabla.fraseId] }),
		index('frase_entregada_ultima').on(tabla.usuarioId, tabla.lista, tabla.entregadaEn),
		check('frase_entregada_lista_valida', sql`${tabla.lista} IN ('registro', 'saludo')`),
		check('frase_entregada_ciclo_valido', sql`${tabla.ciclo} >= 1`),
	],
);
