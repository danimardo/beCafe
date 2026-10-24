import {
	leerHistorial as leerHistorialEconomia,
	TAMANO_PAGINA,
	type FilaHistorial,
	type FiltrosHistorial,
	type TipoEntradaHistorial,
} from '#lib/server/economia';
import { contarRellenosHistorial, leerRellenos } from '#lib/server/rellenos';
import type { Ejecutor } from '#lib/server/plataforma';
import type { Actor } from '#lib/server/auth';

// Historial mezclado (plan F8 D6, RF-175). `economia` no conoce los rellenos: esta composición pide a cada módulo su lista
// y las une por fecha. Un relleno no tiene importe: la vista lo marca como «No mueve dinero».

export type TipoFilaHistorial = TipoEntradaHistorial | 'relleno';

export type FilaGeneral = Omit<FilaHistorial, 'tipo'> & { tipo: TipoFilaHistorial };

export type FiltrosGenerales = Omit<FiltrosHistorial, 'tipo'> & { tipo: FiltrosHistorial['tipo'] | 'rellenos' };

export type PaginaGeneral = { filas: FilaGeneral[]; total: number; pagina: number };

function filaDeRelleno(relleno: ReturnType<typeof leerRellenos>[number]): FilaGeneral {
	return {
		tipo: 'relleno',
		id: relleno.id,
		fecha: relleno.registradoEn,
		autorId: relleno.usuarioId,
		autorNombre: relleno.nombre,
		personaId: relleno.usuarioId,
		importe: 0,
		anulado: relleno.estado === 'anulado',
		anuladoEn: relleno.anuladoEn,
		motivo: relleno.motivo,
	};
}

function filaEconomia(fila: FilaHistorial): FilaGeneral {
	return fila;
}

/**
 * Página del historial. Con «Todos» se mezclan los registros económicos y los rellenos; con `tipo` económico, solo
 * `economia` (igual que F5); con `tipo = rellenos`, solo rellenos.
 */
export function leerHistorial(db: Ejecutor, actor: Actor, filtros: FiltrosGenerales): PaginaGeneral {
	const usuarioId = filtros.quien === 'mios' ? actor.usuarioId : undefined;
	const limite = filtros.pagina * TAMANO_PAGINA;
	const desde = (filtros.pagina - 1) * TAMANO_PAGINA;

	if (filtros.tipo === 'rellenos') {
		const filas = leerRellenos(db, { usuarioId, incluirAnulados: filtros.anulados, limite }).map(filaDeRelleno);
		return {
			filas: filas.slice(desde, limite),
			total: contarRellenosHistorial(db, { usuarioId, incluirAnulados: filtros.anulados }),
			pagina: filtros.pagina,
		};
	}

	if (filtros.tipo !== 'todos') {
		const pagina = leerHistorialEconomia(db, actor, { ...filtros, tipo: filtros.tipo });
		return { filas: pagina.filas.map(filaEconomia), total: pagina.total, pagina: pagina.pagina };
	}

	// «Todos»: cada módulo aporta sus primeros `pagina × 20` registros; se ordenan y se corta la página.
	const economia: FilaHistorial[] = [];
	let totalEconomia = 0;
	for (let numero = 1; numero <= filtros.pagina; numero++) {
		const pagina = leerHistorialEconomia(db, actor, { ...filtros, tipo: 'todos', pagina: numero });
		economia.push(...pagina.filas);
		totalEconomia = pagina.total;
	}
	const rellenos = leerRellenos(db, { usuarioId, incluirAnulados: filtros.anulados, limite }).map(filaDeRelleno);
	const mezcladas = [...economia.map(filaEconomia), ...rellenos].sort(
		(a, b) => Date.parse(b.fecha) - Date.parse(a.fecha) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0),
	);
	const total = totalEconomia + contarRellenosHistorial(db, { usuarioId, incluirAnulados: filtros.anulados });
	return { filas: mezcladas.slice(desde, limite), total, pagina: filtros.pagina };
}
