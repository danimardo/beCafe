import { ErrorDeNegocio, registrar } from '#lib/server/plataforma';
import type { Rol } from '#lib/server/usuarios';
import type { SesionResuelta } from './sesiones';

// Quién actúa en una operación (ARCHITECTURE.md §6). El caso de uso lo recibe y comprueba el permiso en el servidor.
export type Actor = {
	usuarioId: string;
	rol: Rol;
	autenticadoEn: string;
	sesionIdHash: string;
};

export function crearActor(sesion: SesionResuelta): Actor {
	return {
		usuarioId: sesion.usuario.id,
		rol: sesion.usuario.rol === 'administrador' ? 'administrador' : 'miembro',
		autenticadoEn: sesion.ultimaAutenticacionEn,
		sesionIdHash: sesion.idHash,
	};
}

export function exigirSesion(actor: Actor | undefined): Actor {
	if (!actor) throw new ErrorDeNegocio('SIN_SESION');
	return actor;
}

/** Comprueba el rol de administrador. Un miembro que lo intenta deja un evento de permiso denegado. */
export function exigirAdministrador(actor: Actor, rutaId: string): void {
	if (actor.rol === 'administrador') return;
	registrar('auth.permiso_denegado', { usuarioId: actor.usuarioId, rutaId });
	throw new ErrorDeNegocio('SIN_PERMISO');
}
