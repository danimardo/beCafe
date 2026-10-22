import { eq } from 'drizzle-orm';
import { usuario } from './esquema';
import type { FilaUsuario } from './consultas';
import type { Ejecutor } from '#lib/server/plataforma';

/** Una persona debe leer la versión vigente del texto de privacidad antes de usar la aplicación (RF-160). */
export function privacidadPendiente(persona: Pick<FilaUsuario, 'privacidadVersion'>, versionVigente: number): boolean {
	return persona.privacidadVersion !== versionVigente;
}

export function aceptarPrivacidad(tx: Ejecutor, entrada: { usuarioId: string; version: number; instante: string }): void {
	tx.update(usuario)
		.set({ privacidadVersion: entrada.version, privacidadLeidaEn: entrada.instante })
		.where(eq(usuario.id, entrada.usuarioId))
		.run();
}
