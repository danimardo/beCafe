import { eq } from 'drizzle-orm';
import { usuario } from './esquema';
import { buscarUsuarioPorId } from './consultas';
import { anotarAuditoria } from './auditoria';
import { ErrorDeNegocio, RecursoNoEncontrado, type Ejecutor } from '#lib/server/plataforma';

/** Reactiva a una persona dada de baja (RF-136). Devuelve error si ya está activa. */
export function reactivarUsuario(tx: Ejecutor, entrada: { usuarioId: string; actorId: string; instante: string }): void {
	const persona = buscarUsuarioPorId(tx, entrada.usuarioId);
	if (!persona) throw new RecursoNoEncontrado();
	if (persona.estado !== 'baja') throw new ErrorDeNegocio('ESTADO_INCORRECTO');

	tx.update(usuario).set({ estado: 'activo', bajaEn: null }).where(eq(usuario.id, persona.id)).run();
	anotarAuditoria(tx, {
		actorId: entrada.actorId,
		accion: 'usuario.reactivado',
		objetoId: persona.id,
		detalle: {},
		instante: entrada.instante,
	});
}
