import { eq } from 'drizzle-orm';
import { usuario } from './esquema';
import { buscarUsuarioPorId, contarAdministradoresActivos } from './consultas';
import { ErrorDeNegocio, RecursoNoEncontrado, type Ejecutor } from '#lib/server/plataforma';

/** Marca la baja de una persona (RF-135). El último administrador activo no puede darse de baja (INV-03). */
export function marcarBaja(tx: Ejecutor, entrada: { usuarioId: string; instante: string }): void {
	const persona = buscarUsuarioPorId(tx, entrada.usuarioId);
	if (!persona) throw new RecursoNoEncontrado();
	if (persona.estado === 'baja') throw new ErrorDeNegocio('ESTADO_INCORRECTO');
	if (persona.rol === 'administrador' && contarAdministradoresActivos(tx) <= 1) throw new ErrorDeNegocio('ULTIMO_ADMIN');
	tx.update(usuario).set({ estado: 'baja', bajaEn: entrada.instante }).where(eq(usuario.id, persona.id)).run();
}
