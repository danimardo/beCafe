import { and, count, eq } from 'drizzle-orm';
import { usuario } from './esquema';
import type { Ejecutor } from '#lib/server/plataforma';

export type FilaUsuario = typeof usuario.$inferSelect;

export function buscarUsuarioPorId(db: Ejecutor, id: string): FilaUsuario | undefined {
	return db.select().from(usuario).where(eq(usuario.id, id)).get();
}

export function buscarUsuarioPorCorreo(db: Ejecutor, correo: string): FilaUsuario | undefined {
	return db.select().from(usuario).where(eq(usuario.email, correo)).get();
}

export function contarAdministradoresActivos(db: Ejecutor): number {
	return (
		db
			.select({ n: count() })
			.from(usuario)
			.where(and(eq(usuario.rol, 'administrador'), eq(usuario.estado, 'activo')))
			.get()?.n ?? 0
	);
}

export function listarUsuarios(db: Ejecutor): FilaUsuario[] {
	return db.select().from(usuario).orderBy(usuario.nombre).all();
}
