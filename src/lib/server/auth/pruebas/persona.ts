import { eq } from 'drizzle-orm';
import { enTransaccion, nuevoId, type Ambiente } from '#lib/server/plataforma';
import { crearUsuario, usuario, type Estado, type Rol } from '#lib/server/usuarios';
import { definirContrasenaConEnlace, generarEnlace } from '../enlaces';

// Creación de personas para las pruebas de `auth` (solo las importan los `*.test.ts`).
export const CONTRASENA_VALIDA = 'contraseña de prueba larga';

export function crearPersona(ambiente: Ambiente, datos: { correo: string; rol?: Rol; estado?: Estado }): { id: string; correo: string } {
	const id = nuevoId();
	const instante = ambiente.reloj.ahora();
	crearUsuario(ambiente.db, { id, nombre: 'Persona de prueba', correo: datos.correo, rol: datos.rol ?? 'miembro', instante });
	if (datos.estado === 'baja') {
		ambiente.db.update(usuario).set({ estado: 'baja', bajaEn: instante }).where(eq(usuario.id, id)).run();
	}
	return { id, correo: datos.correo };
}

/** Define la contraseña de una persona con un enlace de invitación válido, como en el flujo real. */
export async function definirContrasena(ambiente: Ambiente, persona: { id: string }, contrasena = CONTRASENA_VALIDA): Promise<void> {
	const instante = ambiente.reloj.ahora();
	const { token } = enTransaccion(ambiente.db, (tx) =>
		generarEnlace(tx, { usuarioId: persona.id, tipo: 'invitacion', origen: 'aplicacion', creadoPor: null, instante }),
	);
	await definirContrasenaConEnlace(ambiente.db, { token, contrasena, instante });
}
