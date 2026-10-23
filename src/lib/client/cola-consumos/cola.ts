import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import { esquemaElementoCola, type ElementoCola } from '#lib/shared/contratos/consumos';
import { registrarDatoInvalido } from '#lib/client/registro';

// Cola de consumos pendientes en IndexedDB (RF-015, RF-063; constitución V). Es lo único que el navegador guarda de
// los consumos: sin nombres ni importes. Cada lectura se valida con su esquema; un elemento que no lo supera se descarta.

const BASE = 'becafe';
const ALMACEN = 'consumos-pendientes';
const VERSION = 1;

interface EsquemaCola extends DBSchema {
	[ALMACEN]: { key: string; value: unknown };
}

let base: Promise<IDBPDatabase<EsquemaCola>> | undefined;

function abrir(): Promise<IDBPDatabase<EsquemaCola>> {
	base ??= openDB<EsquemaCola>(BASE, VERSION, {
		upgrade(bd) {
			bd.createObjectStore(ALMACEN, { keyPath: 'clienteId' });
		},
	});
	return base;
}

/** Guarda un consumo pendiente. Un `clienteId` repetido lo sustituye (el mismo toque no genera dos elementos). */
export async function anadirElemento(elemento: ElementoCola): Promise<void> {
	await (await abrir()).put(ALMACEN, elemento);
}

export async function borrarElemento(clienteId: string): Promise<void> {
	await (await abrir()).delete(ALMACEN, clienteId);
}

/** Marca un elemento como rechazado con su código (Banner negative, contracts/api-consumos.md). */
export async function marcarRechazado(clienteId: string, codigo: string): Promise<void> {
	const bd = await abrir();
	const actual = await bd.get(ALMACEN, clienteId);
	const valido = esquemaElementoCola.safeParse(actual);
	if (!valido.success) return;
	await bd.put(ALMACEN, { ...valido.data, estado: 'rechazado', codigo });
}

/**
 * Elementos de la persona con sesión, en orden de hora del toque (Clarifications 10: los de otra persona no se muestran
 * ni se envían). Un elemento inválido se descarta y se registra solo el campo, nunca su valor (constitución XVI).
 */
export async function listarElementos(usuarioId: string): Promise<ElementoCola[]> {
	const bd = await abrir();
	const filas = await bd.getAll(ALMACEN);
	const elementos: ElementoCola[] = [];
	for (const fila of filas) {
		const valido = esquemaElementoCola.safeParse(fila);
		if (!valido.success) {
			registrarDatoInvalido('cola-consumos', 'elemento');
			const clienteId = clienteIdDe(fila);
			if (clienteId) await bd.delete(ALMACEN, clienteId);
			continue;
		}
		if (valido.data.usuarioId === usuarioId) elementos.push(valido.data);
	}
	return elementos.sort((a, b) => a.horaGesto.localeCompare(b.horaGesto));
}

/** Quita los rechazados de una persona una vez los ha visto (botón «Entendido»). */
export async function limpiarRechazados(usuarioId: string): Promise<void> {
	const bd = await abrir();
	const elementos = await listarElementos(usuarioId);
	for (const elemento of elementos) {
		if (elemento.estado === 'rechazado') await bd.delete(ALMACEN, elemento.clienteId);
	}
}

function clienteIdDe(fila: unknown): string | undefined {
	if (typeof fila !== 'object' || fila === null || !('clienteId' in fila)) return undefined;
	return typeof fila.clienteId === 'string' ? fila.clienteId : undefined;
}
