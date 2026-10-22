import { eq } from 'drizzle-orm';
import { credencial } from './esquema';
import { verificarContrasena, verificarReferencia } from './contrasenas';
import { crearSesion } from './sesiones';
import { buscarUsuarioPorCorreo, normalizarCorreo } from '#lib/server/usuarios';
import { ErrorDeNegocio, enTransaccion, registrar, type Db } from '#lib/server/plataforma';

// Inicio de sesión con bloqueo (RN-048, CA-133, RN-055; research R7).
export const MAXIMO_INTENTOS = 5;
export const DURACION_BLOQUEO_MS = 15 * 60 * 1000;

/**
 * Devuelve el token de sesión nuevo. Cualquier rechazo lanza el mismo error (`CREDENCIALES_INCORRECTAS`), con o sin correo.
 * Un bloqueo activo rechaza el intento sin verificar la contraseña. Un bloqueo terminado se olvida en el primer intento.
 */
export async function iniciarSesion(
	db: Db,
	entrada: { correo: string; contrasena: string; instante: string },
): Promise<{ usuarioId: string; sesionToken: string }> {
	const correo = normalizarCorreo(entrada.correo);
	const persona = buscarUsuarioPorCorreo(db, correo);
	if (!persona) {
		await verificarReferencia(entrada.contrasena);
		registrar('auth.acceso_fallido', { motivo: 'desconocido' });
		throw new ErrorDeNegocio('CREDENCIALES_INCORRECTAS');
	}

	const cred = db.select().from(credencial).where(eq(credencial.usuarioId, persona.id)).get();
	const bloqueada =
		cred?.bloqueadoHasta !== null && cred?.bloqueadoHasta !== undefined && Date.parse(cred.bloqueadoHasta) > Date.parse(entrada.instante);
	if (bloqueada) {
		registrar('auth.acceso_fallido', { motivo: 'bloqueada', usuarioId: persona.id });
		throw new ErrorDeNegocio('CREDENCIALES_INCORRECTAS');
	}
	if (!cred) {
		await verificarReferencia(entrada.contrasena);
		registrar('auth.acceso_fallido', { motivo: 'credenciales', usuarioId: persona.id });
		throw new ErrorDeNegocio('CREDENCIALES_INCORRECTAS');
	}

	const correcta = await verificarContrasena(cred.hash, entrada.contrasena);
	if (persona.estado === 'baja') {
		registrar('auth.acceso_fallido', { motivo: 'baja', usuarioId: persona.id });
		throw new ErrorDeNegocio('CREDENCIALES_INCORRECTAS');
	}

	const resultado = enTransaccion(db, (tx) => {
		const actual = tx.select().from(credencial).where(eq(credencial.usuarioId, persona.id)).get();
		const vencido =
			actual?.bloqueadoHasta !== null &&
			actual?.bloqueadoHasta !== undefined &&
			Date.parse(actual.bloqueadoHasta) <= Date.parse(entrada.instante);
		const intentosPrevios = vencido || !actual ? 0 : actual.intentosFallidos;

		if (correcta) {
			tx.update(credencial)
				.set({ intentosFallidos: 0, bloqueadoHasta: null, actualizadaEn: actual?.actualizadaEn ?? entrada.instante })
				.where(eq(credencial.usuarioId, persona.id))
				.run();
			const sesionToken = crearSesion(tx, { usuarioId: persona.id, instante: entrada.instante });
			return { exito: true as const, sesionToken };
		}

		const intentos = intentosPrevios + 1;
		const bloqueadoHasta = intentos >= MAXIMO_INTENTOS ? new Date(Date.parse(entrada.instante) + DURACION_BLOQUEO_MS).toISOString() : null;
		tx.update(credencial)
			.set({ intentosFallidos: intentos, bloqueadoHasta, actualizadaEn: actual?.actualizadaEn ?? entrada.instante })
			.where(eq(credencial.usuarioId, persona.id))
			.run();
		return { exito: false as const, bloqueada: bloqueadoHasta !== null };
	});

	if (!resultado.exito) {
		registrar('auth.acceso_fallido', { motivo: 'credenciales', usuarioId: persona.id });
		if (resultado.bloqueada) registrar('auth.cuenta_bloqueada', { usuarioId: persona.id });
		throw new ErrorDeNegocio('CREDENCIALES_INCORRECTAS');
	}
	registrar('auth.sesion_iniciada', { usuarioId: persona.id });
	return { usuarioId: persona.id, sesionToken: resultado.sesionToken };
}
