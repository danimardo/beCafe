import { and, desc, eq } from 'drizzle-orm';
import { exigirSesion, type Actor } from '#lib/server/auth';
import {
	borrarFoto,
	enTransaccion,
	ErrorDeNegocio,
	guardarFoto,
	nuevoId,
	procesarFoto,
	RecursoNoEncontrado,
	registrar,
	rutaFoto,
	type Ambiente,
	type Ejecutor,
	type Tx,
} from '#lib/server/plataforma';
import { leerTipo, listarTipos } from '#lib/server/catalogo';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { registrarAviso } from '#lib/server/notificaciones';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { avisoEconomia, compra, consumo, existencia, lineaCompra, regularizacion } from './esquema';
import { anotarMovimientos, anularMovimientosDe, saldoHucha } from './libro';
import { costeTrasCompra, ESTADO_INICIAL, precioDeConsumo } from './dominio/coste-medio';
import { estadosTrasCada, leerHistoria } from './historia';
import { fijarStock, leerExistenciaTx } from './existencias';
import { comprobarPermisoAnulacion, datosAnulacion, exigirAnulacionAplicada } from './anulaciones';
import { leerConfiguracion } from '#lib/server/configuracion';

// Compras de cápsulas (RF-020 a RF-027, CA-040 a CA-043, RN-001 a RN-004) y su anulación (CA-045, RN-037).
// La foto del ticket se guarda antes de la transacción; si la transacción falla o la compra ya existía, se borra.

export type LineaCompra = { tipoCapsulaId: string; cantidad: number; importe: number };
export type DatosCompra = { clienteId: string; lineas: readonly LineaCompra[]; foto?: Uint8Array; confirmoHuchaNegativa: boolean };
export type ResultadoCompra = { id: string; duplicado: boolean };
export type ResumenRegularizacion = { usuarioId: string; importe: number };

export async function registrarCompra(ambiente: Ambiente, actor: Actor, datos: DatosCompra): Promise<ResultadoCompra> {
	const instante = ambiente.reloj.ahora();
	const fotoRuta = await prepararFoto(ambiente, datos.foto);
	let resultado: ResultadoCompra;
	try {
		resultado = enTransaccion(ambiente.db, (tx) => escribirCompra(tx, { datos, actorId: actor.usuarioId, instante, fotoRuta }));
	} catch (causa) {
		descartarFoto(ambiente, fotoRuta);
		throw causa;
	}
	if (resultado.duplicado) descartarFoto(ambiente, fotoRuta);
	else registrar('compra.registrada', { compraId: resultado.id, lineas: datos.lineas.length });
	return resultado;
}

function escribirCompra(
	tx: Tx,
	entrada: { datos: DatosCompra; actorId: string; instante: string; fotoRuta: string | null },
): ResultadoCompra {
	const { datos, actorId, instante, fotoRuta } = entrada;
	const existente = tx.select({ id: compra.id }).from(compra).where(eq(compra.clienteId, datos.clienteId)).get();
	if (existente) {
		registrar('registro.duplicado', { tipo: 'compra', id: existente.id });
		return { id: existente.id, duplicado: true };
	}

	for (const linea of datos.lineas) {
		if (leerTipo(tx, linea.tipoCapsulaId)?.estado !== 'activo') throw new ErrorDeNegocio('TIPO_NO_DISPONIBLE');
	}

	const total = datos.lineas.reduce((suma, linea) => suma + linea.importe, 0);
	if (saldoHucha(tx) - total < 0 && !datos.confirmoHuchaNegativa) throw new ErrorDeNegocio('CONFIRMACION_REQUERIDA');

	const id = nuevoId();
	tx.insert(compra)
		.values({
			id,
			clienteId: datos.clienteId,
			usuarioId: actorId,
			importeTotal: total,
			fotoTicketRuta: fotoRuta,
			huchaNegativaConfirmada: datos.confirmoHuchaNegativa,
			registradaEn: instante,
		})
		.run();

	for (const linea of datos.lineas) {
		const existencia0 = leerExistenciaTx(tx, linea.tipoCapsulaId);
		const nuevoCoste = costeTrasCompra(existencia0.stock, existencia0.costeMedio, linea.cantidad, linea.importe);
		tx.insert(lineaCompra)
			.values({ id: nuevoId(), compraId: id, tipoCapsulaId: linea.tipoCapsulaId, cantidad: linea.cantidad, importe: linea.importe })
			.run();
		fijarStock(tx, linea.tipoCapsulaId, existencia0.stock + linea.cantidad, instante);
		tx.update(existencia).set({ costeMedio: nuevoCoste }).where(eq(existencia.tipoCapsulaId, linea.tipoCapsulaId)).run();
	}

	anotarMovimientos(tx, [
		{ cuenta: 'hucha', usuarioId: null, tipo: 'hucha_compra', importe: -total, origenTipo: 'compra', origenId: id, creadoEn: instante },
	]);

	if (saldoHucha(tx) < 0) {
		tx.insert(avisoEconomia)
			.values({ id: nuevoId(), tipo: 'hucha_negativa', origenTipo: 'compra', origenId: id, registradoEn: instante })
			.run();
		registrarAviso(tx, {
			tipo: 'hucha_negativa',
			datos: { saldoHucha: saldoHucha(tx) },
			origenId: id,
			instante: esquemaInstanteUtc.parse(instante),
		});
		registrar('hucha.negativa_registrada', { origenTipo: 'compra', origenId: id });
	}
	return { id, duplicado: false };
}

/** Anula una compra (RF-060 a RF-062): revierte stock, comprueba la reconstrucción y regulariza los consumos (CA-045). */
export function anularCompra(ambiente: Ambiente, actor: Actor, id: string, motivo: string): ResumenRegularizacion[] {
	const ahora = ambiente.reloj.ahora();
	const resumen = enTransaccion(ambiente.db, (tx) => {
		const fila = tx.select().from(compra).where(eq(compra.id, id)).get();
		if (!fila) throw new RecursoNoEncontrado();
		comprobarPermisoAnulacion(actor, fila.usuarioId, fila.registradaEn, leerConfiguracion(tx).plazoAutoanulacionMin, ahora);
		const actualizada = tx
			.update(compra)
			.set(datosAnulacion(actor.usuarioId, motivo, ahora))
			.where(and(eq(compra.id, id), eq(compra.estado, 'vigente')))
			.run();
		exigirAnulacionAplicada(actualizada.changes);
		anularMovimientosDe(tx, 'compra', id, ahora);

		const lineas = tx.select().from(lineaCompra).where(eq(lineaCompra.compraId, id)).all();
		const regularizaciones: { usuarioId: string; importe: number }[] = [];
		for (const linea of lineas) {
			const existencia0 = leerExistenciaTx(tx, linea.tipoCapsulaId);
			fijarStock(tx, linea.tipoCapsulaId, existencia0.stock - linea.cantidad, ahora);
			regularizaciones.push(...regularizarTipo(tx, { tipoCapsulaId: linea.tipoCapsulaId, compraId: id, instante: ahora }));
		}
		return agrupar(regularizaciones);
	});
	registrar('anulacion.registrada', { tipo: 'compra', id });
	if (resumen.length > 0) registrar('regularizacion.aplicada', { compraId: id, consumos: resumen.length });
	return resumen;
}

/**
 * Reconstruye la historia de un tipo sin la compra anulada, comprueba que el stock y el coste guardados coinciden
 * (INV-02) y calcula la regularización de cada consumo vigente cuyo precio debido cambió (RN-037).
 */
function regularizarTipo(tx: Tx, entrada: { tipoCapsulaId: string; compraId: string; instante: string }) {
	const historia = leerHistoria(tx, entrada.tipoCapsulaId);
	const estados = estadosTrasCada(historia);
	const reconstruido = estados.at(-1) ?? ESTADO_INICIAL;
	const guardado = leerExistenciaTx(tx, entrada.tipoCapsulaId);
	if (reconstruido.stock !== guardado.stock) {
		registrar('invariante.violada', { tipo: 'stock', id: entrada.tipoCapsulaId });
		throw new Error('La reconstrucción del stock no coincide con el guardado');
	}
	tx.update(existencia).set({ costeMedio: reconstruido.costeMedio }).where(eq(existencia.tipoCapsulaId, entrada.tipoCapsulaId)).run();

	const consumosVigentes = new Map(
		tx
			.select({ id: consumo.id, usuarioId: consumo.usuarioId, precioAplicado: consumo.precioAplicado })
			.from(consumo)
			.where(and(eq(consumo.tipoCapsulaId, entrada.tipoCapsulaId), eq(consumo.estado, 'vigente')))
			.all()
			.map((fila) => [fila.id, fila]),
	);

	const resultado: { usuarioId: string; importe: number }[] = [];
	historia.forEach((evento, indice) => {
		if (evento.hecho.tipo !== 'consumo') return;
		const fila = consumosVigentes.get(evento.id);
		if (!fila) return;
		const persona = buscarUsuarioPorId(tx, fila.usuarioId);
		if (persona?.estado !== 'activo') return;

		// Sin ninguna compra vigente que fije el precio, el consumo se queda como estaba (Clarifications 5).
		const costeDebido = costeDebidoDe(historia, estados, indice);
		if (costeDebido === null) return;
		const importe = fila.precioAplicado - precioDeConsumo(costeDebido);
		if (importe === 0) return;

		const regularizacionId = nuevoId();
		tx.insert(regularizacion)
			.values({
				id: regularizacionId,
				compraId: entrada.compraId,
				consumoId: fila.id,
				usuarioId: fila.usuarioId,
				importe,
				creadaEn: entrada.instante,
			})
			.run();
		anotarMovimientos(tx, [
			{
				cuenta: 'persona',
				usuarioId: fila.usuarioId,
				tipo: 'regularizacion',
				importe,
				origenTipo: 'regularizacion',
				origenId: regularizacionId,
				creadoEn: entrada.instante,
			},
		]);
		resultado.push({ usuarioId: fila.usuarioId, importe });
	});
	return resultado;
}

/** Coste debido a un consumo: el medio vigente cuando se consumió o, sin compra previa, el de la siguiente compra. */
function costeDebidoDe(
	historia: ReturnType<typeof leerHistoria>,
	estados: ReturnType<typeof estadosTrasCada>,
	indice: number,
): number | null {
	const aplicado = estados[indice]?.costePorConsumo.get(historia[indice]?.id ?? '') ?? null;
	if (aplicado !== null) return aplicado;
	const siguiente = historia.findIndex((evento, j) => j > indice && evento.hecho.tipo === 'compra');
	return siguiente === -1 ? null : (estados[siguiente]?.costeMedio ?? null);
}

function agrupar(parcial: readonly { usuarioId: string; importe: number }[]): ResumenRegularizacion[] {
	const porPersona = new Map<string, number>();
	for (const { usuarioId, importe } of parcial) porPersona.set(usuarioId, (porPersona.get(usuarioId) ?? 0) + importe);
	return [...porPersona].map(([usuarioId, importe]) => ({ usuarioId, importe }));
}

// ---------------------------------------------------------------------------------------------------------------
// Lecturas (RF-020 a RF-027). Cualquier persona activa puede ver las compras.

export function leerComprasRecientes(db: Ejecutor, actor: Actor | undefined, limite: number) {
	exigirSesion(actor);
	return db.select().from(compra).orderBy(desc(compra.registradaEn)).limit(limite).all();
}

export function leerTiposComprables(db: Ejecutor, actor: Actor | undefined) {
	exigirSesion(actor);
	return listarTipos(db).filter((tipo) => tipo.estado === 'activo');
}

export function leerCompra(db: Ejecutor, actor: Actor | undefined, id: string) {
	exigirSesion(actor);
	const cabecera = db.select().from(compra).where(eq(compra.id, id)).get();
	if (!cabecera) throw new RecursoNoEncontrado();
	const lineas = db.select().from(lineaCompra).where(eq(lineaCompra.compraId, id)).all();
	const regularizaciones =
		cabecera.estado === 'anulado' ? db.select().from(regularizacion).where(eq(regularizacion.compraId, id)).all() : [];
	return { ...cabecera, lineas, regularizaciones };
}

/** Ruta de la foto del ticket de una compra, o `null` si no tiene. La sirve la ruta `/fotos/compras/[compraId]`. */
export function leerFotoTicket(ambiente: Ambiente, actor: Actor | undefined, id: string): string | null {
	exigirSesion(actor);
	const cabecera = ambiente.db.select({ foto: compra.fotoTicketRuta }).from(compra).where(eq(compra.id, id)).get();
	if (!cabecera) throw new RecursoNoEncontrado();
	return cabecera.foto ? rutaFoto(ambiente.directorioFotos, cabecera.foto) : null;
}

// ---------------------------------------------------------------------------------------------------------------
// Foto del ticket: misma regla que las fotos de los tipos (constitución V).

async function prepararFoto(ambiente: Ambiente, foto: Uint8Array | undefined): Promise<string | null> {
	if (!foto) return null;
	const contenido = await procesarFoto(foto);
	const nombre = `${nuevoId()}.webp`;
	guardarFoto(ambiente.directorioFotos, nombre, contenido);
	return nombre;
}

function descartarFoto(ambiente: Ambiente, nombre: string | null): void {
	if (nombre) borrarFoto(ambiente.directorioFotos, nombre);
}
