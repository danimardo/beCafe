import { z } from 'zod';
import { esColorPropio } from '#lib/shared/capsulas/color-propio';

export { esColorPropio };

// Contrato del catálogo de tipos de cápsula (RF-001, RF-003, RF-005). Lo usan el formulario y el servidor.

/** Colores fijos que se pueden elegir para un tipo nuevo (RF-269). */
export const COLORES_CAPSULA_ELEGIBLES = [
	'cap-ristretto',
	'cap-lungo',
	'cap-decaf',
	'cap-colombia',
	'cap-vainilla',
	'cap-azul',
	'cap-intenso',
] as const;

/** Color heredado: lo conservan los tipos que ya lo tenían, pero ya no se ofrece (RF-269). */
export const COLOR_CAPSULA_HEREDADO = 'cap-rosa';

/** Todos los tokens que puede tener guardado un tipo. */
export const COLORES_CAPSULA = [...COLORES_CAPSULA_ELEGIBLES, COLOR_CAPSULA_HEREDADO] as const;

export type ColorCapsula = (typeof COLORES_CAPSULA)[number];

/** Valor del radio «Otro color» del formulario: el color real llega en el campo `colorPropio` (RF-269, RF-271). */
export const OPCION_COLOR_PROPIO = 'otro';

function esColorFijo(color: string): color is ColorCapsula {
	return COLORES_CAPSULA.some((fijo) => fijo === color);
}

export const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024;

// Un campo vacío del formulario no es un 0: se trata como ausente y el esquema lo marca como obligatorio o lo omite.
const vacioComoAusente = (valor: unknown) => (valor === '' ? undefined : valor);

// Un archivo sin elegir llega como `File` vacío: se trata como ausente.
const archivoVacioComoAusente = (valor: unknown) => (valor === '' || (valor instanceof File && valor.size === 0) ? undefined : valor);

const campoFoto = z.preprocess(archivoVacioComoAusente, z.file().max(TAMANO_MAXIMO_FOTO).optional());

const campoIntensidad = z.preprocess(vacioComoAusente, z.coerce.number().int().min(1).max(13).optional());

const campoUmbral = z.preprocess(vacioComoAusente, z.coerce.number().int().min(0));

const MENSAJE_COLOR = 'Elige un color de la lista o uno con el selector.';

export const esquemaCapsula = z
	.strictObject({
		nombre: z.string().trim().min(1).max(60),
		marca: z.string().trim().min(1).max(60),
		intensidad: campoIntensidad,
		color: z.string({ error: MENSAJE_COLOR }),
		colorPropio: z.preprocess(vacioComoAusente, z.string().optional()),
		umbralMinimo: campoUmbral,
		foto: campoFoto,
	})
	.transform(({ colorPropio, color, ...resto }, ctx) => {
		// Un token fijo se acepta tal cual; un color propio solo llega con «Otro color» y el valor del selector (RF-271).
		const propio = color === OPCION_COLOR_PROPIO && colorPropio !== undefined && esColorPropio(colorPropio);
		if (!propio && !esColorFijo(color)) {
			ctx.addIssue({ code: 'custom', path: ['color'], message: MENSAJE_COLOR });
			return z.NEVER;
		}
		return { ...resto, color: propio ? colorPropio.toLowerCase() : color };
	});

export type DatosCapsula = z.infer<typeof esquemaCapsula>;

/** Dirección de la foto de un tipo, servida por la aplicación con sesión (constitución V). */
export function urlFotoCapsula(id: string): string {
	return `/fotos/${id}`;
}

// Confirmación de borrado sin JavaScript: el formulario exige marcar la casilla (constitución X).
export const esquemaBorrado = z.strictObject({ confirmo: z.literal('on') });
