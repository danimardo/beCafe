import { z } from 'zod';

// Zona de encuadre de una foto (RF-273, RF-274, DEC-137). No se guarda: el servidor la usa para recortar y la descarta.
// Todas las medidas son fracciones de la foto ya orientada: x del ancho, y del alto y lado del lado menor.

export type Encuadre = { readonly x: number; readonly y: number; readonly lado: number };

const MENSAJE_ENCUADRE = 'La zona elegida no cabe en la foto. Vuelve a encuadrarla.';

const vacioComoAusente = (valor: unknown) => (valor === '' ? undefined : valor);

const fraccion = z.preprocess(vacioComoAusente, z.coerce.number({ error: MENSAJE_ENCUADRE }).min(0).max(1).optional());
const fraccionPositiva = z.preprocess(vacioComoAusente, z.coerce.number({ error: MENSAJE_ENCUADRE }).gt(0).max(1).optional());

/** Campos del encuadre para incorporar a un `z.strictObject` de formulario. */
export const camposEncuadre = {
	encuadreX: fraccion,
	encuadreY: fraccion,
	encuadreLado: fraccionPositiva,
};

type DatosEncuadre = { encuadreX?: number | undefined; encuadreY?: number | undefined; encuadreLado?: number | undefined };

/** Los tres campos llegan juntos o ninguno. Úsalo en `superRefine` del esquema que incorpora `camposEncuadre`. */
export function refinarEncuadre(datos: DatosEncuadre, ctx: z.RefinementCtx): void {
	const presentes = [datos.encuadreX, datos.encuadreY, datos.encuadreLado].filter((valor) => valor !== undefined).length;
	if (presentes !== 0 && presentes !== 3) ctx.addIssue({ code: 'custom', path: ['encuadreX'], message: MENSAJE_ENCUADRE });
}

/** La zona del formulario, o `undefined` si no hay (sin JavaScript): entonces el servidor recorta el centro. */
export function encuadreDe(datos: DatosEncuadre): Encuadre | undefined {
	const { encuadreX: x, encuadreY: y, encuadreLado: lado } = datos;
	return x === undefined || y === undefined || lado === undefined ? undefined : { x, y, lado };
}
