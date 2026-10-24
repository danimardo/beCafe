import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actor } from '#lib/server/auth';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { ErrorDeNegocio, nuevoId, registrar, type Db, type Ejecutor } from '#lib/server/plataforma';
import { esquemaFechaMadrid, type FechaMadrid, type InstanteUtc } from '#lib/shared/fechas/tipos';
import { fechaDeMadrid } from '#lib/shared/fechas/meses';
import { pruebaRestauracion, RESULTADOS_PRUEBA } from './esquema';

// Pruebas de restauración (plan F8 D5, D6, D12-2 y D12-4; RF-143, RF-144). Solo cuentan para el aviso las pruebas `correcta` (D12-4).

/** Días naturales sin probar a partir de los que se avisa (RF-144, CA-144). */
export const DIAS_SIN_PROBAR = 100;

/** Datos de una prueba anotada, sin nada personal salvo el autor. */
export const esquemaAnotarPrueba = z.strictObject({
	realizadaEl: esquemaFechaMadrid,
	resultado: z.enum(RESULTADOS_PRUEBA),
	notas: z
		.string()
		.trim()
		.max(500, { error: 'Las notas superan los 500 caracteres' })
		.nullish()
		.transform((valor) => (valor ? valor : null)),
});
/** Entrada ya validada o cruda del formulario: `notas` puede llegar vacío o nulo. */
export type EntradaPrueba = { realizadaEl: string; resultado: 'correcta' | 'fallida'; notas?: string | null };

/** Comprueba el rol en la base en cada uso: una persona degradada pierde el acceso en la siguiente consulta (RN-060). */
export function exigirPermisoCopias(db: Ejecutor, actor: Actor | undefined): asserts actor is Actor {
	if (!actor || buscarUsuarioPorId(db, actor.usuarioId)?.rol !== 'administrador') throw new ErrorDeNegocio('SIN_PERMISO');
}

/** Anota una prueba de restauración (RF-143). La fecha no puede ser futura (Clarifications 3). */
export function anotarPruebaRestauracion(
	ambiente: { db: Db; reloj: { ahora(): InstanteUtc } },
	actor: Actor | undefined,
	entrada: EntradaPrueba,
): string {
	exigirPermisoCopias(ambiente.db, actor);
	const datos = esquemaAnotarPrueba.safeParse(entrada);
	if (!datos.success) throw new ErrorDeNegocio('VALIDACION');
	const ahora = ambiente.reloj.ahora();
	if (datos.data.realizadaEl > fechaDeMadrid(ahora)) throw new ErrorDeNegocio('VALIDACION');
	const id = nuevoId();
	ambiente.db
		.insert(pruebaRestauracion)
		.values({
			id,
			adminId: actor.usuarioId,
			realizadaEl: datos.data.realizadaEl,
			resultado: datos.data.resultado,
			notas: datos.data.notas,
			anotadaEn: ahora,
		})
		.run();
	registrar('restauracion.anotada', { pruebaId: id, usuarioId: actor.usuarioId, resultado: datos.data.resultado });
	return id;
}

export type EstadoRestauracion = {
	/** Fecha de la última prueba correcta, o `null` si nunca hubo una. */
	ultimaCorrecta: FechaMadrid | null;
	/** `nunca` (Clarifications 5) o `antigua` (más de 100 días, CA-144); `null` si no hay aviso. */
	aviso: 'nunca' | 'antigua' | null;
};

/** Días naturales entre dos fechas `aaaa-mm-dd`. */
export function diasEntre(desde: FechaMadrid, hasta: FechaMadrid): number {
	return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}

/** Estado del aviso de restauración para el panel de administración (RF-144). Solo administradores. */
export function leerEstadoRestauracion(db: Ejecutor, actor: Actor | undefined, hoy: FechaMadrid): EstadoRestauracion {
	exigirPermisoCopias(db, actor);
	const ultima = db
		.select({ realizadaEl: pruebaRestauracion.realizadaEl })
		.from(pruebaRestauracion)
		.where(eq(pruebaRestauracion.resultado, 'correcta'))
		.orderBy(desc(pruebaRestauracion.realizadaEl))
		.limit(1)
		.get();
	if (!ultima) return { ultimaCorrecta: null, aviso: 'nunca' };
	const fecha = esquemaFechaMadrid.parse(ultima.realizadaEl);
	return { ultimaCorrecta: fecha, aviso: diasEntre(fecha, hoy) > DIAS_SIN_PROBAR ? 'antigua' : null };
}

/** Lista de pruebas anotadas con su autor, la más reciente primero. */
export function leerPruebas(db: Ejecutor, actor: Actor | undefined) {
	exigirPermisoCopias(db, actor);
	return db
		.select({
			id: pruebaRestauracion.id,
			realizadaEl: pruebaRestauracion.realizadaEl,
			resultado: pruebaRestauracion.resultado,
			notas: pruebaRestauracion.notas,
		})
		.from(pruebaRestauracion)
		.orderBy(desc(pruebaRestauracion.realizadaEl))
		.all();
}
