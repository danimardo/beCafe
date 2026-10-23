import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { usuario } from '#lib/server/usuarios';

// Tablas de `economia` de F2 (plan D1 y D4) y de F4 (más abajo). Las claves de usuario se declaran con `usuario`, que exporta su índice.
// `tipo_capsula_id` no tiene clave externa: `economia` no puede importar el esquema de `catalogo` (ARCHITECTURE.md §4).
// La integridad la comprueban los casos de uso dentro de la misma transacción.

export const existencia = sqliteTable(
	'existencia',
	{
		tipoCapsulaId: text('tipo_capsula_id').primaryKey(),
		umbralMinimo: integer('umbral_minimo').notNull(),
		stock: integer('stock').notNull(),
		costeMedio: integer('coste_medio'),
		enStockBajo: integer('en_stock_bajo', { mode: 'boolean' }).notNull(),
	},
	(tabla) => [
		check('existencia_umbral_valido', sql`${tabla.umbralMinimo} >= 0`),
		check('existencia_coste_medio_valido', sql`${tabla.costeMedio} IS NULL OR ${tabla.costeMedio} >= 0`),
	],
);

export const entradaStockBajo = sqliteTable(
	'entrada_stock_bajo',
	{
		id: text('id').primaryKey(),
		tipoCapsulaId: text('tipo_capsula_id').notNull(),
		registradaEn: text('registrada_en').notNull(),
	},
	(tabla) => [index('entrada_stock_bajo_tipo').on(tabla.tipoCapsulaId)],
);

// ---------------------------------------------------------------------------------------------------------------------
// Tablas de F4 (data-model.md de 003-economia). Solo `economia` las escribe.
// Campos de anulación repetidos en los registros anulables (`anulacion`, abajo). Un CHECK exige que estén todos
// presentes si y solo si el estado es `anulado` (plan de F4, D6).

const anulacion = {
	estado: text('estado', { enum: ['vigente', 'anulado'] })
		.notNull()
		.default('vigente'),
	anuladoPor: text('anulado_por').references(() => usuario.id),
	anuladoEn: text('anulado_en'),
	motivoAnulacion: text('motivo_anulacion'),
};

/** Escribe el CHECK de anulación de una tabla: los tres campos están o no están, según el estado. */
type CamposAnulacion = { estado: unknown; anuladoPor: unknown; anuladoEn: unknown; motivoAnulacion: unknown };

function checkAnulacion(nombre: string, tabla: CamposAnulacion) {
	return check(
		nombre,
		sql`(${tabla.estado} = 'vigente' AND ${tabla.anuladoPor} IS NULL AND ${tabla.anuladoEn} IS NULL AND ${tabla.motivoAnulacion} IS NULL)
			OR (${tabla.estado} = 'anulado' AND ${tabla.anuladoPor} IS NOT NULL AND ${tabla.anuladoEn} IS NOT NULL AND ${tabla.motivoAnulacion} IS NOT NULL)`,
	);
}

export const aportacion = sqliteTable(
	'aportacion',
	{
		id: text('id').primaryKey(),
		clienteId: text('cliente_id').notNull().unique(),
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		registradaPor: text('registrada_por')
			.notNull()
			.references(() => usuario.id),
		importe: integer('importe').notNull(),
		origen: text('origen', { enum: ['directa', 'baja'] }).notNull(),
		registradaEn: text('registrada_en').notNull(),
		...anulacion,
	},
	(tabla) => [
		check('aportacion_importe_valido', sql`${tabla.importe} > 0 AND (${tabla.importe} <= 50000 OR ${tabla.origen} = 'baja')`),
		checkAnulacion('aportacion_anulacion_valida', tabla),
	],
);

export const compra = sqliteTable(
	'compra',
	{
		id: text('id').primaryKey(),
		clienteId: text('cliente_id').notNull().unique(),
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		importeTotal: integer('importe_total').notNull(),
		fotoTicketRuta: text('foto_ticket_ruta'),
		huchaNegativaConfirmada: integer('hucha_negativa_confirmada', { mode: 'boolean' }).notNull(),
		registradaEn: text('registrada_en').notNull(),
		...anulacion,
	},
	(tabla) => [check('compra_importe_valido', sql`${tabla.importeTotal} > 0`), checkAnulacion('compra_anulacion_valida', tabla)],
);

export const lineaCompra = sqliteTable(
	'linea_compra',
	{
		id: text('id').primaryKey(),
		compraId: text('compra_id')
			.notNull()
			.references(() => compra.id),
		tipoCapsulaId: text('tipo_capsula_id').notNull(),
		cantidad: integer('cantidad').notNull(),
		importe: integer('importe').notNull(),
	},
	(tabla) => [
		index('linea_compra_tipo').on(tabla.tipoCapsulaId),
		check('linea_compra_cantidad_valida', sql`${tabla.cantidad} > 0`),
		check('linea_compra_importe_valido', sql`${tabla.importe} > 0`),
	],
);

export const consumo = sqliteTable(
	'consumo',
	{
		id: text('id').primaryKey(),
		clienteId: text('cliente_id').notNull().unique(),
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		tipoCapsulaId: text('tipo_capsula_id').notNull(),
		invitado: integer('invitado', { mode: 'boolean' }).notNull(),
		precioAplicado: integer('precio_aplicado').notNull(),
		costeMedioAplicado: integer('coste_medio_aplicado').notNull(),
		horaGesto: text('hora_gesto').notNull(),
		horaRegistro: text('hora_registro').notNull(),
		...anulacion,
	},
	(tabla) => [
		index('consumo_tipo_hora').on(tabla.tipoCapsulaId, tabla.horaRegistro),
		check('consumo_precio_valido', sql`${tabla.precioAplicado} >= 0`),
		check('consumo_coste_valido', sql`${tabla.costeMedioAplicado} >= 0`),
		checkAnulacion('consumo_anulacion_valida', tabla),
	],
);

export const TIPOS_MOVIMIENTO = [
	'cargo_consumo',
	'abono_aportacion',
	'hucha_aportacion',
	'hucha_compra',
	'hucha_ajuste_arqueo',
	'reparto_arqueo',
	'reparto_recuento',
	'regularizacion',
	'devolucion_baja',
	'hucha_devolucion_baja',
	'abono_incobrable',
	'reparto_incobrable',
] as const;

export const ORIGENES_MOVIMIENTO = [
	'aportacion',
	'compra',
	'consumo',
	'arqueo',
	'linea_recuento',
	'reparto',
	'regularizacion',
	'baja',
] as const;

export const movimiento = sqliteTable(
	'movimiento',
	{
		id: text('id').primaryKey(),
		cuenta: text('cuenta', { enum: ['persona', 'hucha'] }).notNull(),
		usuarioId: text('usuario_id').references(() => usuario.id),
		tipo: text('tipo', { enum: TIPOS_MOVIMIENTO }).notNull(),
		importe: integer('importe').notNull(),
		origenTipo: text('origen_tipo', { enum: ORIGENES_MOVIMIENTO }).notNull(),
		origenId: text('origen_id').notNull(),
		creadoEn: text('creado_en').notNull(),
		vigente: integer('vigente', { mode: 'boolean' }).notNull().default(true),
	},
	(tabla) => [
		index('movimiento_usuario_vigente').on(tabla.usuarioId, tabla.vigente),
		index('movimiento_cuenta_vigente').on(tabla.cuenta, tabla.vigente),
		index('movimiento_origen').on(tabla.origenTipo, tabla.origenId),
		check('movimiento_importe_no_nulo', sql`${tabla.importe} <> 0`),
		check('movimiento_cuenta_usuario', sql`(${tabla.cuenta} = 'persona') = (${tabla.usuarioId} IS NOT NULL)`),
	],
);

export const reparto = sqliteTable(
	'reparto',
	{
		id: text('id').primaryKey(),
		origenTipo: text('origen_tipo', { enum: ['arqueo', 'linea_recuento', 'baja'] }).notNull(),
		origenId: text('origen_id').notNull(),
		importe: integer('importe').notNull(),
		miembros: integer('miembros').notNull(),
		creadoEn: text('creado_en').notNull(),
	},
	(tabla) => [
		index('reparto_origen').on(tabla.origenId),
		check('reparto_importe_no_nulo', sql`${tabla.importe} <> 0`),
		check('reparto_miembros_positivos', sql`${tabla.miembros} > 0`),
	],
);

export const regularizacion = sqliteTable(
	'regularizacion',
	{
		id: text('id').primaryKey(),
		compraId: text('compra_id')
			.notNull()
			.references(() => compra.id),
		consumoId: text('consumo_id')
			.notNull()
			.references(() => consumo.id),
		usuarioId: text('usuario_id')
			.notNull()
			.references(() => usuario.id),
		importe: integer('importe').notNull(),
		creadaEn: text('creada_en').notNull(),
	},
	(tabla) => [
		unique('regularizacion_una_por_consumo').on(tabla.compraId, tabla.consumoId),
		index('regularizacion_compra').on(tabla.compraId),
		check('regularizacion_importe_no_nulo', sql`${tabla.importe} <> 0`),
	],
);

export const arqueo = sqliteTable(
	'arqueo',
	{
		id: text('id').primaryKey(),
		adminId: text('admin_id')
			.notNull()
			.references(() => usuario.id),
		realizadoEn: text('realizado_en').notNull(),
		saldoTeorico: integer('saldo_teorico').notNull(),
		contado: integer('contado').notNull(),
		diferencia: integer('diferencia').notNull(),
		...anulacion,
	},
	(tabla) => [
		index('arqueo_realizado').on(tabla.realizadoEn),
		check('arqueo_contado_valido', sql`${tabla.contado} >= 0`),
		check('arqueo_diferencia_coherente', sql`${tabla.diferencia} = ${tabla.contado} - ${tabla.saldoTeorico}`),
		checkAnulacion('arqueo_anulacion_valida', tabla),
	],
);

export const recuento = sqliteTable('recuento', {
	id: text('id').primaryKey(),
	adminId: text('admin_id')
		.notNull()
		.references(() => usuario.id),
	realizadoEn: text('realizado_en').notNull(),
});

export const lineaRecuento = sqliteTable(
	'linea_recuento',
	{
		id: text('id').primaryKey(),
		recuentoId: text('recuento_id')
			.notNull()
			.references(() => recuento.id),
		tipoCapsulaId: text('tipo_capsula_id').notNull(),
		registrado: integer('registrado').notNull(),
		contado: integer('contado').notNull(),
		diferencia: integer('diferencia').notNull(),
		costeMedioAplicado: integer('coste_medio_aplicado'),
		...anulacion,
	},
	(tabla) => [
		unique('linea_recuento_unica_por_tipo').on(tabla.recuentoId, tabla.tipoCapsulaId),
		index('linea_recuento_tipo_estado').on(tabla.tipoCapsulaId, tabla.estado),
		check('linea_recuento_contado_valido', sql`${tabla.contado} >= 0`),
		check('linea_recuento_diferencia_coherente', sql`${tabla.diferencia} = ${tabla.contado} - ${tabla.registrado}`),
		checkAnulacion('linea_recuento_anulacion_valida', tabla),
	],
);

export const avisoEconomia = sqliteTable(
	'aviso_economia',
	{
		id: text('id').primaryKey(),
		tipo: text('tipo', { enum: ['hucha_negativa', 'stock_negativo'] }).notNull(),
		origenTipo: text('origen_tipo', { enum: ['compra', 'baja', 'consumo'] }).notNull(),
		origenId: text('origen_id').notNull(),
		registradoEn: text('registrado_en').notNull(),
	},
	(tabla) => [index('aviso_economia_tipo').on(tabla.tipo)],
);
