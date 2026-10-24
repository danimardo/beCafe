import { eq } from 'drizzle-orm';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { marcarEjecucion, enTransaccion, nuevoId, registrar, type Db, type Reloj } from '#lib/server/plataforma';
import { registrarAviso } from '#lib/server/notificaciones';
import { fechaDeMadrid } from '#lib/shared/fechas/meses';
import type { InstanteUtc } from '#lib/shared/fechas/tipos';
import { copiaSeguridad } from './esquema';
import { ErrorCopia, type CodigoCopia } from './errores';
import { hacerInstantanea } from './instantanea';
import { empaquetar } from './empaquetado';
import type { Subidor } from './subida-s3';

// Copia diaria (plan F8 D1, D2, D3). La E/S va fuera de transacciones; solo el registro de estado y el aviso van dentro.

export const TAREA_COPIA_DIARIA = 'copia_diaria';

export type DependenciasCopia = {
	db: Db;
	reloj: Reloj;
	directorioDatos: string;
	subir: Subidor;
};

/** Clave del objeto: `becafe/AAAA/MM/becafe-<instante>.tar.gz`. Los dos puntos del instante se cambian por guiones. */
export function claveDeCopia(instante: InstanteUtc): string {
	const fecha = instante.slice(0, 10);
	const anio = fecha.slice(0, 4);
	const mes = fecha.slice(5, 7);
	return `becafe/${anio}/${mes}/becafe-${instante.replaceAll(':', '-')}.tar.gz`;
}

/** Ejecuta la copia del día de Madrid. Si ya consta en `ejecucion_tarea`, no hace nada (Clarifications 1). Nunca lanza: un fallo queda en la copia. */
export async function hacerCopiaDiaria(dependencias: DependenciasCopia): Promise<void> {
	const { db, reloj, directorioDatos, subir } = dependencias;
	const ahora = reloj.ahora();
	const copiaId = nuevoId();
	const iniciada = enTransaccion(db, (tx) => {
		if (!marcarEjecucion(tx, TAREA_COPIA_DIARIA, fechaDeMadrid(ahora), ahora)) return false;
		tx.insert(copiaSeguridad).values({ id: copiaId, iniciadaEn: ahora, estado: 'en_curso' }).run();
		return true;
	});
	if (!iniciada) return;

	const temporales = join(directorioDatos, 'tmp');
	const trabajo = join(temporales, `copia-${copiaId}`);
	const archivo = `${trabajo}.tar.gz`;
	const inicio = Date.now();
	await mkdir(temporales, { recursive: true });
	try {
		await mkdir(trabajo, { recursive: true });
		hacerInstantanea(db, join(trabajo, 'instantanea.db'));
		const { tamano, sha256 } = await empaquetar({
			instantanea: join(trabajo, 'instantanea.db'),
			directorioFotos: join(directorioDatos, 'fotos'),
			destino: archivo,
		});
		const clave = claveDeCopia(ahora);
		await subir({ clave, ruta: archivo, sha256 });
		db.update(copiaSeguridad)
			.set({ estado: 'correcta', finalizadaEn: reloj.ahora(), tamano, sha256, claveObjeto: clave })
			.where(eq(copiaSeguridad.id, copiaId))
			.run();
		registrar('copia.completada', { copiaId, tamano, duracionMs: Date.now() - inicio });
	} catch (causa) {
		const codigo: CodigoCopia = causa instanceof ErrorCopia ? causa.codigo : 'DISCO';
		const estadoHttp = causa instanceof ErrorCopia ? causa.estadoHttp : undefined;
		fallarCopia(dependencias, copiaId, codigo, estadoHttp);
	} finally {
		await rm(trabajo, { recursive: true, force: true });
		await rm(archivo, { force: true });
	}
}

/** Marca la copia como fallida y avisa a los administradores en la misma transacción (RF-142, CA-142). */
export function fallarCopia(
	{ db, reloj }: Pick<DependenciasCopia, 'db' | 'reloj'>,
	copiaId: string,
	codigo: CodigoCopia,
	estadoHttp: number | undefined,
): void {
	const ahora = reloj.ahora();
	enTransaccion(db, (tx) => {
		tx.update(copiaSeguridad)
			.set({ estado: 'fallida', finalizadaEn: ahora, codigoError: codigo, estadoHttp: estadoHttp ?? null })
			.where(eq(copiaSeguridad.id, copiaId))
			.run();
		registrarAviso(tx, { tipo: 'fallo_copia', datos: { copiaId }, origenId: copiaId, instante: ahora });
	});
	registrar('copia.fallida', estadoHttp === undefined ? { copiaId, codigo } : { copiaId, codigo, estadoHttp });
}

/**
 * Al arrancar (plan F8 D2): borra los temporales de copias interrumpidas y marca como `INTERRUMPIDA` las que quedaron `en_curso`.
 */
export async function prepararArranqueCopias({
	db,
	reloj,
	directorioDatos,
}: Pick<DependenciasCopia, 'db' | 'reloj' | 'directorioDatos'>): Promise<void> {
	await rm(join(directorioDatos, 'tmp'), { recursive: true, force: true });
	const enCurso = db.select({ id: copiaSeguridad.id }).from(copiaSeguridad).where(eq(copiaSeguridad.estado, 'en_curso')).all();
	for (const { id } of enCurso) fallarCopia({ db, reloj }, id, 'INTERRUMPIDA', undefined);
}
