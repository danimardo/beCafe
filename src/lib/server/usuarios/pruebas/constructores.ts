import { randomUUID } from 'node:crypto';
import { usuario } from '../esquema';
import type { Ejecutor } from '#lib/server/plataforma';
import type { Estado, Rol } from '../tipos';

// Constructor de personas para las pruebas de otros módulos (docs/pruebas.md §6). Solo lo importan los `*.test.ts`.
export type DatosUsuario = {
	id?: string;
	nombre?: string;
	email?: string;
	rol?: Rol;
	estado?: Estado;
	creadoEn?: string;
};

export function construirUsuario(db: Ejecutor, datos: DatosUsuario = {}): { id: string; email: string } {
	const id = datos.id ?? randomUUID().replaceAll('-', '').slice(0, 26).toUpperCase();
	const email = datos.email ?? `persona-${id.toLowerCase()}@ejemplo.es`;
	db.insert(usuario)
		.values({
			id,
			nombre: datos.nombre ?? 'Persona de prueba',
			email,
			rol: datos.rol ?? 'miembro',
			estado: datos.estado ?? 'activo',
			creadoEn: datos.creadoEn ?? '2026-10-21T09:00:00.000Z',
			bajaEn: datos.estado === 'baja' ? '2026-10-21T09:00:00.000Z' : null,
		})
		.run();
	return { id, email };
}
