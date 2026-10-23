import { exigirSesion, type Actor } from '#lib/server/auth';
import { contarConsumos, primerConsumo } from '#lib/server/economia';
import { ErrorDeNegocio, type Ejecutor } from '#lib/server/plataforma';
import { esquemaInstanteUtc, esquemaMes, type InstanteUtc, type Mes } from '#lib/shared/fechas/tipos';
import { mesDeInstante, mesesEntre } from '#lib/shared/fechas/meses';
import { limitesDePeriodo, mesesDelPeriodo, type Periodo } from './dominio/periodos';

// Estadísticas de consumo (plan F5 D3, D4; RF-120 a RF-123). Solo lee. Los consumos anulados no cuentan (RN-035).

export type ConsultaPeriodo = { periodo: 'mes' | 'anio' | 'todo'; mes?: Mes; anio?: number };

export type EstadisticasDeConsumo = {
	cafes: number;
	invitados: number;
	gastado: number;
	porMes: { mes: Mes; cafes: number; invitados: number }[];
	porTipo: { tipoCapsulaId: string; cafes: number }[];
};

const VACIO: EstadisticasDeConsumo = { cafes: 0, invitados: 0, gastado: 0, porMes: [], porTipo: [] };

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
	if (limites === null) return VACIO;

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
