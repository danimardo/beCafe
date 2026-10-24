import { resolve } from '$app/paths';
import { leerHistorial as leerHistorialEconomia, type FiltrosHistorial } from '#lib/server/economia';
import type { FilaGeneral, TipoFilaHistorial } from '#lib/server/estadisticas';
import type { Ejecutor } from '#lib/server/plataforma';
import type { Actor } from '#lib/server/auth';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { textos } from '#lib/shared/textos';

// Vista de las filas del historial, compartida por `/historial` y el resumen de `/saldos`. Sin reglas de negocio.

/** Un registro del historial listo para pintar. Un relleno no tiene importe: `sinImporte` lo indica (RF-175). */
export type VistaFila = {
	id: string;
	tipo: TipoFilaHistorial;
	etiqueta: string;
	fecha: string;
	persona: string;
	autor: string;
	importe: number;
	sinImporte: boolean;
	anulado: boolean;
	anuladoEn: string | null;
	motivo: string | null;
	enlace: ReturnType<typeof enlaceDe>;
};

// Enlace de detalle de cada tipo de registro. Reparto y regularización no tienen pantalla propia.
export function enlaceDe(tipo: TipoFilaHistorial, id: string) {
	switch (tipo) {
		case 'relleno':
			return resolve('/(app)/rellenos/[rellenoId=ulid]', { rellenoId: id });
		case 'aportacion':
			return resolve('/(app)/saldos/aportaciones/[aportacionId=ulid]', { aportacionId: id });
		case 'compra':
			return resolve('/(app)/compras/[compraId=ulid]', { compraId: id });
		case 'consumo':
			return resolve('/(app)/consumos/[consumoId=ulid]', { consumoId: id });
		case 'arqueo':
		case 'recuento':
			return resolve('/(app)/historial/control/[id=ulid]', { id });
		case 'reparto':
		case 'regularizacion':
			return undefined;
	}
}

export function vistaDeFilas(db: Ejecutor, filas: FilaGeneral[]): VistaFila[] {
	return filas.map((fila) => ({
		id: fila.id,
		tipo: fila.tipo,
		etiqueta: textos.historial.etiquetas[fila.tipo],
		fecha: fila.fecha,
		persona: fila.personaId ? (buscarUsuarioPorId(db, fila.personaId)?.nombre ?? '') : '',
		autor: fila.autorNombre ?? '',
		importe: fila.importe,
		sinImporte: fila.tipo === 'relleno',
		anulado: fila.anulado,
		anuladoEn: fila.anuladoEn,
		motivo: fila.motivo,
		enlace: enlaceDe(fila.tipo, fila.id),
	}));
}

/** Los registros más recientes con «Todo» (Clarifications 4 de F5). */
export function ultimosRegistros(db: Ejecutor, actor: Actor, cantidad: number): VistaFila[] {
	const filtros: FiltrosHistorial = { quien: 'todo', tipo: 'todos', anulados: false, pagina: 1 };
	return vistaDeFilas(db, leerHistorialEconomia(db, actor, filtros).filas.slice(0, cantidad));
}
