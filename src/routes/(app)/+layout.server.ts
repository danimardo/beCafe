import type { LayoutServerLoad } from './$types';
import { contarNuevos } from '#lib/server/notificaciones';
import { CLAVE_AVISOS } from '#lib/shared/claves-carga';

// Avisos sin abrir de la persona para la campana (RF-107). Sin sesión, no hay campana. La protección de cada página la hace su caso de uso.
export const load: LayoutServerLoad = ({ locals, depends }) => {
	depends(CLAVE_AVISOS);
	const actor = locals.actor;
	if (!actor) return { avisosNuevos: 0 };
	return { avisosNuevos: contarNuevos(locals.ambiente.db, { usuarioId: actor.usuarioId }, locals.ambiente.reloj.ahora()) };
};
