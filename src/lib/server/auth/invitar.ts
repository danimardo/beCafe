import { eq } from 'drizzle-orm';
import { credencial } from './esquema';
import { anularEnlacesPendientes, generarEnlace, tipoEnlacePara } from './enlaces';
import { cerrarSesionesDeUsuario, limpiarSesionesCerradasPorBaja } from './sesiones';
import { exigirReautenticacion } from './reautenticacion';
import { exigirAdministrador, type Actor } from './actor';
import { anotarAuditoria, buscarUsuarioPorId, cambiarRol, crearUsuario, reactivarUsuario, type Rol } from '#lib/server/usuarios';
import {
	ErrorDeNegocio,
	RecursoNoEncontrado,
	borrarFoto,
	enTransaccion,
	guardarFoto,
	nuevoId,
	procesarFoto,
	registrar,
	type Db,
} from '#lib/server/plataforma';

// Operaciones de administración que cruzan `auth` y `usuarios` (research R11). Cada una exige administrador y reautenticación.
type EntradaAdmin = { actor: Actor; contrasenaActual: string | undefined; instante: string };

export async function darDeAltaConInvitacion(
	db: Db,
	entrada: EntradaAdmin & { nombre: string; correo: string; rol: Rol; foto?: { bytes: Uint8Array; directorio: string } },
): Promise<{ usuarioId: string; token: string; expiraEn: string }> {
	exigirAdministrador(entrada.actor, 'usuarios.alta');
	await exigirReautenticacion(db, entrada);

	// Foto opcional (RF-223): se valida y se escribe antes de la transacción; si el alta falla, el archivo se borra.
	let fotoRuta: string | undefined;
	if (entrada.foto) {
		const contenido = await procesarFoto(entrada.foto.bytes);
		fotoRuta = `${nuevoId()}.webp`;
		guardarFoto(entrada.foto.directorio, fotoRuta, contenido);
	}

	const id = nuevoId();
	let resultado: ReturnType<typeof generarEnlace>;
	try {
		resultado = altaEnTransaccion(db, id, entrada, fotoRuta);
	} catch (error) {
		if (fotoRuta && entrada.foto) borrarFoto(entrada.foto.directorio, fotoRuta);
		throw error;
	}
	registrar('usuario.alta', { usuarioId: id, rol: entrada.rol });
	return { usuarioId: id, ...resultado };
}

function altaEnTransaccion(
	db: Db,
	id: string,
	entrada: EntradaAdmin & { nombre: string; correo: string; rol: Rol },
	fotoRuta: string | undefined,
): ReturnType<typeof generarEnlace> {
	return enTransaccion(db, (tx) => {
		crearUsuario(tx, { id, nombre: entrada.nombre, correo: entrada.correo, rol: entrada.rol, instante: entrada.instante, fotoRuta });
		anotarAuditoria(tx, {
			actorId: entrada.actor.usuarioId,
			accion: 'usuario.alta',
			objetoId: id,
			detalle: { rol: entrada.rol },
			instante: entrada.instante,
		});
		return generarEnlace(tx, {
			usuarioId: id,
			tipo: 'invitacion',
			origen: 'aplicacion',
			creadoPor: entrada.actor.usuarioId,
			instante: entrada.instante,
		});
	});
}

export async function generarEnlaceParaPersona(
	db: Db,
	entrada: EntradaAdmin & { usuarioId: string },
): Promise<{ tipo: 'invitacion' | 'recuperacion'; token: string; expiraEn: string }> {
	exigirAdministrador(entrada.actor, 'usuarios.generarEnlace');
	await exigirReautenticacion(db, entrada);

	return enTransaccion(db, (tx) => {
		const persona = buscarUsuarioPorId(tx, entrada.usuarioId);
		if (!persona) throw new RecursoNoEncontrado();
		if (persona.estado !== 'activo') throw new ErrorDeNegocio('ESTADO_INCORRECTO');
		const tieneContrasena = tx.select().from(credencial).where(eq(credencial.usuarioId, persona.id)).get() !== undefined;
		const tipo = tipoEnlacePara(tieneContrasena);
		const enlace = generarEnlace(tx, {
			usuarioId: persona.id,
			tipo,
			origen: 'aplicacion',
			creadoPor: entrada.actor.usuarioId,
			instante: entrada.instante,
		});
		return { tipo, ...enlace };
	});
}

export async function reactivarPersona(db: Db, entrada: EntradaAdmin & { usuarioId: string }): Promise<void> {
	exigirAdministrador(entrada.actor, 'usuarios.reactivar');
	await exigirReautenticacion(db, entrada);

	enTransaccion(db, (tx) => {
		reactivarUsuario(tx, { usuarioId: entrada.usuarioId, actorId: entrada.actor.usuarioId, instante: entrada.instante });
		tx.delete(credencial).where(eq(credencial.usuarioId, entrada.usuarioId)).run();
		anularEnlacesPendientes(tx, entrada.usuarioId, entrada.instante);
		cerrarSesionesDeUsuario(tx, entrada.usuarioId);
		limpiarSesionesCerradasPorBaja(tx, entrada.usuarioId);
	});
	registrar('usuario.reactivado', { usuarioId: entrada.usuarioId });
}

export async function cambiarRolPersona(db: Db, entrada: EntradaAdmin & { usuarioId: string; rolNuevo: Rol }): Promise<void> {
	exigirAdministrador(entrada.actor, 'usuarios.cambiarRol');
	await exigirReautenticacion(db, entrada);

	enTransaccion(db, (tx) => {
		cambiarRol(tx, {
			usuarioId: entrada.usuarioId,
			rolNuevo: entrada.rolNuevo,
			actorId: entrada.actor.usuarioId,
			instante: entrada.instante,
		});
	});
	registrar('usuario.rol_cambiado', { usuarioId: entrada.usuarioId, rolNuevo: entrada.rolNuevo });
}
