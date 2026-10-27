import type { Db } from './db/conexion';
import type { Reloj } from './reloj';
import type { Limitador } from './limitador';
import type { Azar } from './azar';

/** Bucket S3 de las copias (plan F8 D8). Las claves nunca salen de `copias/subida-s3.ts` ni van al registro. */
export type ConfiguracionS3 = {
	endpoint: string;
	bucket: string;
	region: string;
	claveAcceso: string;
	claveSecreta: string;
};

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
	/** Copias y restauración (plan F8 D8, plan F14 D1). Sin `s3` no hay copia diaria ni restauración. */
	copias: { directorioDatos: string; carpetaMigraciones: string; s3: ConfiguracionS3 | undefined };
	/** Estado del proceso mientras se prepara una restauración (plan F14 D2). Es un objeto del arranque, no estado de módulo. */
	mantenimiento: { restaurando: boolean };
	/** Termina el proceso para que el contenedor lo vuelva a arrancar (plan F14 D1). Las pruebas lo sustituyen. */
	reiniciar: () => void;
};
