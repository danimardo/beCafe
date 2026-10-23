import { z } from 'zod';

// Contrato del catálogo de tipos de cápsula (RF-001, RF-003, RF-005). Lo usan el formulario y el servidor.

export const COLORES_CAPSULA = [
	'cap-ristretto',
	'cap-lungo',
	'cap-decaf',
	'cap-colombia',
	'cap-vainilla',
	'cap-azul',
	'cap-rosa',
	'cap-intenso',
] as const;

export type ColorCapsula = (typeof COLORES_CAPSULA)[number];

export const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024;

// Un campo vacío del formulario no es un 0: se trata como ausente y el esquema lo marca como obligatorio o lo omite.
const vacioComoAusente = (valor: unknown) => (valor === '' ? undefined : valor);

// Un archivo sin elegir llega como `File` vacío: se trata como ausente.
const archivoVacioComoAusente = (valor: unknown) => (valor === '' || (valor instanceof File && valor.size === 0) ? undefined : valor);

const campoFoto = z.preprocess(archivoVacioComoAusente, z.file().max(TAMANO_MAXIMO_FOTO).optional());

const campoIntensidad = z.preprocess(vacioComoAusente, z.coerce.number().int().min(1).max(13).optional());

const campoUmbral = z.preprocess(vacioComoAusente, z.coerce.number().int().min(0));

export const esquemaCapsula = z.strictObject({
	nombre: z.string().trim().min(1).max(60),
	marca: z.string().trim().min(1).max(60),
	intensidad: campoIntensidad,
	color: z.enum(COLORES_CAPSULA),
	umbralMinimo: campoUmbral,
	foto: campoFoto,
});

export type DatosCapsula = z.infer<typeof esquemaCapsula>;

/** Dirección de la foto de un tipo, servida por la aplicación con sesión (constitución V). */
export function urlFotoCapsula(id: string): string {
	return `/fotos/${id}`;
}

// Confirmación de borrado sin JavaScript: el formulario exige marcar la casilla (constitución X).
export const esquemaBorrado = z.strictObject({ confirmo: z.literal('on') });
