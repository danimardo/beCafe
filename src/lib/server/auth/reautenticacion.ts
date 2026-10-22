import { eq } from 'drizzle-orm';
import { credencial, sesion } from './esquema';
import { verificarContrasena } from './contrasenas';
import type { Actor } from './actor';
import { ErrorDeNegocio, registrar, type Ejecutor } from '#lib/server/plataforma';

// Reautenticación de administrador (RN-050, RF-138; research R9). No cuenta para el bloqueo de RN-048.
export const VENTANA_REAUTENTICACION_MS = 15 * 60 * 1000;

/** Confirma la contraseña actual y renueva la ventana de reautenticación en la misma petición. */
export async function reautenticar(db: Ejecutor, entrada: { actor: Actor; contrasena: string; instante: string }): Promise<void> {
	const cred = db.select().from(credencial).where(eq(credencial.usuarioId, entrada.actor.usuarioId)).get();
	const correcta = cred ? await verificarContrasena(cred.hash, entrada.contrasena) : false;
	registrar('auth.reautenticacion', { usuarioId: entrada.actor.usuarioId, resultado: correcta ? 'ok' : 'fallida' });
	if (!correcta) throw new ErrorDeNegocio('CREDENCIALES_INCORRECTAS');
	db.update(sesion).set({ ultimaAutenticacionEn: entrada.instante }).where(eq(sesion.idHash, entrada.actor.sesionIdHash)).run();
}

/**
 * Acción sensible de administración: si la última autenticación tiene menos de 15 minutos, basta; si no, hace falta la
 * contraseña actual (`REAUTENTICACION_REQUERIDA` sin ella). Con 15 minutos exactos se permite.
 */
export async function exigirReautenticacion(
	db: Ejecutor,
	entrada: { actor: Actor; contrasenaActual: string | undefined; instante: string },
): Promise<void> {
	const transcurrido = Date.parse(entrada.instante) - Date.parse(entrada.actor.autenticadoEn);
	if (transcurrido <= VENTANA_REAUTENTICACION_MS) return;
	if (entrada.contrasenaActual === undefined || entrada.contrasenaActual === '') {
		throw new ErrorDeNegocio('REAUTENTICACION_REQUERIDA');
	}
	await reautenticar(db, { actor: entrada.actor, contrasena: entrada.contrasenaActual, instante: entrada.instante });
}
