import type { Db } from './db/conexion';
import type { Reloj } from './reloj';
import type { Limitador } from './limitador';

/** Lo que reciben los casos de uso del servidor: la base de datos, el reloj, el origen y los límites del registro del cliente. */
export type Ambiente = {
	db: Db;
	reloj: Reloj;
	origen: string;
	limitadorRegistro: Limitador;
	limitadorAvisos: Limitador;
};
