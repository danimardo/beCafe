import { cerrarRegistro } from './registro';

// Reinicio del proceso tras preparar una restauración (plan F14 D1, research R2). En producción, Docker o Coolify vuelven a
// arrancar el contenedor y el arranque aplica la restauración con la base cerrada.

/** Espera a que salga la respuesta, cierra la base y el registro, y termina el proceso con código 0. */
export function crearReinicio(cerrarBase: () => void, esperaMs = 1000): () => void {
	return () => {
		setTimeout(() => {
			cerrarBase();
			void cerrarRegistro().finally(() => process.exit(0));
		}, esperaMs);
	};
}
