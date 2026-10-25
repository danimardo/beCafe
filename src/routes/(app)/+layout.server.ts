import type { LayoutServerLoad } from './$types';
import { contarNuevos } from '#lib/server/notificaciones';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { urlFotoUsuario } from '#lib/shared/contratos/fotos-usuario';
import { CLAVE_AVISOS } from '#lib/shared/claves-carga';

// Avisos sin abrir de la persona para la campana (RF-107) y datos básicos para la navegación (RF-182).
// Sin sesión, no hay campana ni usuario. La protección de cada página la hace su caso de uso.
export const load: LayoutServerLoad = ({ locals, depends }) => {
	depends(CLAVE_AVISOS);
	const actor = locals.actor;
	if (!actor) return { avisosNuevos: 0, usuario: null };
	const persona = buscarUsuarioPorId(locals.ambiente.db, actor.usuarioId);
	return {
		avisosNuevos: contarNuevos(locals.ambiente.db, { usuarioId: actor.usuarioId }, locals.ambiente.reloj.ahora()),
		usuario: persona
			? {
					id: persona.id,
					nombre: persona.nombre,
					rol: actor.rol,
					fotoUrl: persona.fotoRuta ? urlFotoUsuario(persona.id, persona.fotoRuta) : null,
				}
			: null,
	};
};
