import { and, eq } from 'drizzle-orm';
import type { Ejecutor } from '#lib/server/plataforma';
import { compra, consumo, lineaCompra, lineaRecuento, recuento } from './esquema';
import { aplicarHecho, ESTADO_INICIAL, type EstadoTipo, type HechoTipo } from './dominio/coste-medio';

// Historia de un tipo de cápsula a partir de los registros vigentes (RN-012, INV-02). Interno de `economia`.
// Las compras y los recuentos anulados no entran: la reconstrucción los excluye desde el principio.

export type EventoHistoria = { id: string; instante: string; hecho: HechoTipo };

/** Todos los hechos vigentes de un tipo, en orden de instante (y de ULID cuando hay empate). */
export function leerHistoria(db: Ejecutor, tipoCapsulaId: string): EventoHistoria[] {
	const compras = db
		.select({ id: compra.id, instante: compra.registradaEn, cantidad: lineaCompra.cantidad, importe: lineaCompra.importe })
		.from(lineaCompra)
		.innerJoin(compra, eq(lineaCompra.compraId, compra.id))
		.where(and(eq(lineaCompra.tipoCapsulaId, tipoCapsulaId), eq(compra.estado, 'vigente')))
		.all()
		.map((fila) => ({
			id: fila.id,
			instante: fila.instante,
			hecho: { tipo: 'compra' as const, instante: fila.instante, cantidad: fila.cantidad, importeCentimos: fila.importe },
		}));

	const consumos = db
		.select({ id: consumo.id, instante: consumo.horaRegistro })
		.from(consumo)
		.where(and(eq(consumo.tipoCapsulaId, tipoCapsulaId), eq(consumo.estado, 'vigente')))
		.all()
		.map((fila) => ({
			id: fila.id,
			instante: fila.instante,
			hecho: { tipo: 'consumo' as const, instante: fila.instante, consumoId: fila.id },
		}));

	const recuentos = db
		.select({ id: lineaRecuento.id, instante: recuento.realizadoEn, diferencia: lineaRecuento.diferencia })
		.from(lineaRecuento)
		.innerJoin(recuento, eq(lineaRecuento.recuentoId, recuento.id))
		.where(and(eq(lineaRecuento.tipoCapsulaId, tipoCapsulaId), eq(lineaRecuento.estado, 'vigente')))
		.all()
		.map((fila) => ({
			id: fila.id,
			instante: fila.instante,
			hecho: { tipo: 'recuento' as const, instante: fila.instante, diferencia: fila.diferencia },
		}));

	return [...compras, ...consumos, ...recuentos].sort((a, b) =>
		a.instante === b.instante ? a.id.localeCompare(b.id) : a.instante.localeCompare(b.instante),
	);
}

/** Estado tras cada evento: `estados[i]` es el estado después de aplicar `historia[i]`. */
export function estadosTrasCada(historia: readonly EventoHistoria[]): EstadoTipo[] {
	const estados: EstadoTipo[] = [];
	let actual = ESTADO_INICIAL;
	for (const evento of historia) {
		actual = aplicarHecho(actual, evento.hecho);
		estados.push(actual);
	}
	return estados;
}
