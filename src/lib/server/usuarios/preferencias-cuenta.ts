import { eq } from 'drizzle-orm';
import { CLAVES_CUENTA, preferenciaCuenta } from './esquema';
import { registrar, type Ambiente, type Ejecutor } from '#lib/server/plataforma';

// Marcas de la cuenta (plan F10 D8 y D9; RF-204, RF-206, RF-207). Se guardan en el servidor para que el tour visto,
// la tarjeta de instalación descartada y la oferta de avisos vista sigan a la persona en todos sus dispositivos.

export type ClaveCuenta = (typeof CLAVES_CUENTA)[number];
export type MarcasCuenta = { tourInicioVisto: boolean; instalacionDescartada: boolean; ofertaAvisosVista: boolean };

export function leerMarcasCuenta(db: Ejecutor, usuarioId: string): MarcasCuenta {
	const claves = new Set(
		db
			.select({ clave: preferenciaCuenta.clave })
			.from(preferenciaCuenta)
			.where(eq(preferenciaCuenta.usuarioId, usuarioId))
			.all()
			.map((fila) => fila.clave),
	);
	return {
		tourInicioVisto: claves.has('tour_inicio_visto'),
		instalacionDescartada: claves.has('instalacion_descartada'),
		ofertaAvisosVista: claves.has('oferta_avisos_vista'),
	};
}

/** Marca una clave de la cuenta. Repetirlo no cambia nada: conserva el instante de la primera vez. */
export function marcarCuenta(ambiente: Ambiente, usuarioId: string, clave: ClaveCuenta): void {
	ambiente.db.insert(preferenciaCuenta).values({ usuarioId, clave, valorEn: ambiente.reloj.ahora() }).onConflictDoNothing().run();
	registrar('cuenta.marcada', { usuarioId, clave });
}
