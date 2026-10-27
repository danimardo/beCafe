import { eq } from 'drizzle-orm';
import { tipoCapsula } from './esquema';
import { ErrorDeNegocio, RecursoNoEncontrado, type Ejecutor, type Tx } from '#lib/server/plataforma';
import { COLOR_CAPSULA_HEREDADO } from '#lib/shared/contratos/capsulas';

// Datos descriptivos de los tipos de cápsula (RF-001, RF-003, RF-004, RF-006). Las funciones con `tx` las llama
// `economia`, que orquesta las escrituras (plan D2). Ninguna comprueba permisos: lo hace el caso de uso que llama.

export type FilaTipoCapsula = typeof tipoCapsula.$inferSelect;
export type EstadoTipo = FilaTipoCapsula['estado'];

export type DatosDescriptivos = {
	nombre: string;
	marca: string;
	intensidad: number | undefined;
	color: string;
	fotoRuta?: string | null;
};

/** Un índice único del nombre activo lanza este error en SQLite. Se traduce a `NOMBRE_DUPLICADO` (plan D7). */
export function esConflictoNombre(causa: unknown): boolean {
	return typeof causa === 'object' && causa !== null && 'code' in causa && causa.code === 'SQLITE_CONSTRAINT_UNIQUE';
}

function normalizar(nombre: string): string {
	return nombre.trim().toLowerCase();
}

export function insertarTipo(tx: Tx, fila: DatosDescriptivos & { id: string; instante: string }): void {
	// RF-269: el rosa solo lo conservan los tipos que ya lo tenían; un tipo nuevo no puede elegirlo.
	if (fila.color === COLOR_CAPSULA_HEREDADO) throw new ErrorDeNegocio('COLOR_NO_ELEGIBLE');
	try {
		tx.insert(tipoCapsula)
			.values({
				id: fila.id,
				nombre: fila.nombre,
				nombreNormalizado: normalizar(fila.nombre),
				marca: fila.marca,
				intensidad: fila.intensidad ?? null,
				color: fila.color,
				fotoRuta: fila.fotoRuta ?? null,
				estado: 'activo',
				creadoEn: fila.instante,
				actualizadoEn: fila.instante,
			})
			.run();
	} catch (causa) {
		if (esConflictoNombre(causa)) throw new ErrorDeNegocio('NOMBRE_DUPLICADO');
		throw causa;
	}
}

/** Actualiza los datos descriptivos. Si no llega foto nueva, la foto anterior se conserva. Devuelve la foto anterior. */
export function actualizarDescriptivos(tx: Tx, id: string, datos: DatosDescriptivos, instante: string): string | null {
	const anterior = leerFilaTx(tx, id);
	// RF-269: un tipo rosa lo conserva al guardar; uno que no lo era no puede pasar a rosa.
	if (datos.color === COLOR_CAPSULA_HEREDADO && anterior.color !== COLOR_CAPSULA_HEREDADO) throw new ErrorDeNegocio('COLOR_NO_ELEGIBLE');
	try {
		tx.update(tipoCapsula)
			.set({
				nombre: datos.nombre,
				nombreNormalizado: normalizar(datos.nombre),
				marca: datos.marca,
				intensidad: datos.intensidad ?? null,
				color: datos.color,
				fotoRuta: datos.fotoRuta === undefined ? anterior.fotoRuta : datos.fotoRuta,
				actualizadoEn: instante,
			})
			.where(eq(tipoCapsula.id, id))
			.run();
	} catch (causa) {
		if (esConflictoNombre(causa)) throw new ErrorDeNegocio('NOMBRE_DUPLICADO');
		throw causa;
	}
	return anterior.fotoRuta;
}

/** Quita la foto del tipo (RF-272). Devuelve la foto anterior, o `null` si no tenía, para que el caso de uso la borre tras confirmar. */
export function quitarFotoTipo(tx: Tx, id: string, instante: string): string | null {
	const anterior = leerFilaTx(tx, id);
	if (anterior.fotoRuta === null) return null;
	tx.update(tipoCapsula).set({ fotoRuta: null, actualizadoEn: instante }).where(eq(tipoCapsula.id, id)).run();
	return anterior.fotoRuta;
}

/** Cambia entre activo y retirado (RF-004). Reactivar falla si otro tipo activo tiene el mismo nombre. */
export function cambiarEstadoTipo(tx: Tx, id: string, estado: EstadoTipo, instante: string): void {
	leerFilaTx(tx, id);
	try {
		tx.update(tipoCapsula).set({ estado, actualizadoEn: instante }).where(eq(tipoCapsula.id, id)).run();
	} catch (causa) {
		if (esConflictoNombre(causa)) throw new ErrorDeNegocio('NOMBRE_DUPLICADO');
		throw causa;
	}
}

/** Borra el tipo. Devuelve su foto para que el caso de uso la borre del disco tras confirmar la transacción. */
export function borrarTipo(tx: Tx, id: string): string | null {
	const anterior = leerFilaTx(tx, id);
	tx.delete(tipoCapsula).where(eq(tipoCapsula.id, id)).run();
	return anterior.fotoRuta;
}

function leerFilaTx(tx: Tx, id: string): FilaTipoCapsula {
	const fila = tx.select().from(tipoCapsula).where(eq(tipoCapsula.id, id)).get();
	if (!fila) throw new RecursoNoEncontrado();
	return fila;
}

export function leerTipo(db: Ejecutor, id: string): FilaTipoCapsula | undefined {
	return db.select().from(tipoCapsula).where(eq(tipoCapsula.id, id)).get();
}

/** Todos los tipos, activos y retirados, por nombre. Sin permisos: el caso de uso que llama decide qué muestra. */
export function listarTipos(db: Ejecutor): FilaTipoCapsula[] {
	return db.select().from(tipoCapsula).orderBy(tipoCapsula.nombreNormalizado).all();
}
