import type { Db } from './db/conexion';
import type { Reloj } from './reloj';
import type { Limitador } from './limitador';
import type { Azar } from './azar';

/** Lo que reciben los casos de uso del servidor: la base de datos, el reloj, el origen y los límites del registro del cliente. */
export type Ambiente = {
	db: Db;
	reloj: Reloj;
	origen: string;
	/** Carpeta de las fotos de los tipos de cápsula (`/data/fotos`, constitución V). */
	directorioFotos: string;
	limitadorRegistro: Limitador;
	limitadorAvisos: Limitador;
	/** Cafés de visitante por visita (plan F10 D3, research R11): protección ante un enlace filtrado, no un máximo de cafés. */
	limitadorVisitantes: Limitador;
	/** Azar del reparto de céntimos (RN-014). Las pruebas lo sustituyen por uno fijo. */
	azar: Azar;
	/** Hay bucket S3 configurado: la copia diaria está registrada (plan F8 D8). */
	s3Activa: boolean;
};
