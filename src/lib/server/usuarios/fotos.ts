import { eq } from 'drizzle-orm';
import { usuario } from './esquema';
import { buscarUsuarioPorId } from './consultas';
import { anotarAuditoria } from './auditoria';
import type { Rol } from './tipos';
import {
	ErrorDeNegocio,
	RecursoNoEncontrado,
	borrarFoto,
	enTransaccion,
	guardarFoto,
	nuevoId,
	procesarFoto,
	registrar,
	type Ambiente,
	type Ejecutor,
} from '#lib/server/plataforma';

// Foto de persona (plan F10 D10, RF-208, CA-208). La cambia la propia persona o un administrador; sin foto, la interfaz muestra iniciales.
// `usuarios` no importa `auth` (auth ya depende de este módulo): recibe del actor solo lo que comprueba.
type ActorFoto = { usuarioId: string; rol: Rol };

/** Nombre del archivo de la foto de una persona, o `null` si no tiene (RF-208). Cualquier miembro con sesión puede verla. */
export function leerFotoUsuario(db: Ejecutor, usuarioId: string): string | null {
	return buscarUsuarioPorId(db, usuarioId)?.fotoRuta ?? null;
}

/**
 * Cambia la foto de una persona o la quita (`foto` a `null`). La procesa y la escribe en disco antes de la transacción
 * (sin E/S asíncrona dentro de ella) y borra la anterior solo cuando el cambio está confirmado.
 */
export async function cambiarFoto(ambiente: Ambiente, actor: ActorFoto, usuarioId: string, foto: Uint8Array | null): Promise<void> {
	if (actor.usuarioId !== usuarioId && actor.rol !== 'administrador') {
		registrar('auth.permiso_denegado', { usuarioId: actor.usuarioId, rutaId: 'usuarios/foto' });
		throw new ErrorDeNegocio('SIN_PERMISO');
	}
	if (!buscarUsuarioPorId(ambiente.db, usuarioId)) throw new RecursoNoEncontrado();

	let fotoNueva: string | null = null;
	if (foto) {
		const contenido = await procesarFoto(foto);
		fotoNueva = `${nuevoId()}.webp`;
		guardarFoto(ambiente.directorioFotos, fotoNueva, contenido);
	}

	const instante = ambiente.reloj.ahora();
	let anterior: string | null;
	try {
		anterior = enTransaccion(ambiente.db, (tx) => {
			const persona = buscarUsuarioPorId(tx, usuarioId);
			if (!persona) throw new RecursoNoEncontrado();
			tx.update(usuario).set({ fotoRuta: fotoNueva }).where(eq(usuario.id, usuarioId)).run();
			anotarAuditoria(tx, {
				actorId: actor.usuarioId,
				accion: 'usuario.foto_cambiada',
				objetoId: usuarioId,
				detalle: { quitada: fotoNueva === null },
				instante,
			});
			return persona.fotoRuta;
		});
	} catch (error) {
		// Si la transacción falla después de escribir el archivo, el fichero nuevo no debe quedarse huérfano.
		if (fotoNueva) borrarFoto(ambiente.directorioFotos, fotoNueva);
		throw error;
	}
	if (anterior) borrarFoto(ambiente.directorioFotos, anterior);
	registrar('usuario.foto_cambiada', { usuarioId, quitada: fotoNueva === null });
}
