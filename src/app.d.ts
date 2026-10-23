// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Actor, SesionResuelta } from '#lib/server/auth';
import type { Ambiente } from '#lib/server/plataforma';

declare global {
	namespace App {
		interface Error {
			message: string;
			/** Código de incidencia: el identificador de la operación que falló (constitución XIII). */
			codigo?: string;
		}
		interface Locals {
			ambiente: Ambiente;
			sesion?: SesionResuelta;
			actor?: Actor;
			/** Token de una cookie que ya no da sesión. Solo en memoria: la ruta de consumos lo usa para distinguir una baja (D9). */
			tokenNoValido?: string;
		}
	}

	const __APP_VERSION__: string;
	const __APP_COMMIT__: string;
}

export {};
