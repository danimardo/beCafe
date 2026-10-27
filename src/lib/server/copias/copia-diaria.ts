import { eq } from 'drizzle-orm';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { marcarEjecucion, enTransaccion, nuevoId, registrar, type Db, type Reloj } from '#lib/server/plataforma';
import { registrarAviso } from '#lib/server/notificaciones';
import { fechaDeMadrid } from '#lib/shared/fechas/meses';
import type { InstanteUtc } from '#lib/shared/fechas/tipos';
import { copiaSeguridad, type TipoRegistroCopia } from './esquema';
import { ErrorCopia, type CodigoCopia } from './errores';
import { hacerInstantanea } from './instantanea';
import { empaquetar } from './empaquetado';
import type { Subidor } from './subida-s3';
import { construirClave, type TipoCopiaClave } from './dominio/clave-copia';

// Copia diaria (plan F8 D1, D2, D3). La E/S va fuera de transacciones; solo el registro de estado y el aviso van dentro.

export const TAREA_COPIA_DIARIA = 'copia_diaria';

export type DependenciasCopia = {
	db: Db;
	reloj: Reloj;
	directorioDatos: string;
	/** Origen del sistema (`origenDeSistema(ORIGIN)`), que va en la clave de la copia (RF-289). */
	origen: string;
	subir: Subidor;
};

/** Clave del objeto: `becafe/AAAA/MM/becafe-<instante>__<origen>__<tipo>.tar.gz` (plan F17 D2). */
export function claveDeCopia(instante: InstanteUtc, origen: string, tipo: TipoCopiaClave = 'diaria'): string {
	return construirClave({ instante, origen, tipo });
}

/** Ejecuta la copia del día de Madrid. Si ya consta en `ejecucion_tarea`, no hace nada (Clarifications 1). Nunca lanza: un fallo queda en la copia. */
export async function hacerCopiaDiaria(dependencias: DependenciasCopia): Promise<void> {
	const { db, reloj } = dependencias;
	const ahora = reloj.ahora();
	const copiaId = nuevoId();
	const iniciada = enTransaccion(db, (tx) => {
		if (!marcarEjecucion(tx, TAREA_COPIA_DIARIA, fechaDeMadrid(ahora), ahora)) return false;
		tx.insert(copiaSeguridad).values({ id: copiaId, iniciadaEn: ahora, estado: 'en_curso', tipo: 'diaria' }).run();
		return true;
	});
	if (!iniciada) return;
	await ejecutarCopia(dependencias, { copiaId, tipo: 'diaria' });
}

export type ResultadoCopia =
	{ correcta: true; clave: string; tamano: number } | { correcta: false; codigo: CodigoCopia; estadoHttp: number | undefined };

/**
 * Hace, sube y registra la copia `copiaId`, ya insertada como `en_curso` (plan F17 D3). Es el núcleo común de la copia diaria y la manual.
 * Nunca lanza: un fallo deja la copia `fallida` y avisa a los administradores (RF-142).
 */
export async function ejecutarCopia(
	dependencias: DependenciasCopia,
	{ copiaId, tipo }: { copiaId: string; tipo: TipoRegistroCopia },
): Promise<ResultadoCopia> {
	const { db, reloj, directorioDatos, origen, subir } = dependencias;
	const ahora = reloj.ahora();
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
		const clave = claveDeCopia(ahora, origen, tipo);
		await subir({ clave, ruta: archivo, sha256 });
		db.update(copiaSeguridad)
			.set({ estado: 'correcta', finalizadaEn: reloj.ahora(), tamano, sha256, claveObjeto: clave })
			.where(eq(copiaSeguridad.id, copiaId))
			.run();
		registrar('copia.completada', { copiaId, tamano, duracionMs: Date.now() - inicio, tipo, origen });
		return { correcta: true, clave, tamano };
	} catch (causa) {
		const codigo: CodigoCopia = causa instanceof ErrorCopia ? causa.codigo : 'DISCO';
		const estadoHttp = causa instanceof ErrorCopia ? causa.estadoHttp : undefined;
		fallarCopia(dependencias, copiaId, codigo, estadoHttp, tipo);
		return { correcta: false, codigo, estadoHttp };
	} finally {
		await rm(trabajo, { recursive: true, force: true });
		await rm(archivo, { force: true });
	}
}

/** Marca la copia como fallida y avisa a los administradores en la misma transacción (RF-142, CA-142). */
export function fallarCopia(
	{ db, reloj, origen }: Pick<DependenciasCopia, 'db' | 'reloj' | 'origen'>,
	copiaId: string,
	codigo: CodigoCopia,
	estadoHttp: number | undefined,
	tipo: TipoRegistroCopia,
): void {
	const ahora = reloj.ahora();
	enTransaccion(db, (tx) => {
		tx.update(copiaSeguridad)
			.set({ estado: 'fallida', finalizadaEn: ahora, codigoError: codigo, estadoHttp: estadoHttp ?? null })
			.where(eq(copiaSeguridad.id, copiaId))
			.run();
		registrarAviso(tx, { tipo: 'fallo_copia', datos: { copiaId }, origenId: copiaId, instante: ahora });
	});
	registrar('copia.fallida', estadoHttp === undefined ? { copiaId, codigo, tipo, origen } : { copiaId, codigo, estadoHttp, tipo, origen });
}

/**
 * Al arrancar (plan F8 D2): borra los temporales de copias interrumpidas y marca como `INTERRUMPIDA` las que quedaron `en_curso`.
 */
export async function prepararArranqueCopias({
	db,
	reloj,
	directorioDatos,
	origen,
}: Pick<DependenciasCopia, 'db' | 'reloj' | 'directorioDatos' | 'origen'>): Promise<void> {
	await rm(join(directorioDatos, 'tmp'), { recursive: true, force: true });
	const enCurso = db
		.select({ id: copiaSeguridad.id, tipo: copiaSeguridad.tipo })
		.from(copiaSeguridad)
		.where(eq(copiaSeguridad.estado, 'en_curso'))
		.all();
	for (const { id, tipo } of enCurso) fallarCopia({ db, reloj, origen }, id, 'INTERRUMPIDA', undefined, tipo);
}
