import { enTransaccion, ErrorDeNegocio, nuevoId, registrar, type Db } from '#lib/server/plataforma';
import { anotarAuditoria, buscarUsuarioPorCorreo, crearUsuario, normalizarCorreo, usuario } from '#lib/server/usuarios';
import { generarEnlace, type OrigenEnlace } from './enlaces';

// Primer administrador (RF-139, DEC-104) y recuperación desde el comando del operador (RF-139b).

/** Crea el primer administrador con invitación. Solo lo llama el arranque cuando no hay ninguna persona. */
export function crearPrimerAdministrador(
	db: Db,
	entrada: { nombre: string; correo: string; instante: string },
): { usuarioId: string; token: string; expiraEn: string } {
	const id = nuevoId();
	const enlace = enTransaccion(db, (tx) => {
		crearUsuario(tx, { id, nombre: entrada.nombre, correo: entrada.correo, rol: 'administrador', instante: entrada.instante });
		anotarAuditoria(tx, {
			actorId: null,
			accion: 'usuario.alta',
			objetoId: id,
			detalle: { rol: 'administrador' },
			instante: entrada.instante,
		});
		return generarEnlace(tx, { usuarioId: id, tipo: 'invitacion', origen: 'arranque', creadoPor: null, instante: entrada.instante });
	});
	registrar('usuario.alta', { usuarioId: id, rol: 'administrador' });
	registrar('auth.admin_inicial_creado', { usuarioId: id });
	return { usuarioId: id, ...enlace };
}

export function hayUsuarios(db: Db): boolean {
	return db.select({ id: usuario.id }).from(usuario).limit(1).get() !== undefined;
}

export type ResultadoRecuperacion = { tipo: 'recuperacion' | 'invitacion'; usuarioId: string; token: string; expiraEn: string };

/**
 * Comando de RF-139b. Con un administrador activo genera un enlace de recuperación (1 h). Con un correo nuevo y nombre
 * crea un administrador con invitación. Un miembro o una persona de baja no se toca.
 */
export function recuperarAcceso(
	db: Db,
	entrada: { correo: string; nombre: string | undefined; instante: string; origen: OrigenEnlace },
): ResultadoRecuperacion {
	const correo = normalizarCorreo(entrada.correo);
	const existente = buscarUsuarioPorCorreo(db, correo);

	if (existente) {
		if (existente.rol !== 'administrador' || existente.estado !== 'activo') throw new ErrorDeNegocio('ESTADO_INCORRECTO');
		const enlace = enTransaccion(db, (tx) =>
			generarEnlace(tx, {
				usuarioId: existente.id,
				tipo: 'recuperacion',
				origen: entrada.origen,
				creadoPor: null,
				instante: entrada.instante,
			}),
		);
		registrar('auth.enlace_generado', { usuarioId: existente.id, tipo: 'recuperacion', origen: entrada.origen });
		return { tipo: 'recuperacion', usuarioId: existente.id, ...enlace };
	}

	if (entrada.nombre === undefined) throw new ErrorDeNegocio('VALIDACION');
	const id = nuevoId();
	const enlace = enTransaccion(db, (tx) => {
		crearUsuario(tx, { id, nombre: entrada.nombre ?? '', correo, rol: 'administrador', instante: entrada.instante });
		anotarAuditoria(tx, {
			actorId: null,
			accion: 'usuario.alta',
			objetoId: id,
			detalle: { rol: 'administrador' },
			instante: entrada.instante,
		});
		return generarEnlace(tx, { usuarioId: id, tipo: 'invitacion', origen: entrada.origen, creadoPor: null, instante: entrada.instante });
	});
	registrar('usuario.alta', { usuarioId: id, rol: 'administrador' });
	return { tipo: 'invitacion', usuarioId: id, ...enlace };
}
