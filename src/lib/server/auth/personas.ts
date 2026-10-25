import { urlFotoUsuario } from '#lib/shared/contratos/fotos-usuario';
import { eq } from 'drizzle-orm';
import { credencial } from './esquema';
import { exigirAdministrador, type Actor } from './actor';
import { buscarUsuarioPorId, contarAdministradoresActivos, listarUsuarios, type Estado, type Rol } from '#lib/server/usuarios';
import { RecursoNoEncontrado, type Ejecutor } from '#lib/server/plataforma';

// Vista de administración de las personas (RF-130, RF-134). Solo la ve un administrador. Nunca lleva credenciales ni enlaces.
export type PersonaAdmin = {
	id: string;
	nombre: string;
	email: string;
	rol: Rol;
	estado: Estado;
	tieneContrasena: boolean;
	/** Solo en la ficha de una persona (RF-208). */
	fotoUrl?: string | null;
};
export type ListadoPersonas = { personas: PersonaAdmin[]; administradoresActivos: number };

function conContrasena(db: Ejecutor): Set<string> {
	return new Set(
		db
			.select({ usuarioId: credencial.usuarioId })
			.from(credencial)
			.all()
			.map((fila) => fila.usuarioId),
	);
}

export function listarPersonas(db: Ejecutor, actor: Actor): ListadoPersonas {
	exigirAdministrador(actor, '/admin/usuarios');
	const tienenContrasena = conContrasena(db);
	return {
		personas: listarUsuarios(db).map((persona) => ({
			id: persona.id,
			nombre: persona.nombre,
			email: persona.email,
			rol: persona.rol,
			estado: persona.estado,
			tieneContrasena: tienenContrasena.has(persona.id),
		})),
		administradoresActivos: contarAdministradoresActivos(db),
	};
}

export function obtenerPersona(db: Ejecutor, actor: Actor, usuarioId: string): PersonaAdmin {
	exigirAdministrador(actor, '/admin/usuarios/[usuarioId]');
	const persona = buscarUsuarioPorId(db, usuarioId);
	if (!persona) throw new RecursoNoEncontrado();
	const tieneContrasena = db.select().from(credencial).where(eq(credencial.usuarioId, usuarioId)).get() !== undefined;
	return {
		id: persona.id,
		nombre: persona.nombre,
		email: persona.email,
		rol: persona.rol,
		estado: persona.estado,
		tieneContrasena,
		fotoUrl: persona.fotoRuta ? urlFotoUsuario(persona.id, persona.fotoRuta) : null,
	};
}
