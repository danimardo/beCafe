import { eq } from 'drizzle-orm';
import { entradaStockBajo, existencia } from './esquema';
import { estaEnStockBajo } from './dominio/stock';
import { nuevoId, RecursoNoEncontrado, type Ejecutor, type Tx } from '#lib/server/plataforma';

// Escrituras de stock y umbral (RF-003, RF-023, RN-072). Siempre dentro de la transacción del caso de uso.
// Devuelve si se registró una entrada en stock bajo, para que el caso de uso lo registre tras confirmar.
// Un tipo recién dado de alta no registra entrada aunque su stock 0 quede en stock bajo: no es una bajada (decisión del 22-10-2026).

export type ResultadoExistencia = { entradaRegistrada: boolean };

export function crearExistencia(tx: Tx, datos: { tipoCapsulaId: string; umbralMinimo: number }): void {
	tx.insert(existencia)
		.values({
			tipoCapsulaId: datos.tipoCapsulaId,
			umbralMinimo: datos.umbralMinimo,
			stock: 0,
			costeMedio: null,
			enStockBajo: estaEnStockBajo(0, datos.umbralMinimo),
		})
		.run();
}

/**
 * Fija el stock de un tipo y recalcula `en_stock_bajo` (INV-02). Una entrada solo se registra en la transición de
 * «no» a «sí» (RN-072). F3 y F4 lo usan para cada consumo, compra, anulación o recuento.
 */
export function fijarStock(tx: Tx, tipoCapsulaId: string, stock: number, instante: string): ResultadoExistencia {
	const fila = leerExistenciaTx(tx, tipoCapsulaId);
	const enStockBajo = estaEnStockBajo(stock, fila.umbralMinimo);
	tx.update(existencia).set({ stock, enStockBajo }).where(eq(existencia.tipoCapsulaId, tipoCapsulaId)).run();
	const entradaRegistrada = enStockBajo && !fila.enStockBajo;
	if (entradaRegistrada) registrarEntrada(tx, tipoCapsulaId, instante);
	return { entradaRegistrada };
}

/** Cambia el umbral sin tocar el stock. Un umbral nuevo puede generar una entrada (Edge cases de la spec). */
export function fijarUmbral(tx: Tx, tipoCapsulaId: string, umbralMinimo: number, instante: string): ResultadoExistencia {
	const fila = leerExistenciaTx(tx, tipoCapsulaId);
	const enStockBajo = estaEnStockBajo(fila.stock, umbralMinimo);
	tx.update(existencia).set({ umbralMinimo, enStockBajo }).where(eq(existencia.tipoCapsulaId, tipoCapsulaId)).run();
	const entradaRegistrada = enStockBajo && !fila.enStockBajo;
	if (entradaRegistrada) registrarEntrada(tx, tipoCapsulaId, instante);
	return { entradaRegistrada };
}

export function borrarExistencia(tx: Tx, tipoCapsulaId: string): void {
	tx.delete(existencia).where(eq(existencia.tipoCapsulaId, tipoCapsulaId)).run();
}

function registrarEntrada(tx: Tx, tipoCapsulaId: string, instante: string): void {
	tx.insert(entradaStockBajo).values({ id: nuevoId(), tipoCapsulaId, registradaEn: instante }).run();
}

export function leerExistenciaTx(tx: Ejecutor, tipoCapsulaId: string) {
	const fila = tx.select().from(existencia).where(eq(existencia.tipoCapsulaId, tipoCapsulaId)).get();
	if (!fila) throw new RecursoNoEncontrado();
	return fila;
}
