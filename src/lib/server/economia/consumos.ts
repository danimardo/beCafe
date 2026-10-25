import { and, desc, eq, gte, sql, type SQL } from 'drizzle-orm';
import { exigirSesion, type Actor } from '#lib/server/auth';
import { leerConfiguracion } from '#lib/server/configuracion';
import { leerTipo, listarTipos } from '#lib/server/catalogo';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { registrarAviso } from '#lib/server/notificaciones';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import {
	enTransaccion,
	ErrorDeNegocio,
	nuevoId,
	RecursoNoEncontrado,
	registrar,
	type Ambiente,
	type Db,
	type Ejecutor,
	type Tx,
} from '#lib/server/plataforma';
import { textos } from '#lib/shared/textos';
import { avisoEconomia, consumo, existencia } from './esquema';
import { anotarMovimientos, anularMovimientosDe } from './libro';
import { precioDeConsumo } from './dominio/coste-medio';
import { estimarDias, inicioVentanaEstimacion, type EstimacionDias } from './dominio/stock';
import { fijarStock, leerExistenciaTx } from './existencias';
import { comprobarPermisoAnulacion, datosAnulacion, exigirAnulacionAplicada } from './anulaciones';

// Consumos de cápsulas (RF-010 a RF-019, RF-060 a RF-063; CA-010 a CA-017, CA-060 a CA-063; RN-001, RN-002, RN-005,
// RN-006, RN-013, RN-031, RN-034). Un solo caso de uso para el toque con red, la cola sin conexión y «Deshacer» (plan D1).
// Cada consumo y sus efectos (cargo y stock) se escriben en la misma transacción (RNF-010, constitución IV).

const MILISEGUNDOS_POR_MINUTO = 60_000;
const TAMANO_HISTORIAL = 20;
const LIMITE_RECIENTES = 5;

export type DatosConsumo = {
	clienteId: string;
	tipoCapsulaId: string;
	invitado: boolean;
	/** Hora del toque (RF-018). Si es posterior a la recepción se usa la recepción (Clarifications 9). */
	horaGesto: string;
	via: 'directo' | 'cola';
	/** La tarjeta se mostró «Sin stock» (RF-217). Solo la acción de Inicio lo envía; `/api/consumos` no. */
	sinStockVisto?: boolean;
	/** La persona confirmó que cogió una cápsula con el sistema en 0 (RF-217). */
	confirmado?: boolean;
};

export type ResultadoConsumo = { id: string; precio: number; descuadre: boolean; duplicado: boolean };

export type TipoRegistrable = {
	id: string;
	nombre: string;
	marca: string;
	intensidad: number | null;
	color: string;
	fotoRuta: string | null;
	stock: number;
	umbralMinimo: number;
	enStockBajo: boolean;
	/** Coste medio en diezmilésimas de euro (RN-021). Siempre presente: un tipo sin coste no es registrable. */
	costeMedio: number;
	/** Precio de una cápsula en céntimos. */
	precio: number;
	estimacion: EstimacionDias;
};

/**
 * Registra un consumo (RF-011, RF-012, RF-016 a RF-018). Con un `clienteId` ya recibido devuelve el original
 * (EV-010, INV-04). El autor es siempre quien actúa (RN-034); el contrato no admite otro.
 */
export function registrarConsumo(ambiente: Ambiente, actor: Actor, datos: DatosConsumo): ResultadoConsumo {
	const ahora = ambiente.reloj.ahora();
	return enTransaccion(ambiente.db, (tx) => {
		const existente = tx
			.select({ id: consumo.id, precio: consumo.precioAplicado })
			.from(consumo)
			.where(eq(consumo.clienteId, datos.clienteId))
			.get();
		if (existente) {
			registrar('consumo.duplicado', { consumoId: existente.id });
			return { id: existente.id, precio: existente.precio, descuadre: false, duplicado: true };
		}
		exigirPersonaActiva(tx, actor.usuarioId);
		if (!leerTipo(tx, datos.tipoCapsulaId)) throw new ErrorDeNegocio('TIPO_NO_DISPONIBLE');

		const previa = leerExistenciaTx(tx, datos.tipoCapsulaId);
		if (previa.costeMedio === null) throw new ErrorDeNegocio('TIPO_SIN_COSTE');
		// RF-217: con el sistema en 0, una tarjeta que se mostró «Sin stock» pide confirmación antes de escribir nada.
		if (previa.stock <= 0 && datos.sinStockVisto && !datos.confirmado) {
			registrar('consumo.confirmacion_sin_stock', { tipoCapsulaId: datos.tipoCapsulaId });
			throw new ErrorDeNegocio('CONFIRMAR_SIN_STOCK');
		}
		const precio = precioDeConsumo(previa.costeMedio);
		const id = nuevoId();

		tx.insert(consumo)
			.values({
				id,
				clienteId: datos.clienteId,
				usuarioId: actor.usuarioId,
				tipoCapsulaId: datos.tipoCapsulaId,
				invitado: datos.invitado,
				precioAplicado: precio,
				costeMedioAplicado: previa.costeMedio,
				horaGesto: horaDelGesto(datos.horaGesto, ahora),
				horaRegistro: ahora,
			})
			.run();
		fijarStock(tx, datos.tipoCapsulaId, previa.stock - 1, ahora);
		// Un precio de 0 no tiene movimiento: un importe 0 no es un movimiento (regla de `libro`, Clarifications 8).
		if (precio > 0) {
			anotarMovimientos(tx, [
				{
					cuenta: 'persona',
					usuarioId: actor.usuarioId,
					tipo: 'cargo_consumo',
					importe: -precio,
					origenTipo: 'consumo',
					origenId: id,
					creadoEn: ahora,
				},
			]);
		}

		const descuadre = previa.stock <= 0;
		if (descuadre) {
			tx.insert(avisoEconomia)
				.values({ id: nuevoId(), tipo: 'stock_negativo', origenTipo: 'consumo', origenId: id, registradoEn: ahora })
				.run();
			const tipo = leerTipo(tx, datos.tipoCapsulaId);
			if (!tipo) throw new RecursoNoEncontrado();
			registrarAviso(tx, {
				tipo: 'stock_negativo',
				datos: { tipoCapsulaId: datos.tipoCapsulaId, nombreTipo: tipo.nombre, stock: previa.stock - 1 },
				origenId: id,
				instante: esquemaInstanteUtc.parse(ahora),
			});
			registrar('stock.negativo_registrado', { tipoCapsulaId: datos.tipoCapsulaId });
		}
		registrar('consumo.registrado', { consumoId: id, tipoCapsulaId: datos.tipoCapsulaId, via: datos.via });
		return { id, precio, descuadre, duplicado: false };
	});
}

/** «Deshacer» (RF-013, RN-031): anulación del autor con el motivo fijo, dentro del plazo (Clarifications 5). */
export function deshacerConsumo(ambiente: Ambiente, actor: Actor, id: string): void {
	anularConsumoCaso(ambiente, actor, id, textos.economia.motivoDeshacer, true);
}

/** Anula un consumo con motivo (RF-060, RF-061). El stock vuelve a sumar 1; el coste medio no se recalcula (RN-013). */
export function anularConsumo(ambiente: Ambiente, actor: Actor, id: string, motivo: string): void {
	anularConsumoCaso(ambiente, actor, id, motivo, false);
}

function anularConsumoCaso(ambiente: Ambiente, actor: Actor, id: string, motivo: string, deshecho: boolean): void {
	const ahora = ambiente.reloj.ahora();
	enTransaccion(ambiente.db, (tx) => {
		const fila = tx.select().from(consumo).where(eq(consumo.id, id)).get();
		if (!fila) throw new RecursoNoEncontrado();
		if (fila.estado === 'anulado') throw new ErrorDeNegocio('YA_ANULADO');
		if (buscarUsuarioPorId(tx, fila.usuarioId)?.estado === 'baja') throw new ErrorDeNegocio('ESTADO_INCORRECTO');
		comprobarPermisoAnulacion(actor, fila.usuarioId, fila.horaRegistro, leerConfiguracion(tx).plazoAutoanulacionMin, ahora);

		const actualizada = tx
			.update(consumo)
			.set(datosAnulacion(actor.usuarioId, motivo, ahora))
			.where(and(eq(consumo.id, id), eq(consumo.estado, 'vigente')))
			.run();
		exigirAnulacionAplicada(actualizada.changes);
		anularMovimientosDe(tx, 'consumo', id, ahora);
		const previa = leerExistenciaTx(tx, fila.tipoCapsulaId);
		fijarStock(tx, fila.tipoCapsulaId, previa.stock + 1, ahora);
	});
	registrar('anulacion.registrada', { tipo: 'consumo', id, deshecho });
}

/** Tipos que se pueden registrar: activos y con coste medio (RF-004, RN-006, CA-010). */
export function leerTiposRegistrables(db: Ejecutor, actor: Actor | undefined, ahora: string): TipoRegistrable[] {
	exigirSesion(actor);
	const existencias = new Map(
		db
			.select()
			.from(existencia)
			.all()
			.map((fila) => [fila.tipoCapsulaId, fila]),
	);
	const recientes = consumosRecientesPorTipo(db, ahora);
	return listarTipos(db)
		.filter((tipo) => tipo.estado === 'activo')
		.flatMap((tipo) => {
			const fila = existencias.get(tipo.id);
			if (!fila || fila.costeMedio === null) return [];
			return [
				{
					id: tipo.id,
					nombre: tipo.nombre,
					marca: tipo.marca,
					intensidad: tipo.intensidad,
					color: tipo.color,
					fotoRuta: tipo.fotoRuta,
					stock: fila.stock,
					umbralMinimo: fila.umbralMinimo,
					enStockBajo: fila.enStockBajo,
					costeMedio: fila.costeMedio,
					precio: precioDeConsumo(fila.costeMedio),
					estimacion: estimarDias(fila.stock, recientes.get(tipo.id) ?? 0),
				},
			];
		});
}

/** Consumos vigentes de la persona dentro del plazo de autoanulación: «Tus últimos consumos» (plan D4). */
export function leerConsumosRecientesPropios(db: Db, actor: Actor | undefined, ahora: string) {
	const autor = exigirSesion(actor);
	const plazoMs = leerConfiguracion(db).plazoAutoanulacionMin * MILISEGUNDOS_POR_MINUTO;
	const desde = new Date(Date.parse(ahora) - plazoMs).toISOString();
	return db
		.select()
		.from(consumo)
		.where(and(eq(consumo.usuarioId, autor.usuarioId), eq(consumo.estado, 'vigente'), gte(consumo.horaRegistro, desde)))
		.orderBy(desc(consumo.horaRegistro))
		.limit(LIMITE_RECIENTES)
		.all();
}

/** Un consumo, para su autor o un administrador (RF-060, RF-061). Un miembro que pide uno ajeno recibe «no encontrado». */
export function leerConsumo(db: Ejecutor, actor: Actor | undefined, id: string) {
	const autor = exigirSesion(actor);
	const fila = db.select().from(consumo).where(eq(consumo.id, id)).get();
	if (!fila || (autor.rol !== 'administrador' && fila.usuarioId !== autor.usuarioId)) throw new RecursoNoEncontrado();
	return fila;
}

/** Consumos recientes: un miembro ve los suyos; un administrador, los de todos. Página de 20 (plan D4, F6 lo amplía). */
export function leerHistorialConsumos(db: Ejecutor, actor: Actor | undefined, pagina: number) {
	const autor = exigirSesion(actor);
	const filtro: SQL | undefined = autor.rol === 'administrador' ? undefined : eq(consumo.usuarioId, autor.usuarioId);
	const filas = db
		.select()
		.from(consumo)
		.where(filtro)
		.orderBy(desc(consumo.horaRegistro))
		.limit(TAMANO_HISTORIAL + 1)
		.offset((pagina - 1) * TAMANO_HISTORIAL)
		.all();
	return { filas: filas.slice(0, TAMANO_HISTORIAL), pagina, hayMas: filas.length > TAMANO_HISTORIAL };
}

/** Consumos vigentes por tipo dentro de la ventana de la estimación (RN-073). Lo usa también el panel de avisos. */
export function consumosRecientesPorTipo(db: Ejecutor, ahora: string): Map<string, number> {
	const filas = db
		.select({ tipo: consumo.tipoCapsulaId, total: sql<number>`count(*)` })
		.from(consumo)
		.where(and(eq(consumo.estado, 'vigente'), gte(consumo.horaRegistro, inicioVentanaEstimacion(ahora))))
		.groupBy(consumo.tipoCapsulaId)
		.all();
	return new Map(filas.map((fila) => [fila.tipo, fila.total]));
}

/** RF-018 y Clarifications 9: un reloj adelantado no puede poner el toque en el futuro. */
function horaDelGesto(horaGesto: string, ahora: string): string {
	return Date.parse(horaGesto) > Date.parse(ahora) ? ahora : horaGesto;
}

/** Una persona dada de baja no registra consumos (RN-054, INV-06). Se comprueba dentro de la transacción. */
function exigirPersonaActiva(tx: Tx, usuarioId: string): void {
	const persona = buscarUsuarioPorId(tx, usuarioId);
	if (!persona) throw new ErrorDeNegocio('SIN_SESION');
	if (persona.estado === 'baja') throw new ErrorDeNegocio('USUARIO_DE_BAJA');
}
