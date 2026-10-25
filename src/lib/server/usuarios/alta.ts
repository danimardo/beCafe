import { usuario } from './esquema';
import { ROLES, type Rol } from './tipos';
import { ErrorDeNegocio, type Ejecutor } from '#lib/server/plataforma';

/** Normaliza un correo: sin espacios y en minúsculas (data-model.md). */
export function normalizarCorreo(correo: string): string {
	return correo.trim().toLowerCase();
}

/** Crea una persona activa. El índice único de `email` impide duplicados: se traduce a `CORREO_DUPLICADO`. */
export function crearUsuario(tx: Ejecutor, entrada: { id: string; nombre: string; correo: string; rol: Rol; instante: string; fotoRuta?: string | undefined }): void {
	if (!ROLES.includes(entrada.rol)) throw new ErrorDeNegocio('VALIDACION');
	try {
		tx.insert(usuario)
			.values({
				id: entrada.id,
				nombre: entrada.nombre,
				email: normalizarCorreo(entrada.correo),
				rol: entrada.rol,
				estado: 'activo',
				fotoRuta: entrada.fotoRuta ?? null,
				creadoEn: entrada.instante,
			})
			.run();
	} catch (error) {
		if (esErrorDeCorreoDuplicado(error)) throw new ErrorDeNegocio('CORREO_DUPLICADO');
		throw error;
	}
}

function esErrorDeCorreoDuplicado(error: unknown): boolean {
	const texto = error instanceof Error ? `${error.message} ${String(error.cause)}` : String(error);
	return texto.includes('UNIQUE constraint failed: usuario.email');
}
