import type { Actor } from '#lib/server/auth';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { ErrorDeNegocio, type Ejecutor } from '#lib/server/plataforma';

/** Comprueba el rol en la base en cada uso: una persona degradada pierde el acceso en la siguiente consulta (RN-060). */
export function exigirPermisoCopias(db: Ejecutor, actor: Actor | undefined): asserts actor is Actor {
	if (!actor || buscarUsuarioPorId(db, actor.usuarioId)?.rol !== 'administrador') throw new ErrorDeNegocio('SIN_PERMISO');
}
