import { z } from 'zod';
import { parseMoney } from '#lib/shared/dinero';
import { esquemaUlid } from './comunes';
import { TAMANO_MAXIMO_FOTO } from './capsulas';

// Contratos de las acciones de `economia` (contracts/rutas.md §Esquemas). Lo usan los formularios y el servidor.
// Los importes llegan como texto del formulario y se guardan como céntimos enteros (RN-020, constitución IV).

/** Texto de un importe en euros → céntimos enteros. Rechaza más de dos decimales y los valores no numéricos. */
export const esquemaImporte = z.string({ error: 'Escribe un importe en euros, como 17,50' }).transform((texto, ctx) => {
	const centimos = parseMoney(texto);
	if (centimos === null) {
		ctx.addIssue({ code: 'custom', message: 'Escribe un importe en euros, como 17,50' });
		return z.NEVER;
	}
	return centimos;
});

const MAXIMO_APORTACION = 50_000;
/** Tope del contador de cada tipo en la compra (RF-197). */
export const MAXIMO_CANTIDAD = 999;

/** Un archivo sin elegir llega como `File` vacío: se trata como ausente (igual que en `capsulas`). */
const archivoVacioComoAusente = (valor: unknown) => (valor === '' || (valor instanceof File && valor.size === 0) ? undefined : valor);

const campoFotoTicket = z.preprocess(archivoVacioComoAusente, z.file().max(TAMANO_MAXIMO_FOTO).optional());

/** Checkbox de un formulario sin JavaScript: marcado llega como «on»; sin marcar, no llega. */
const casilla = z.literal('on').optional();

export const esquemaAportacion = z.strictObject({
	clienteId: esquemaUlid,
	importe: esquemaImporte.pipe(
		z
			.number()
			.int()
			.min(1, { error: 'La aportación debe ser mayor que 0 €' })
			.max(MAXIMO_APORTACION, { error: 'La aportación no puede superar 500 €' }),
	),
});

export const esquemaLineaCompra = z.strictObject({
	tipoCapsulaId: esquemaUlid,
	cantidad: z.coerce
		.number()
		.int()
		.positive({ error: 'La cantidad debe ser al menos 1' })
		.max(MAXIMO_CANTIDAD, { error: 'La cantidad no puede superar 999' }),
	importe: esquemaImporte,
});

/**
 * Las líneas llegan como tres listas paralelas (`tipo[]`, `cantidad[]`, `importe[]`) y se normalizan por posición.
 * La cuadrícula envía todos los tipos: las líneas con cantidad vacía o 0 se descartan (RF-197).
 */
export function lineasDesdeFormulario(tipos: readonly string[], cantidades: readonly string[], importes: readonly string[]) {
	return tipos
		.map((tipoCapsulaId, indice) => ({
			tipoCapsulaId,
			cantidad: (cantidades[indice] ?? '').trim(),
			importe: importes[indice] ?? '',
		}))
		.filter((linea) => linea.cantidad !== '' && Number(linea.cantidad) !== 0);
}

export const esquemaCompra = z
	.strictObject({
		clienteId: esquemaUlid,
		lineas: z.array(esquemaLineaCompra).min(1, { error: 'Sube la cantidad de al menos un tipo' }),
		foto: campoFotoTicket,
		// RF-198: «Registrar igualmente» envía la confirmación con el saldo que la persona vio.
		confirmarHuchaNegativa: z.literal('si').optional(),
		saldoConfirmado: z.coerce.number().int().optional(),
	})
	.refine((datos) => datos.confirmarHuchaNegativa === undefined || datos.saldoConfirmado !== undefined, {
		error: 'Falta el saldo confirmado',
		path: ['saldoConfirmado'],
	});

export const esquemaAnulacion = z.strictObject({
	motivo: z
		.string({ error: 'Escribe el motivo de la anulación' })
		.trim()
		.min(1, { error: 'Escribe el motivo de la anulación' })
		.max(200, { error: 'El motivo no puede tener más de 200 caracteres' }),
});

/** Importe contado de la hucha (texto en euros, como cualquier importe de la interfaz). */
export const esquemaContadoArqueo = esquemaImporte.pipe(z.number().int().min(0, { error: 'El importe contado no puede ser negativo' }));

export const esquemaArqueo = z.strictObject({
	contado: esquemaContadoArqueo,
	contadoPrevisto: z.coerce.number().int(),
	saldoTeoricoPrevisto: z.coerce.number().int(),
	contrasenaActual: z.string().min(1, { error: 'Escribe tu contraseña' }).optional(),
});

/** Líneas de un recuento: unidades de cada tipo. Las cápsulas se cuentan en unidades, no en importes. */
export const esquemaLineasRecuento = z
	.array(
		z.strictObject({
			tipoCapsulaId: esquemaUlid,
			contado: z.coerce.number().int().min(0, { error: 'El recuento no puede ser negativo' }),
			registradoPrevisto: z.coerce.number().int(),
		}),
	)
	.min(1, { error: 'Cuenta al menos un tipo' });

export const esquemaRecuento = z.strictObject({
	lineas: esquemaLineasRecuento,
	contrasenaActual: z.string().min(1, { error: 'Escribe tu contraseña' }).optional(),
});

/** Líneas de recuento desde los campos repetidos del formulario (`tipoCapsulaId[]`, `contado[]`, `registradoPrevisto[]`). */
export function lineasRecuentoDesdeFormulario(tipos: readonly string[], contados: readonly string[], previstos: readonly string[]) {
	return tipos.map((tipoCapsulaId, indice) => ({
		tipoCapsulaId,
		contado: contados[indice] ?? '',
		registradoPrevisto: previstos[indice] ?? '',
	}));
}

export const esquemaBaja = z.strictObject({
	modo: z.enum(['ninguna', 'pago', 'devolucion', 'incobrable'], { error: 'Elige qué hacer con el saldo' }),
	saldoPrevisto: z.coerce.number().int(),
	confirmoHuchaNegativa: casilla,
	contrasenaActual: z.string().min(1, { error: 'Escribe tu contraseña' }).optional(),
});

/** Anulación de un arqueo o de una línea de recuento desde el control (RF-064, CA-064). */
export const esquemaAnulacionControl = z.strictObject({
	id: esquemaUlid,
	motivo: esquemaAnulacion.shape.motivo,
	contrasenaActual: z.string().min(1, { error: 'Escribe tu contraseña' }).optional(),
});
