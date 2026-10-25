import { and, count, desc, eq, gte, lt, ne } from 'drizzle-orm';
import { exigirAdministrador, type Actor, type VisitaResuelta } from '#lib/server/auth';
import { leerTipo, listarTipos } from '#lib/server/catalogo';
import { registrarAviso } from '#lib/server/notificaciones';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
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
import { cafeVisitante, existencia } from './esquema';
import { fijarStock, leerExistenciaTx } from './existencias';

// Cafés de visitante (plan F10 D2; RF-191, RF-193, RN-086). Un café queda pendiente hasta que un administrador lo
// revisa. Aprobarlo resta una cápsula del stock y la hucha asume su coste: ningún estado escribe movimientos ni cambia
// el coste medio. Cada cambio de estado y su efecto en el stock van en la misma transacción (constitución IV).

const TAMANO_PAGINA = 50;

export type EstadoCafeVisitante = 'pendiente' | 'aprobado' | 'rechazado' | 'anulado';
export type DecisionCafeVisitante = 'aprobar' | 'rechazar';

export type FilaCafeVisitante = {
	id: string;
	visitaId: string;
	tipoCapsulaId: string;
	horaGesto: string;
	estado: EstadoCafeVisitante;
	revisadoEn: string | null;
	motivoAnulacion: string | null;
};

export type ResultadoRevision = { aprobados: number; rechazados: number; yaRevisados: number };

/**
 * Registra un café de visitante como pendiente (RF-191) y avisa a los administradores (RF-192). Un `clienteId` ya
 * recibido devuelve el original. Superar el límite de frecuencia de la visita (research R11) lo rechaza.
 */
export function registrarCafeVisitante(
	ambiente: Ambiente,
	visita: VisitaResuelta,
	datos: { clienteId: string; tipoCapsulaId: string; horaGesto: string },
): { id: string; duplicado: boolean } {
	const ahora = ambiente.reloj.ahora();
	return enTransaccion(ambiente.db, (tx) => {
		const existente = tx.select({ id: cafeVisitante.id }).from(cafeVisitante).where(eq(cafeVisitante.clienteId, datos.clienteId)).get();
		if (existente) {
			registrar('registro.duplicado', { tipo: 'cafe_visitante', id: existente.id });
			return { id: existente.id, duplicado: true };
		}
		const tipo = leerTipo(tx, datos.tipoCapsulaId);
		if (!tipo || tipo.estado !== 'activo') throw new ErrorDeNegocio('TIPO_NO_DISPONIBLE');
		if (leerExistenciaTx(tx, datos.tipoCapsulaId).costeMedio === null) throw new ErrorDeNegocio('TIPO_SIN_COSTE');
		if (!ambiente.limitadorVisitantes.admite(visita.id, ahora)) {
			registrar('visitante.limite_superado', { visitaId: visita.id });
			throw new ErrorDeNegocio('LIMITE_SUPERADO');
		}

		const id = nuevoId();
		tx.insert(cafeVisitante)
			.values({
				id,
				clienteId: datos.clienteId,
				visitaId: visita.id,
				tipoCapsulaId: datos.tipoCapsulaId,
				horaGesto: Date.parse(datos.horaGesto) > Date.parse(ahora) ? ahora : datos.horaGesto,
				horaRegistro: ahora,
				estado: 'pendiente',
			})
			.run();
		registrarAviso(tx, {
			tipo: 'cafe_visitante_pendiente',
			datos: { cafeId: id, pendientes: contarPendientes(tx) },
			origenId: id,
			instante: esquemaInstanteUtc.parse(ahora),
		});
		registrar('cafe_visitante.registrado', { cafeId: id, visitaId: visita.id });
		return { id, duplicado: false };
	});
}

/**
 * Aprueba o rechaza cafés pendientes (RF-193). Solo un administrador. Un café que ya no está pendiente se cuenta en
 * `yaRevisados` y no tiene efecto: la condición sobre el estado decide un único ganador (research R3, EV-104).
 */
export function revisarCafesVisitante(
	ambiente: Ambiente,
	actor: Actor,
	entrada: { ids: readonly string[]; decision: DecisionCafeVisitante },
): ResultadoRevision {
	exigirAdministrador(actor, 'visitantes.revisar');
	const ahora = ambiente.reloj.ahora();
	const resultado = enTransaccion(ambiente.db, (tx) => {
		const cuenta: ResultadoRevision = { aprobados: 0, rechazados: 0, yaRevisados: 0 };
		for (const id of new Set(entrada.ids)) {
			if (revisarUno(tx, actor, id, entrada.decision, ahora)) {
				if (entrada.decision === 'aprobar') cuenta.aprobados += 1;
				else cuenta.rechazados += 1;
			} else {
				cuenta.yaRevisados += 1;
			}
		}
		return cuenta;
	});
	registrar('cafe_visitante.revisado', {
		decision: entrada.decision,
		cantidad: resultado.aprobados + resultado.rechazados,
		yaRevisados: resultado.yaRevisados,
	});
	return resultado;
}

function revisarUno(tx: Tx, actor: Actor, id: string, decision: DecisionCafeVisitante, ahora: string): boolean {
	const fila = tx.select({ tipoCapsulaId: cafeVisitante.tipoCapsulaId }).from(cafeVisitante).where(eq(cafeVisitante.id, id)).get();
	if (!fila) return false;
	const existencia = leerExistenciaTx(tx, fila.tipoCapsulaId);
	const cambio = tx
		.update(cafeVisitante)
		.set({
			estado: decision === 'aprobar' ? 'aprobado' : 'rechazado',
			revisadoPor: actor.usuarioId,
			revisadoEn: ahora,
			costeMedioAplicado: decision === 'aprobar' ? existencia.costeMedio : null,
		})
		.where(and(eq(cafeVisitante.id, id), eq(cafeVisitante.estado, 'pendiente')))
		.run();
	if (cambio.changes !== 1) return false;
	if (decision === 'aprobar') fijarStock(tx, fila.tipoCapsulaId, existencia.stock - 1, ahora);
	return true;
}

/** Anula un café aprobado (RF-193): vuelve a sumar la cápsula al stock. Solo un administrador y con motivo. */
export function anularCafeVisitante(ambiente: Ambiente, actor: Actor, id: string, motivo: string): void {
	exigirAdministrador(actor, 'visitantes.anular');
	const ahora = ambiente.reloj.ahora();
	enTransaccion(ambiente.db, (tx) => {
		const fila = tx
			.select({ tipoCapsulaId: cafeVisitante.tipoCapsulaId, estado: cafeVisitante.estado })
			.from(cafeVisitante)
			.where(eq(cafeVisitante.id, id))
			.get();
		if (!fila) throw new RecursoNoEncontrado();
		if (fila.estado === 'anulado') throw new ErrorDeNegocio('YA_ANULADO');
		const cambio = tx
			.update(cafeVisitante)
			.set({ estado: 'anulado', anuladoPor: actor.usuarioId, anuladoEn: ahora, motivoAnulacion: motivo })
			.where(and(eq(cafeVisitante.id, id), eq(cafeVisitante.estado, 'aprobado')))
			.run();
		if (cambio.changes !== 1) throw new ErrorDeNegocio('NO_ANULABLE');
		fijarStock(tx, fila.tipoCapsulaId, leerExistenciaTx(tx, fila.tipoCapsulaId).stock + 1, ahora);
	});
	registrar('cafe_visitante.anulado', { cafeId: id });
}

/** Cafés de visitante para la pantalla de revisión: los pendientes, o los ya revisados del más reciente al más antiguo. */
export function leerCafesVisitante(
	db: Ejecutor,
	actor: Actor,
	filtro: { vista: 'pendientes' | 'revisados'; pagina: number },
): { filas: FilaCafeVisitante[]; total: number; tamanoPagina: number } {
	exigirAdministrador(actor, 'visitantes.leer');
	const condicion = filtro.vista === 'pendientes' ? eq(cafeVisitante.estado, 'pendiente') : ne(cafeVisitante.estado, 'pendiente');
	const filas = db
		.select({
			id: cafeVisitante.id,
			visitaId: cafeVisitante.visitaId,
			tipoCapsulaId: cafeVisitante.tipoCapsulaId,
			horaGesto: cafeVisitante.horaGesto,
			estado: cafeVisitante.estado,
			revisadoEn: cafeVisitante.revisadoEn,
			motivoAnulacion: cafeVisitante.motivoAnulacion,
		})
		.from(cafeVisitante)
		.where(condicion)
		.orderBy(filtro.vista === 'pendientes' ? cafeVisitante.horaRegistro : desc(cafeVisitante.revisadoEn))
		.limit(TAMANO_PAGINA)
		.offset((Math.max(1, filtro.pagina) - 1) * TAMANO_PAGINA)
		.all();
	const total = db.select({ total: count() }).from(cafeVisitante).where(condicion).get()?.total ?? 0;
	return { filas, total, tamanoPagina: TAMANO_PAGINA };
}

/** Cafés de una visita, para que el visitante vea su estado (RF-191). */
export function leerCafesDeVisita(db: Ejecutor, visitaId: string): FilaCafeVisitante[] {
	return db
		.select({
			id: cafeVisitante.id,
			visitaId: cafeVisitante.visitaId,
			tipoCapsulaId: cafeVisitante.tipoCapsulaId,
			horaGesto: cafeVisitante.horaGesto,
			estado: cafeVisitante.estado,
			revisadoEn: cafeVisitante.revisadoEn,
			motivoAnulacion: cafeVisitante.motivoAnulacion,
		})
		.from(cafeVisitante)
		.where(eq(cafeVisitante.visitaId, visitaId))
		.orderBy(desc(cafeVisitante.horaRegistro))
		.all();
}

/** Cafés de visitante aprobados cuya hora del toque cae en `[desde, hasta)`, para las estadísticas (RF-201). */
export function contarCafesVisitante(
	db: Ejecutor,
	filtro: { desde: string; hasta: string },
): { tipoCapsulaId: string; horaGesto: string }[] {
	return db
		.select({ tipoCapsulaId: cafeVisitante.tipoCapsulaId, horaGesto: cafeVisitante.horaGesto })
		.from(cafeVisitante)
		.where(and(eq(cafeVisitante.estado, 'aprobado'), gte(cafeVisitante.horaGesto, filtro.desde), lt(cafeVisitante.horaGesto, filtro.hasta)))
		.all();
}

/** Tipos que un visitante puede tomar: activos y con coste medio (RN-006). Sin precio ni stock (RF-194). */
export function leerTiposParaVisitante(
	db: Ejecutor,
	visita: VisitaResuelta | undefined,
): { id: string; nombre: string; marca: string; intensidad: number | null; color: string }[] {
	if (!visita) throw new ErrorDeNegocio('SIN_SESION');
	const conCoste = new Set(
		db
			.select({ id: existencia.tipoCapsulaId, costeMedio: existencia.costeMedio })
			.from(existencia)
			.all()
			.filter((fila) => fila.costeMedio !== null)
			.map((fila) => fila.id),
	);
	return listarTipos(db)
		.filter((tipo) => tipo.estado === 'activo' && conCoste.has(tipo.id))
		.map((tipo) => ({ id: tipo.id, nombre: tipo.nombre, marca: tipo.marca, intensidad: tipo.intensidad, color: tipo.color }));
}

/** Número de cafés pendientes (contador de la pantalla de administración y del aviso). */
export function contarCafesVisitantePendientes(db: Ejecutor): number {
	return contarPendientes(db);
}

function contarPendientes(db: Ejecutor): number {
	return db.select({ total: count() }).from(cafeVisitante).where(eq(cafeVisitante.estado, 'pendiente')).get()?.total ?? 0;
}
