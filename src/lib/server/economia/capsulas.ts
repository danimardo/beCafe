import type { Encuadre } from '#lib/shared/contratos/encuadre';
import { eq } from 'drizzle-orm';
import { exigirAdministrador, type Actor } from '#lib/server/auth';
import {
	borrarFoto,
	enTransaccion,
	ErrorDeNegocio,
	guardarFoto,
	nuevoId,
	procesarFoto,
	registrar,
	type Ambiente,
	type Tx,
} from '#lib/server/plataforma';
import { actualizarDescriptivos, borrarTipo, cambiarEstadoTipo, insertarTipo, quitarFotoTipo, type EstadoTipo } from '#lib/server/catalogo';
import { anotarAuditoria } from '#lib/server/usuarios';
import { borrarExistencia, crearExistencia, fijarUmbral } from './existencias';
import { consumo, lineaCompra, lineaRecuento } from './esquema';

// Casos de uso de los tipos de cápsula (RF-001, RF-003, RF-004, RF-006). `economia` orquesta las escrituras porque
// cada alta crea su existencia y cada cambio de umbral puede generar una entrada de stock bajo (plan D2).
// Cada caso de uso comprueba el permiso antes de tocar nada (RNF-007).

const RUTA_CATALOGO = 'admin/capsulas';

export type DatosCapsulaEntrada = {
	nombre: string;
	marca: string;
	intensidad: number | undefined;
	color: string;
	umbralMinimo: number;
	/** Contenido de la foto ya validado por el esquema. Se procesa aquí con `sharp`. */
	foto?: Uint8Array;
	/** Zona elegida en la foto; sin ella, el servidor recorta el centro (RF-273). */
	encuadre?: Encuadre | undefined;
};

/** Procesa la foto y la escribe en disco antes de la transacción. Devuelve su nombre, o null si no hay foto. */
async function prepararFoto(ambiente: Ambiente, foto: Uint8Array | undefined, encuadre: Encuadre | undefined): Promise<string | null> {
	if (!foto) return null;
	const contenido = await procesarFoto(foto, encuadre ?? 'centro');
	const nombre = `${nuevoId()}.webp`;
	guardarFoto(ambiente.directorioFotos, nombre, contenido);
	return nombre;
}

/** Si la transacción falla después de escribir la foto, el fichero nuevo no debe quedarse huérfano. */
function descartarFoto(ambiente: Ambiente, nombre: string | null): void {
	if (nombre) borrarFoto(ambiente.directorioFotos, nombre);
}

export async function darDeAltaCapsula(ambiente: Ambiente, actor: Actor, datos: DatosCapsulaEntrada): Promise<{ id: string }> {
	exigirAdministrador(actor, RUTA_CATALOGO);
	const id = nuevoId();
	const instante = ambiente.reloj.ahora();
	const fotoRuta = await prepararFoto(ambiente, datos.foto, datos.encuadre);
	try {
		enTransaccion(ambiente.db, (tx) => {
			insertarTipo(tx, {
				id,
				nombre: datos.nombre,
				marca: datos.marca,
				intensidad: datos.intensidad,
				color: datos.color,
				fotoRuta,
				instante,
			});
			crearExistencia(tx, { tipoCapsulaId: id, umbralMinimo: datos.umbralMinimo });
		});
	} catch (causa) {
		descartarFoto(ambiente, fotoRuta);
		throw causa;
	}
	registrar('capsula.alta', { tipoCapsulaId: id });
	return { id };
}

export async function editarCapsula(ambiente: Ambiente, actor: Actor, id: string, datos: DatosCapsulaEntrada): Promise<void> {
	exigirAdministrador(actor, RUTA_CATALOGO);
	const instante = ambiente.reloj.ahora();
	const fotoNueva = await prepararFoto(ambiente, datos.foto, datos.encuadre);
	let resultado: { fotoAnterior: string | null; entradaRegistrada: boolean };
	try {
		resultado = enTransaccion(ambiente.db, (tx) => {
			const fotoAnterior = actualizarDescriptivos(
				tx,
				id,
				{ nombre: datos.nombre, marca: datos.marca, intensidad: datos.intensidad, color: datos.color, fotoRuta: fotoNueva ?? undefined },
				instante,
			);
			const { entradaRegistrada } = fijarUmbral(tx, id, datos.umbralMinimo, instante);
			return { fotoAnterior, entradaRegistrada };
		});
	} catch (causa) {
		descartarFoto(ambiente, fotoNueva);
		throw causa;
	}
	if (fotoNueva && resultado.fotoAnterior) borrarFoto(ambiente.directorioFotos, resultado.fotoAnterior);
	registrar('capsula.modificada', { tipoCapsulaId: id });
	if (resultado.entradaRegistrada) registrar('stock.entrada_bajo_registrada', { tipoCapsulaId: id });
}

/** Quita la foto de un tipo (RF-272): el tipo vuelve a mostrar su ilustración. Sin foto, no hace nada. */
export function quitarFotoCapsula(ambiente: Ambiente, actor: Actor, id: string): void {
	exigirAdministrador(actor, RUTA_CATALOGO);
	const instante = ambiente.reloj.ahora();
	const anterior = enTransaccion(ambiente.db, (tx) => {
		const fotoAnterior = quitarFotoTipo(tx, id, instante);
		if (fotoAnterior)
			anotarAuditoria(tx, {
				actorId: actor.usuarioId,
				accion: 'capsula.foto_quitada',
				objetoId: id,
				objetoTipo: 'tipo_capsula',
				detalle: {},
				instante,
			});
		return fotoAnterior;
	});
	if (!anterior) return;
	borrarFoto(ambiente.directorioFotos, anterior);
	registrar('capsula.foto_quitada', { tipoCapsulaId: id });
}

/** Retirar (estado `retirado`) o reactivar (`activo`). Reactivar falla si el nombre ya lo usa otro tipo activo (RF-002). */
export function cambiarEstadoCapsula(ambiente: Ambiente, actor: Actor, id: string, estado: EstadoTipo): void {
	exigirAdministrador(actor, RUTA_CATALOGO);
	enTransaccion(ambiente.db, (tx) => cambiarEstadoTipo(tx, id, estado, ambiente.reloj.ahora()));
	registrar(estado === 'activo' ? 'capsula.reactivada' : 'capsula.desactivada', { tipoCapsulaId: id });
}

/** Borra un tipo sin registros (RF-006). Con registros, rechaza la petición: solo se puede retirar. */
export function borrarCapsula(ambiente: Ambiente, actor: Actor, id: string): void {
	exigirAdministrador(actor, RUTA_CATALOGO);
	const fotoAnterior = enTransaccion(ambiente.db, (tx) => {
		if (hayRegistrosDeTipo(tx, id)) throw new ErrorDeNegocio('TIENE_REGISTROS');
		borrarExistencia(tx, id);
		return borrarTipo(tx, id);
	});
	if (fotoAnterior) borrarFoto(ambiente.directorioFotos, fotoAnterior);
	registrar('capsula.borrada', { tipoCapsulaId: id });
}

// Un tipo con consumos, líneas de compra o líneas de recuento no se puede borrar (CA-006, plan F2 D8).
function hayRegistrosDeTipo(tx: Tx, tipoCapsulaId: string): boolean {
	const consumos = tx.select({ id: consumo.id }).from(consumo).where(eq(consumo.tipoCapsulaId, tipoCapsulaId)).limit(1).get();
	const compras = tx.select({ id: lineaCompra.id }).from(lineaCompra).where(eq(lineaCompra.tipoCapsulaId, tipoCapsulaId)).limit(1).get();
	const recuentos = tx
		.select({ id: lineaRecuento.id })
		.from(lineaRecuento)
		.where(eq(lineaRecuento.tipoCapsulaId, tipoCapsulaId))
		.limit(1)
		.get();
	return [consumos, compras, recuentos].some((fila) => fila !== undefined);
}
