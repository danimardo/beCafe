import { ErrorDeNegocio, type Ejecutor } from '#lib/server/plataforma';
import { leerTipo } from './datos';

// Lectura de la foto de un tipo (RF-005, constitución V). Solo con sesión: el caso de uso lo comprueba aquí.
// Recibe la sesión con forma (`usuarioId`) para no importar `auth`: `catalogo` no depende de `auth` (ARCHITECTURE.md §4).
export function leerFotoCapsula(db: Ejecutor, actor: { usuarioId: string } | undefined, id: string): string | null | undefined {
	if (!actor) throw new ErrorDeNegocio('SIN_SESION');
	return leerTipo(db, id)?.fotoRuta;
}
