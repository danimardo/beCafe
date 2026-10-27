import { eq } from 'drizzle-orm';
import { instalacionApp } from './esquema';
import { siguienteEstadoInstalacion, type EstadoInstalacion } from './dominio/instalacion';
import { ErrorDeNegocio, enTransaccion, registrar, type Ambiente, type Ejecutor } from '#lib/server/plataforma';
import type { Rol } from './tipos';

// Estado de instalación de la aplicación (F16, RF-278, RF-280, RF-281, RF-283).
// `usuarios` no importa `auth`: recibe del actor solo lo que comprueba.
type ActorInstalacion = { usuarioId: string; rol: Rol };

export type InstalacionPersona = { estado: EstadoInstalacion; instante: string };

/** Una persona registra su propio estado. Un estado que no cambia nada no escribe ni emite evento. */
export function registrarInstalacion(ambiente: Ambiente, actor: { usuarioId: string }, estado: EstadoInstalacion): void {
	const instante = ambiente.reloj.ahora();
	const cambio = enTransaccion(ambiente.db, (tx) => {
		const actual = tx
			.select({ estado: instalacionApp.estado })
			.from(instalacionApp)
			.where(eq(instalacionApp.usuarioId, actor.usuarioId))
			.get();
		const { cambia } = siguienteEstadoInstalacion(actual?.estado ?? null, estado);
		if (!cambia) return false;
		tx.insert(instalacionApp)
			.values({ usuarioId: actor.usuarioId, estado, instante })
			.onConflictDoUpdate({ target: instalacionApp.usuarioId, set: { estado, instante } })
			.run();
		return true;
	});
	if (cambio) registrar('instalacion.registrada', { usuarioId: actor.usuarioId, estado });
}

/** Estado de instalación de una persona, o `null` si no hay datos. Solo un administrador puede leer el de otra persona; la propia puede leer el suyo. */
export function leerInstalacion(db: Ejecutor, actor: ActorInstalacion, usuarioId: string): InstalacionPersona | null {
	if (actor.usuarioId !== usuarioId && actor.rol !== 'administrador') {
		registrar('auth.permiso_denegado', { usuarioId: actor.usuarioId, rutaId: 'usuarios/instalacion' });
		throw new ErrorDeNegocio('SIN_PERMISO');
	}
	return (
		db
			.select({ estado: instalacionApp.estado, instante: instalacionApp.instante })
			.from(instalacionApp)
			.where(eq(instalacionApp.usuarioId, usuarioId))
			.get() ?? null
	);
}
