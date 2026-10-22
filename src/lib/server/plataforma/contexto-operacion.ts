import { AsyncLocalStorage } from 'node:async_hooks';
import { nuevoId } from './ids';

// Identificador de operación por petición o por ejecución (constitución XVI). Es un recurso de proceso.
const almacen = new AsyncLocalStorage<string>();

/** Ejecuta `operacion` con un identificador nuevo, o con el dado. */
export function conOperacion<T>(operacion: () => T, operacionId: string = nuevoId()): T {
	return almacen.run(operacionId, operacion);
}

export function operacionActual(): string | undefined {
	return almacen.getStore();
}
