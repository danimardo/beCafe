import { eq } from 'drizzle-orm';
import { usuario } from './esquema';
import { buscarUsuarioPorId, contarAdministradoresActivos } from './consultas';
import { anotarAuditoria } from './auditoria';
import type { Rol } from './tipos';
import { ErrorDeNegocio, RecursoNoEncontrado, type Ejecutor } from '#lib/server/plataforma';

/**
 * Cambia el rol de una persona (RF-134). Dentro de la transacción `BEGIN IMMEDIATE`, cuenta los administradores activos y
 * rechaza el cambio si dejaría el sistema sin ninguno (INV-03, RN-041).
 */
export function cambiarRol(tx: Ejecutor, entrada: { usuarioId: string; rolNuevo: Rol; actorId: string; instante: string }): void {
	const persona = buscarUsuarioPorId(tx, entrada.usuarioId);
	if (!persona) throw new RecursoNoEncontrado();
	if (persona.rol === entrada.rolNuevo) return;

	const quitaAdministrador = persona.rol === 'administrador' && persona.estado === 'activo' && entrada.rolNuevo === 'miembro';
	if (quitaAdministrador && contarAdministradoresActivos(tx) <= 1) throw new ErrorDeNegocio('ULTIMO_ADMIN');

	tx.update(usuario).set({ rol: entrada.rolNuevo }).where(eq(usuario.id, persona.id)).run();
	anotarAuditoria(tx, {
		actorId: entrada.actorId,
		accion: 'usuario.rol_cambiado',
		objetoId: persona.id,
		detalle: { rolAnterior: persona.rol, rolNuevo: entrada.rolNuevo },
		instante: entrada.instante,
	});
}
