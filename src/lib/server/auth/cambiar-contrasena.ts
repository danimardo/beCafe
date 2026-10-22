import { eq } from 'drizzle-orm';
import { credencial } from './esquema';
import { contrasenaAceptable, hashContrasena, verificarContrasena } from './contrasenas';
import { cerrarSesionesDeUsuario } from './sesiones';
import { ErrorDeNegocio, enTransaccion, registrar, type Db } from '#lib/server/plataforma';

/**
 * Cambio desde el perfil (RF-137, aclaración 9): verifica la contraseña actual, guarda la nueva y cierra las demás sesiones.
 * La sesión actual sigue abierta.
 */
export async function cambiarContrasena(
	db: Db,
	entrada: { usuarioId: string; sesionIdHash: string; contrasenaActual: string; contrasenaNueva: string; instante: string },
): Promise<void> {
	if (!contrasenaAceptable(entrada.contrasenaNueva)) throw new ErrorDeNegocio('CONTRASENA_NO_VALIDA');
	const cred = db.select().from(credencial).where(eq(credencial.usuarioId, entrada.usuarioId)).get();
	const correcta = cred ? await verificarContrasena(cred.hash, entrada.contrasenaActual) : false;
	if (!correcta) throw new ErrorDeNegocio('CREDENCIALES_INCORRECTAS');
	const hash = await hashContrasena(entrada.contrasenaNueva);

	enTransaccion(db, (tx) => {
		tx.update(credencial)
			.set({ hash, intentosFallidos: 0, bloqueadoHasta: null, actualizadaEn: entrada.instante })
			.where(eq(credencial.usuarioId, entrada.usuarioId))
			.run();
		cerrarSesionesDeUsuario(tx, entrada.usuarioId, entrada.sesionIdHash);
	});
	registrar('auth.contrasena_cambiada', { usuarioId: entrada.usuarioId, via: 'perfil' });
	registrar('auth.sesion_cerrada', { usuarioId: entrada.usuarioId, alcance: 'otras' });
}
