import type { CodigoCopia } from '../errores';
import type { TipoCopiaClave } from './clave-copia';

// Listado único de copias de seguridad (RF-253, CAMBIO-030). Función pura: no lee base de datos, bucket ni reloj.

/** Máximo de copias que muestra la pantalla. */
export const LIMITE_COPIAS_LISTADO = 30;
/** Copias por página. */
export const COPIAS_POR_PAGINA = 8;

type EntradaBucket = {
	clave: string;
	tamano: number;
	modificadaEn: string;
	resguardo: boolean;
	origen: string | null;
	tipo: TipoCopiaClave;
};

type EntradaLocal = {
	id: string;
	iniciadaEn: string;
	estado: 'en_curso' | 'correcta' | 'fallida';
	tipo: TipoCopiaClave;
	codigoError: CodigoCopia | null;
};

/** Una fila del listado. Con `clave === null` es una copia fallida: no existe en el bucket y no ofrece botones. */
export type FilaCopia = {
	id: string;
	clave: string | null;
	instante: string;
	tamano: number | null;
	tipo: TipoCopiaClave;
	resguardo: boolean;
	origen: string | null;
	fallida: boolean;
	codigoError: CodigoCopia | null;
};

export type PaginaCopias = { filas: FilaCopia[]; pagina: number; paginas: number; total: number };

/**
 * Une las copias del bucket con las locales fallidas, de la más reciente a la más antigua.
 * Una copia local correcta ya está en el bucket y una en curso aún no es una copia: ninguna sale aparte.
 * La página pedida se acota al rango existente.
 */
export function unificarCopias(entrada: { bucket: EntradaBucket[]; locales: EntradaLocal[]; pagina: number }): PaginaCopias {
	const delBucket: FilaCopia[] = entrada.bucket.map((copia) => ({
		id: copia.clave,
		clave: copia.clave,
		instante: copia.modificadaEn,
		tamano: copia.tamano,
		tipo: copia.tipo,
		resguardo: copia.resguardo,
		origen: copia.origen,
		fallida: false,
		codigoError: null,
	}));
	const fallidas: FilaCopia[] = entrada.locales
		.filter((copia) => copia.estado === 'fallida')
		.map((copia) => ({
			id: copia.id,
			clave: null,
			instante: copia.iniciadaEn,
			tamano: null,
			tipo: copia.tipo,
			resguardo: false,
			origen: null,
			fallida: true,
			codigoError: copia.codigoError,
		}));
	const todas = [...delBucket, ...fallidas]
		.sort((a, b) => (a.instante < b.instante ? 1 : a.instante > b.instante ? -1 : 0))
		.slice(0, LIMITE_COPIAS_LISTADO);
	const paginas = Math.max(1, Math.ceil(todas.length / COPIAS_POR_PAGINA));
	const pagina = Math.min(Math.max(1, Math.trunc(entrada.pagina) || 1), paginas);
	const desde = (pagina - 1) * COPIAS_POR_PAGINA;
	return { filas: todas.slice(desde, desde + COPIAS_POR_PAGINA), pagina, paginas, total: todas.length };
}
