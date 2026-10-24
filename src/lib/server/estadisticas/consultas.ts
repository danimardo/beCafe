import { exigirSesion, type Actor } from '#lib/server/auth';
import { contarConsumos, primerConsumo } from '#lib/server/economia';
import { ErrorDeNegocio, type Ejecutor } from '#lib/server/plataforma';
import { esquemaInstanteUtc, esquemaMes, type InstanteUtc, type Mes } from '#lib/shared/fechas/tipos';
import { mesDeInstante, mesesEntre } from '#lib/shared/fechas/meses';
import { contarRellenos } from '#lib/server/rellenos';
import { listarUsuarios } from '#lib/server/usuarios';
import { limitesDePeriodo, mesesDelPeriodo, type Periodo } from './dominio/periodos';

// Estadísticas de consumo (plan F5 D3, D4; RF-120 a RF-123). Solo lee. Los consumos anulados no cuentan (RN-035).

export type ConsultaPeriodo = { periodo: 'mes' | 'anio' | 'todo'; mes?: Mes; anio?: number };

/** Una persona en el ranking de rellenos (RF-175). `baja` la marca sin quitarla del ranking (RN-085). */
export type RankingRelleno = { usuarioId: string; nombre: string; rellenos: number; baja: boolean };

export type EstadisticasDeConsumo = {
	cafes: number;
	invitados: number;
	gastado: number;
	porMes: { mes: Mes; cafes: number; invitados: number }[];
	porTipo: { tipoCapsulaId: string; cafes: number }[];
	/** Rellenos de agua vigentes del periodo (de la persona, o del equipo en la vista de equipo). */
	rellenos: number;
	/** Ranking de rellenos del equipo, del que más registró al que menos. Vacío en la vista personal. */
	ranking: RankingRelleno[];
};

const VACIO: EstadisticasDeConsumo = { cafes: 0, invitados: 0, gastado: 0, porMes: [], porTipo: [], rellenos: 0, ranking: [] };

/** Inicio de la historia del departamento: el periodo «desde el principio» cuenta los rellenos desde aquí si no hay consumos. */
const INICIO_HISTORIA = esquemaInstanteUtc.parse('1970-01-01T00:00:00.000Z');
/** Fin abierto de «todo»: el límite de `contarRellenos` es exclusivo y un relleno del mismo instante no debe quedar fuera. */
const FIN_HISTORIA = esquemaInstanteUtc.parse('9999-12-31T23:59:59.999Z');

/** Ranking de rellenos del equipo. Con `usuarioId` (vista personal), no hay ranking. Sin rellenos, la lista está vacía. */
function rankingDe(db: Ejecutor, rellenos: { usuarioId: string }[], usuarioId?: string): RankingRelleno[] {
	if (usuarioId) return [];
	const conteos = new Map<string, number>();
	for (const relleno of rellenos) conteos.set(relleno.usuarioId, (conteos.get(relleno.usuarioId) ?? 0) + 1);
	const personas = new Map(listarUsuarios(db).map((persona) => [persona.id, persona]));
	return [...conteos]
		.map(([id, total]): RankingRelleno => {
			const persona = personas.get(id);
			return { usuarioId: id, nombre: persona?.nombre ?? '', rellenos: total, baja: persona?.estado !== 'activo' };
		})
		.sort((a, b) => b.rellenos - a.rellenos || a.nombre.localeCompare(b.nombre, 'es'));
}

/** Periodo pedido. Sin mes ni año, el periodo es el mes en curso (plan F5 D3). */
export function resolverPeriodo(consulta: ConsultaPeriodo, ahora: InstanteUtc): Periodo {
	const mesActual = mesDeInstante(ahora);
	if (consulta.periodo === 'todo') return { tipo: 'todo' };
	if (consulta.periodo === 'anio') return { tipo: 'anio', anio: consulta.anio ?? Number(mesActual.slice(0, 4)) };
	return { tipo: 'mes', mes: consulta.mes ?? mesActual };
}

function mesesDeAnio(anio: number): Mes[] {
	return mesesEntre(esquemaMes.parse(`${anio}-01`), esquemaMes.parse(`${anio}-12`));
}

/**
 * Agrega los consumos vigentes del periodo. «Mis» cafés excluyen a los invitados; estos van aparte y suman en el gasto.
 * El mes es el de la hora del toque en Madrid (D10-3). Cada mes del periodo aparece, aunque valga 0.
 */
function agregar(db: Ejecutor, periodo: Periodo, ahora: InstanteUtc, usuarioId?: string): EstadisticasDeConsumo {
	const mesActual = mesDeInstante(ahora);
	const primero = primerConsumo(db, usuarioId);
	const primerMes = primero === null ? null : mesDeInstante(esquemaInstanteUtc.parse(primero));
	const limites = limitesDePeriodo(periodo, primerMes, mesActual);
	// Los rellenos cuentan aunque no haya consumos: sin consumos, «desde el principio» abarca toda la historia.
	const rango = limites ?? (periodo.tipo === 'todo' ? { desde: INICIO_HISTORIA, hasta: FIN_HISTORIA } : null);
	const rellenos = rango ? contarRellenos(db, { ...rango, usuarioId }) : [];
	if (limites === null) return { ...VACIO, rellenos: rellenos.length, ranking: rankingDe(db, rellenos, usuarioId) };

	const consumos = contarConsumos(db, { desde: limites.desde, hasta: limites.hasta, usuarioId });
	const meses =
		periodo.tipo === 'mes' ? [periodo.mes] : periodo.tipo === 'anio' ? mesesDeAnio(periodo.anio) : mesesDelPeriodo(primerMes, mesActual);

	const cafesPorMes = new Map<Mes, number>();
	const invitadosPorMes = new Map<Mes, number>();
	const cafesPorTipo = new Map<string, number>();
	let cafes = 0;
	let invitados = 0;
	let gastado = 0;
	for (const consumo of consumos) {
		gastado += consumo.precioAplicado;
		const mes = mesDeInstante(esquemaInstanteUtc.parse(consumo.horaGesto));
		if (consumo.invitado) {
			invitados += 1;
			invitadosPorMes.set(mes, (invitadosPorMes.get(mes) ?? 0) + 1);
		} else {
			cafes += 1;
			cafesPorMes.set(mes, (cafesPorMes.get(mes) ?? 0) + 1);
			cafesPorTipo.set(consumo.tipoCapsulaId, (cafesPorTipo.get(consumo.tipoCapsulaId) ?? 0) + 1);
		}
	}
	return {
		cafes,
		invitados,
		gastado,
		porMes: meses.map((mes) => ({ mes, cafes: cafesPorMes.get(mes) ?? 0, invitados: invitadosPorMes.get(mes) ?? 0 })),
		porTipo: [...cafesPorTipo].map(([tipoCapsulaId, total]) => ({ tipoCapsulaId, cafes: total })),
		rellenos: rellenos.length,
		ranking: rankingDe(db, rellenos, usuarioId),
	};
}

/**
 * Estadísticas de una persona (RF-121). Las ve esa persona o un administrador; a un miembro que pide otra persona
 * se le niega con `SIN_PERMISO` y sin datos (RN-060, RN-061, CA-122). El permiso se comprueba en cada consulta.
 */
export function leerPersonales(db: Ejecutor, actor: Actor | undefined, usuarioId: string, consulta: ConsultaPeriodo, ahora: InstanteUtc) {
	const autor = exigirSesion(actor);
	if (autor.usuarioId !== usuarioId && autor.rol !== 'administrador') throw new ErrorDeNegocio('SIN_PERMISO');
	return agregar(db, resolverPeriodo(consulta, ahora), ahora, usuarioId);
}

/** Estadísticas del equipo (RF-120). Incluye a las personas dadas de baja (RN-046). */
export function leerEquipo(db: Ejecutor, actor: Actor | undefined, consulta: ConsultaPeriodo, ahora: InstanteUtc): EstadisticasDeConsumo {
	exigirSesion(actor);
	return agregar(db, resolverPeriodo(consulta, ahora), ahora);
}
