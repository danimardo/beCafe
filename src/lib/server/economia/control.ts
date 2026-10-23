import { and, desc, eq, gt } from 'drizzle-orm';
import { exigirAdministrador, exigirReautenticacion, type Actor } from '#lib/server/auth';
import {
	enTransaccion,
	ErrorDeNegocio,
	nuevoId,
	RecursoNoEncontrado,
	registrar,
	type Ambiente,
	type Ejecutor,
	type Tx,
} from '#lib/server/plataforma';
import { listarUsuarios } from '#lib/server/usuarios';
import { arqueo, lineaRecuento, recuento, reparto } from './esquema';
import { anotarMovimientos, anularMovimientosDe, saldoHucha } from './libro';
import { fijarStock, leerExistenciaTx } from './existencias';
import { datosAnulacion, exigirAnulacionAplicada } from './anulaciones';
import { repartir, type Parte } from './dominio/repartos';
import { valorFaltante } from './dominio/coste-medio';

// Control de la hucha y del stock: arqueos y recuentos (RF-080 a RF-092, RN-014 a RN-016, RN-036, RN-050).
// Un arqueo ajusta la hucha y reparte la diferencia entre las personas activas. Un recuento corrige el stock.
// Antes de cada escritura se exige reautenticación (RN-050, CA-138).

const RUTA = 'admin/control';
const LIMITE_HISTORIAL = 10;

export type PrevisionArqueo = {
	saldoTeorico: number;
	contado: number;
	diferencia: number;
	personas: number;
	parteMinima: number;
	parteMaxima: number;
};
export type LineaRecuentoEntrada = { tipoCapsulaId: string; contado: number; registradoPrevisto: number };
export type PrevisionLinea = { tipoCapsulaId: string; registrado: number; contado: number; diferencia: number; valorFaltante: number };

export function leerControl(db: Ejecutor, actor: Actor) {
	exigirAdministrador(actor, RUTA);
	return {
		saldoTeorico: saldoHucha(db),
		arqueos: db.select().from(arqueo).orderBy(desc(arqueo.realizadoEn)).limit(LIMITE_HISTORIAL).all(),
		recuentos: db.select().from(recuento).orderBy(desc(recuento.realizadoEn)).limit(LIMITE_HISTORIAL).all(),
		lineasRecuento: db
			.select({
				id: lineaRecuento.id,
				tipoCapsulaId: lineaRecuento.tipoCapsulaId,
				registrado: lineaRecuento.registrado,
				contado: lineaRecuento.contado,
				diferencia: lineaRecuento.diferencia,
				estado: lineaRecuento.estado,
				realizadoEn: recuento.realizadoEn,
			})
			.from(lineaRecuento)
			.innerJoin(recuento, eq(lineaRecuento.recuentoId, recuento.id))
			.orderBy(desc(recuento.realizadoEn))
			.limit(LIMITE_HISTORIAL * 4)
			.all(),
	};
}

/** Vista previa del arqueo: no escribe nada (RF-081, CA-080). */
export function previsualizarArqueo(db: Ejecutor, actor: Actor, contado: number): PrevisionArqueo {
	exigirAdministrador(actor, RUTA);
	const saldoTeorico = saldoHucha(db);
	const diferencia = contado - saldoTeorico;
	const personas = personasActivas(db).length;
	const { parteMinima, parteMaxima } = rangoPartes(diferencia, personas);
	return { saldoTeorico, contado, diferencia, personas, parteMinima, parteMaxima };
}

/** Vista previa del recuento: el efecto por tipo, sin escribir (RF-091, CA-090). */
export function previsualizarRecuento(db: Ejecutor, actor: Actor, lineas: readonly LineaRecuentoEntrada[]): PrevisionLinea[] {
	exigirAdministrador(actor, RUTA);
	return lineas.map((linea) => {
		const existencia0 = leerExistenciaTx(db, linea.tipoCapsulaId);
		const diferencia = linea.contado - existencia0.stock;
		const valor = diferencia < 0 ? valorFaltante(-diferencia, existencia0.costeMedio) : 0;
		return { tipoCapsulaId: linea.tipoCapsulaId, registrado: existencia0.stock, contado: linea.contado, diferencia, valorFaltante: valor };
	});
}

export async function confirmarArqueo(
	ambiente: Ambiente,
	actor: Actor,
	entrada: { contado: number; contadoPrevisto: number; saldoTeoricoPrevisto: number; contrasenaActual?: string },
): Promise<string> {
	exigirAdministrador(actor, RUTA);
	const instante = ambiente.reloj.ahora();
	await exigirReautenticacion(ambiente.db, { actor, contrasenaActual: entrada.contrasenaActual, instante });
	const id = enTransaccion(ambiente.db, (tx) => {
		const saldoTeorico = saldoHucha(tx);
		if (saldoTeorico !== entrada.saldoTeoricoPrevisto) throw new ErrorDeNegocio('CAMBIO_CONCURRENTE');
		// El contado confirmado debe ser el que vio la administración en la vista previa (RF-081).
		if (entrada.contado !== entrada.contadoPrevisto) throw new ErrorDeNegocio('CAMBIO_CONCURRENTE');
		const diferencia = entrada.contado - saldoTeorico;
		const arqueoId = nuevoId();
		tx.insert(arqueo)
			.values({
				id: arqueoId,
				adminId: actor.usuarioId,
				realizadoEn: instante,
				saldoTeorico,
				contado: entrada.contado,
				diferencia,
				estado: 'vigente',
			})
			.run();
		if (diferencia !== 0) {
			anotarMovimientos(tx, [
				{
					cuenta: 'hucha',
					usuarioId: null,
					tipo: 'hucha_ajuste_arqueo',
					importe: diferencia,
					origenTipo: 'arqueo',
					origenId: arqueoId,
					creadoEn: instante,
				},
			]);
			repartirEnPersonas(tx, {
				importe: diferencia,
				origenTipo: 'arqueo',
				origenId: arqueoId,
				tipo: 'reparto_arqueo',
				instante,
				azar: ambiente.azar,
			});
		}
		return arqueoId;
	});
	registrar('arqueo.registrado', { arqueoId: id });
	return id;
}

export async function confirmarRecuento(
	ambiente: Ambiente,
	actor: Actor,
	entrada: { lineas: readonly LineaRecuentoEntrada[]; contrasenaActual?: string },
): Promise<string> {
	exigirAdministrador(actor, RUTA);
	const instante = ambiente.reloj.ahora();
	await exigirReautenticacion(ambiente.db, { actor, contrasenaActual: entrada.contrasenaActual, instante });
	const id = enTransaccion(ambiente.db, (tx) => {
		const recuentoId = nuevoId();
		tx.insert(recuento).values({ id: recuentoId, adminId: actor.usuarioId, realizadoEn: instante }).run();
		for (const linea of entrada.lineas) {
			const existencia0 = leerExistenciaTx(tx, linea.tipoCapsulaId);
			if (existencia0.stock !== linea.registradoPrevisto) throw new ErrorDeNegocio('CAMBIO_CONCURRENTE');
			const diferencia = linea.contado - existencia0.stock;
			const lineaId = nuevoId();
			tx.insert(lineaRecuento)
				.values({
					id: lineaId,
					recuentoId,
					tipoCapsulaId: linea.tipoCapsulaId,
					registrado: existencia0.stock,
					contado: linea.contado,
					diferencia,
					costeMedioAplicado: existencia0.costeMedio,
					estado: 'vigente',
				})
				.run();
			fijarStock(tx, linea.tipoCapsulaId, linea.contado, instante);
			if (diferencia < 0) {
				const valor = valorFaltante(-diferencia, existencia0.costeMedio);
				if (valor > 0)
					repartirEnPersonas(tx, {
						importe: -valor,
						origenTipo: 'linea_recuento',
						origenId: lineaId,
						tipo: 'reparto_recuento',
						instante,
						azar: ambiente.azar,
					});
			}
		}
		return recuentoId;
	});
	registrar('recuento.registrado', { recuentoId: id, lineas: entrada.lineas.length });
	return id;
}

/** Anula un arqueo: solo el último vigente (CA-064). Revierte su ajuste y su reparto. */
export async function anularArqueo(
	ambiente: Ambiente,
	actor: Actor,
	entrada: { id: string; motivo: string; contrasenaActual?: string },
): Promise<void> {
	exigirAdministrador(actor, RUTA);
	const instante = ambiente.reloj.ahora();
	await exigirReautenticacion(ambiente.db, { actor, contrasenaActual: entrada.contrasenaActual, instante });
	enTransaccion(ambiente.db, (tx) => {
		const fila = tx.select().from(arqueo).where(eq(arqueo.id, entrada.id)).get();
		if (!fila) throw new RecursoNoEncontrado();
		if (!esUltimoArqueo(tx, fila.realizadoEn)) throw new ErrorDeNegocio('NO_ES_EL_ULTIMO');
		const actualizada = tx
			.update(arqueo)
			.set(datosAnulacion(actor.usuarioId, entrada.motivo, instante))
			.where(and(eq(arqueo.id, entrada.id), eq(arqueo.estado, 'vigente')))
			.run();
		exigirAnulacionAplicada(actualizada.changes);
		anularMovimientosDe(tx, 'arqueo', entrada.id, instante);
		anularRepartos(tx, 'arqueo', entrada.id, instante);
	});
	registrar('anulacion.registrada', { tipo: 'arqueo', id: entrada.id });
}

/** Anula una línea de recuento: solo la última vigente de su tipo (CA-064). Revierte el stock y su reparto. */
export async function anularLineaRecuento(
	ambiente: Ambiente,
	actor: Actor,
	entrada: { id: string; motivo: string; contrasenaActual?: string },
): Promise<void> {
	exigirAdministrador(actor, RUTA);
	const instante = ambiente.reloj.ahora();
	await exigirReautenticacion(ambiente.db, { actor, contrasenaActual: entrada.contrasenaActual, instante });
	enTransaccion(ambiente.db, (tx) => {
		const fila = tx.select().from(lineaRecuento).where(eq(lineaRecuento.id, entrada.id)).get();
		if (!fila) throw new RecursoNoEncontrado();
		if (!esUltimaLineaDelTipo(tx, fila.tipoCapsulaId, fila.recuentoId)) throw new ErrorDeNegocio('NO_ES_EL_ULTIMO');
		const actual = leerExistenciaTx(tx, fila.tipoCapsulaId);
		const actualizada = tx
			.update(lineaRecuento)
			.set(datosAnulacion(actor.usuarioId, entrada.motivo, instante))
			.where(and(eq(lineaRecuento.id, entrada.id), eq(lineaRecuento.estado, 'vigente')))
			.run();
		exigirAnulacionAplicada(actualizada.changes);
		fijarStock(tx, fila.tipoCapsulaId, actual.stock - fila.diferencia, instante);
		anularMovimientosDe(tx, 'linea_recuento', entrada.id, instante);
		anularRepartos(tx, 'linea_recuento', entrada.id, instante);
	});
	registrar('anulacion.registrada', { tipo: 'linea_recuento', id: entrada.id });
}

// ---------------------------------------------------------------------------------------------------------------

export function personasActivas(db: Ejecutor) {
	return listarUsuarios(db)
		.filter((persona) => persona.estado === 'activo')
		.sort((a, b) => a.id.localeCompare(b.id));
}

function rangoPartes(diferencia: number, personas: number): { parteMinima: number; parteMaxima: number } {
	if (personas === 0 || diferencia === 0) return { parteMinima: 0, parteMaxima: 0 };
	const magnitud = Math.abs(diferencia);
	const base = Math.floor(magnitud / personas);
	const parteMaxima = magnitud % personas === 0 ? base : base + 1;
	return { parteMinima: base * Math.sign(diferencia), parteMaxima: parteMaxima * Math.sign(diferencia) };
}

/** Reparte un importe entre las personas activas y escribe el reparto y sus movimientos (RN-014, RN-015). */
export function repartirEnPersonas(
	tx: Tx,
	entrada: {
		importe: number;
		origenTipo: 'arqueo' | 'linea_recuento' | 'baja';
		origenId: string;
		tipo: 'reparto_arqueo' | 'reparto_recuento' | 'reparto_incobrable';
		instante: string;
		azar: Ambiente['azar'];
	},
): void {
	const miembros = personasActivas(tx).map((persona) => persona.id);
	if (miembros.length === 0) return;
	const partes: Parte[] = repartir(entrada.importe, miembros, entrada.azar);
	const repartoId = nuevoId();
	tx.insert(reparto)
		.values({
			id: repartoId,
			origenTipo: entrada.origenTipo,
			origenId: entrada.origenId,
			importe: entrada.importe,
			miembros: miembros.length,
			creadoEn: entrada.instante,
		})
		.run();
	anotarMovimientos(
		tx,
		partes
			.filter((parte) => parte.importe !== 0)
			.map((parte) => ({
				cuenta: 'persona' as const,
				usuarioId: parte.usuarioId,
				tipo: entrada.tipo,
				importe: parte.importe,
				origenTipo: 'reparto' as const,
				origenId: repartoId,
				creadoEn: entrada.instante,
			})),
	);
	registrar('reparto.aplicado', { origenTipo: entrada.origenTipo, miembros: miembros.length });
}

function anularRepartos(tx: Tx, origenTipo: 'arqueo' | 'linea_recuento', origenId: string, instante: string): void {
	const repartos = tx
		.select({ id: reparto.id })
		.from(reparto)
		.where(and(eq(reparto.origenTipo, origenTipo), eq(reparto.origenId, origenId)))
		.all();
	for (const { id } of repartos) anularMovimientosDe(tx, 'reparto', id, instante);
}

function esUltimoArqueo(tx: Tx, realizadoEn: string): boolean {
	const posterior = tx
		.select({ id: arqueo.id })
		.from(arqueo)
		.where(and(eq(arqueo.estado, 'vigente'), gt(arqueo.realizadoEn, realizadoEn)))
		.get();
	return posterior === undefined;
}

function esUltimaLineaDelTipo(tx: Tx, tipoCapsulaId: string, recuentoId: string): boolean {
	const instante =
		tx.select({ realizadoEn: recuento.realizadoEn }).from(recuento).where(eq(recuento.id, recuentoId)).get()?.realizadoEn ?? '';
	const posterior = tx
		.select({ id: lineaRecuento.id })
		.from(lineaRecuento)
		.innerJoin(recuento, eq(lineaRecuento.recuentoId, recuento.id))
		.where(and(eq(lineaRecuento.tipoCapsulaId, tipoCapsulaId), eq(lineaRecuento.estado, 'vigente'), gt(recuento.realizadoEn, instante)))
		.get();
	return posterior === undefined;
}
