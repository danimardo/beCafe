import { z } from 'zod';
import { TAMANO_MAXIMO_FOTO } from './capsulas';
import { camposEncuadre, encuadreDe, refinarEncuadre } from './encuadre';

// Foto de persona (RF-208): la sube la propia persona en Perfil o un administrador en su ficha. Mismas validaciones que RF-005.

// Un archivo sin elegir llega como `File` vacío: se trata como ausente.
const archivoVacioComoAusente = (valor: unknown) => (valor === '' || (valor instanceof File && valor.size === 0) ? undefined : valor);

/** Subir una foto: el archivo es obligatorio y no pasa de 5 MB. El formato se valida por su contenido en el servidor. */
export const esquemaSubirFotoPersona = z
	.strictObject({
		foto: z.preprocess(archivoVacioComoAusente, z.file().max(TAMANO_MAXIMO_FOTO)),
		...camposEncuadre,
	})
	.superRefine(refinarEncuadre)
	.transform(({ encuadreX, encuadreY, encuadreLado, ...resto }) => ({ ...resto, encuadre: encuadreDe({ encuadreX, encuadreY, encuadreLado }) }));

/** Foto opcional al dar de alta (RF-223): sin archivo, la persona queda sin foto. Mismas validaciones que RF-005. */
export const esquemaFotoAlta = z
	.strictObject({
		foto: z.preprocess(archivoVacioComoAusente, z.file().max(TAMANO_MAXIMO_FOTO).optional()),
		...camposEncuadre,
	})
	.superRefine(refinarEncuadre)
	.transform(({ encuadreX, encuadreY, encuadreLado, ...resto }) => ({ ...resto, encuadre: encuadreDe({ encuadreX, encuadreY, encuadreLado }) }));

/** Quitar la foto: la casilla de confirmación evita un borrado accidental sin JavaScript. */
export const esquemaQuitarFotoPersona = z.strictObject({
	quitar: z.literal('si'),
});

/** Dirección de la foto de una persona, servida por la aplicación con sesión (constitución V). `version` evita la caché tras un cambio. */
export function urlFotoUsuario(id: string, fotoRuta: string): string {
	return `/fotos/usuarios/${id}?v=${fotoRuta.replace(/\.webp$/, '')}`;
}
