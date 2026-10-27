import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { reautenticar, type Actor } from '#lib/server/auth';
import { nuevoId, registrar, type Ambiente } from '#lib/server/plataforma';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { ErrorCopia, ErrorRestauracion, type CodigoRestauracion } from './errores';
import { desempaquetar, empaquetar, sha256De } from './empaquetado';
import { hacerInstantanea } from './instantanea';
import { exigirPermisoCopias } from './permiso';
import { construirClave, leerClave } from './dominio/clave-copia';
import { esquemaClaveCopia, type ClienteS3 } from './subida-s3';
import { verificarCopia } from './verificacion';

// Restauración de una copia desde la aplicación (plan F14 D1, RF-254, RF-255). Aquí solo se PREPARA: la sustitución de los
// datos ocurre al arrancar, con la base cerrada (`aplicar-restauracion.ts`). Un fallo en cualquier paso no deja ningún cambio.

export const SUBDIRECTORIO_RESTAURACION = 'restauracion';
export const ARCHIVO_PENDIENTE = 'pendiente.json';

/** Marca de una restauración preparada. Se valida al leerla en el arranque (constitución VI). */
export const esquemaPendiente = z.strictObject({
	clave: esquemaClaveCopia,
	resguardo: esquemaClaveCopia,
	adminId: z.string().min(1),
	instante: esquemaInstanteUtc,
	/** Identificador de restauración (plan F17 D4). Las marcas anteriores a F17 no lo llevan. */
	restauracionId: z.string().min(1).optional(),
});
export type RestauracionPendiente = z.infer<typeof esquemaPendiente>;

export const esquemaRestaurar = z.strictObject({ clave: esquemaClaveCopia, contrasena: z.string().min(1) });
export type EntradaRestaurar = z.input<typeof esquemaRestaurar>;

/** Clave de la copia de resguardo: `becafe/resguardos/AAAA/MM/becafe-<instante>__<origen>__resguardo.tar.gz`. */
export function claveDeResguardo(instante: string, origen: string): string {
	return construirClave({ instante, origen, tipo: 'resguardo' });
}

function aErrorRestauracion(causa: unknown, fase: 'bucket' | 'resguardo'): unknown {
	if (!(causa instanceof ErrorCopia)) return causa;
	const delBucket = causa.codigo === 'S3_RED' || causa.codigo === 'S3_RESPUESTA' || causa.codigo === 'S3_CREDENCIALES';
	if (delBucket) return new ErrorRestauracion('BUCKET', causa.estadoHttp);
	return new ErrorRestauracion(fase === 'resguardo' ? 'RESGUARDO' : 'DANADA');
}

/** Pasos de una restauración, en orden: el último evento de un fallo nombra el paso que falló (RF-291). */
export const PASOS_RESTAURACION = ['listado', 'resguardo', 'descarga', 'suma', 'verificacion', 'preparacion'] as const;
type PasoRestauracion = (typeof PASOS_RESTAURACION)[number];

/** Ejecuta un paso y emite su duración a nivel `debug`. Deja en `actual` el paso en curso, para nombrarlo si falla. */
async function conPaso<T>(
	actual: { paso: PasoRestauracion },
	restauracionId: string,
	paso: PasoRestauracion,
	trabajo: () => Promise<T>,
): Promise<T> {
	actual.paso = paso;
	const inicio = Date.now();
	const resultado = await trabajo();
	registrar('copia.restauracion_paso', { restauracionId, paso, duracionMs: Date.now() - inicio });
	return resultado;
}

/** Copia del bucket que se va a restaurar, para mostrar su efecto (RF-254). Lanza si no hay S3 o la clave no está en el bucket. */
export async function leerCopiaARestaurar(ambiente: Ambiente, actor: Actor | undefined, clave: string, cliente: ClienteS3) {
	exigirPermisoCopias(ambiente.db, actor);
	if (!ambiente.copias.s3) throw new ErrorRestauracion('SIN_S3');
	try {
		const copia = (await cliente.listar()).find((candidata) => candidata.clave === clave);
		if (!copia) throw new ErrorRestauracion('NO_ENCONTRADA');
		return copia;
	} catch (causa) {
		throw aErrorRestauracion(causa, 'bucket');
	}
}

/**
 * Prepara la restauración de `entrada.clave` (RF-254, RF-255): contraseña, bloqueo de registros, copia de resguardo, descarga y
 * comprobación. Si todo va bien deja la marca `pendiente.json` y pide el reinicio; si falla, no cambia ningún dato.
 */
export async function restaurarCopia(
	ambiente: Ambiente,
	actor: Actor | undefined,
	entrada: EntradaRestaurar,
	cliente: ClienteS3,
): Promise<void> {
	exigirPermisoCopias(ambiente.db, actor);
	const datos = esquemaRestaurar.parse(entrada);
	if (!ambiente.copias.s3) throw new ErrorRestauracion('SIN_S3');
	await reautenticar(ambiente.db, { actor, contrasena: datos.contrasena, instante: ambiente.reloj.ahora() });
	if (ambiente.mantenimiento.restaurando) throw new ErrorRestauracion('EN_CURSO');
	ambiente.mantenimiento.restaurando = true;

	const inicio = Date.now();
	const ahora = ambiente.reloj.ahora();
	const restauracionId = nuevoId();
	const actual: { paso: PasoRestauracion } = { paso: 'listado' };
	const origenSistema = ambiente.copias.origen;
	const origenCopia = leerClave(datos.clave).origen ?? 'desconocido';
	registrar('copia.restauracion_iniciada', { restauracionId, origenCopia, origenSistema });
	const { directorioDatos, carpetaMigraciones } = ambiente.copias;
	const temporales = join(directorioDatos, 'tmp', `restauracion-${Date.now()}`);
	const restauracion = join(directorioDatos, SUBDIRECTORIO_RESTAURACION);
	const preparada = join(restauracion, 'preparada');
	try {
		await conPaso(actual, restauracionId, 'listado', () => leerCopiaARestaurar(ambiente, actor, datos.clave, cliente));
		await mkdir(temporales, { recursive: true });

		// Copia de resguardo del estado actual, subida al bucket antes de tocar nada.
		const resguardo = claveDeResguardo(ahora, origenSistema);
		await conPaso(actual, restauracionId, 'resguardo', async () => {
			const inicioResguardo = Date.now();
			try {
				hacerInstantanea(ambiente.db, join(temporales, 'instantanea.db'));
				const paquete = join(temporales, 'resguardo.tar.gz');
				const { sha256, tamano } = await empaquetar({
					instantanea: join(temporales, 'instantanea.db'),
					directorioFotos: join(directorioDatos, 'fotos'),
					destino: paquete,
				});
				await cliente.subir({ clave: resguardo, ruta: paquete, sha256 });
				registrar('copia.restauracion_resguardo_hecho', { restauracionId, tamano, duracionMs: Date.now() - inicioResguardo });
			} catch (causa) {
				throw aErrorRestauracion(causa, 'resguardo');
			}
		});

		// Descarga y comprobación de la copia elegida: suma, integridad y versión.
		const archivo = join(temporales, 'copia.tar.gz');
		const sumaEsperada = await conPaso(actual, restauracionId, 'descarga', async () => {
			const inicioDescarga = Date.now();
			try {
				const suma = await cliente.descargar(datos.clave, archivo);
				registrar('copia.restauracion_descargada', {
					restauracionId,
					tamano: (await stat(archivo)).size,
					duracionMs: Date.now() - inicioDescarga,
				});
				return suma;
			} catch (causa) {
				throw aErrorRestauracion(causa, 'bucket');
			}
		});
		await conPaso(actual, restauracionId, 'suma', async () => {
			if (sumaEsperada !== null && sumaEsperada !== (await sha256De(archivo))) throw new ErrorRestauracion('DANADA');
		});
		await conPaso(actual, restauracionId, 'verificacion', async () => {
			const resultado = await verificarCopia(archivo, join(carpetaMigraciones, 'meta', '_journal.json')).catch(() =>
				Promise.reject(new ErrorRestauracion('DANADA')),
			);
			registrar('copia.restauracion_verificada', {
				restauracionId,
				integridad: resultado.integridad,
				migracionesCopia: resultado.migracionesAplicadas,
				migracionesSistema: resultado.migracionesEsperadas,
				origenCopia,
				origenSistema,
			});
			if (resultado.integridad !== 'ok') throw new ErrorRestauracion('DANADA');
			if (resultado.migracionesAplicadas > resultado.migracionesEsperadas) throw new ErrorRestauracion('VERSION_NUEVA');
		});

		// Dejarla preparada. La marca es lo último: sin ella, el arranque no aplica nada.
		await conPaso(actual, restauracionId, 'preparacion', async () => {
			await rm(restauracion, { recursive: true, force: true });
			await desempaquetar(archivo, preparada).catch(() => Promise.reject(new ErrorRestauracion('DANADA')));
			const marca: RestauracionPendiente = { clave: datos.clave, resguardo, adminId: actor.usuarioId, instante: ahora, restauracionId };
			await writeFile(join(restauracion, ARCHIVO_PENDIENTE), JSON.stringify(marca));
		});
		registrar('copia.restauracion_preparada', { restauracionId, tamano: (await stat(archivo)).size, duracionMs: Date.now() - inicio });
	} catch (causa) {
		await rm(restauracion, { recursive: true, force: true });
		ambiente.mantenimiento.restaurando = false;
		const { paso } = actual;
		if (causa instanceof ErrorRestauracion) {
			registrar(
				'copia.restauracion_fallida',
				causa.estadoHttp === undefined
					? { restauracionId, paso, codigo: causa.codigo }
					: { restauracionId, paso, codigo: causa.codigo, estadoHttp: causa.estadoHttp },
			);
		} else {
			registrar('copia.restauracion_fallida', { restauracionId, paso, codigo: 'INESPERADO' });
		}
		throw causa;
	} finally {
		await rm(temporales, { recursive: true, force: true });
	}
	// Con la restauración preparada, el bloqueo de registros sigue hasta que el proceso termine (D2).
	ambiente.reiniciar();
}

/** Códigos de rechazo con su estado HTTP y mensaje (contracts/restauracion.md). */
export const ESTADO_RESTAURACION: Record<CodigoRestauracion, number> = {
	SIN_S3: 404,
	NO_ENCONTRADA: 404,
	EN_CURSO: 409,
	BUCKET: 502,
	RESGUARDO: 500,
	DANADA: 422,
	VERSION_NUEVA: 422,
};
