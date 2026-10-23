import { z } from 'zod';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { esquemaUlid } from './comunes';

// Contratos de los consumos (RF-011 a RF-019, RF-063; contracts/api-consumos.md). Los usan el formulario, la API de la
// cola sin conexión, el servidor y el propio cliente al leer su cola. Cada versión nueva se añade a la unión (constitución XIV).

/** Cuerpo de `POST /api/consumos`, versión 1. Una clave desconocida o una versión distinta no se aceptan. */
export const esquemaConsumoV1 = z.strictObject({
	version: z.literal(1),
	clienteId: esquemaUlid,
	tipoCapsulaId: esquemaUlid,
	invitado: z.boolean(),
	horaGesto: esquemaInstanteUtc,
});

export const esquemaConsumoApi = z.discriminatedUnion('version', [esquemaConsumoV1]);

export type ConsumoApi = z.infer<typeof esquemaConsumoApi>;

/** Elemento guardado en la cola local (IndexedDB). Sin nombres ni importes (constitución V). */
export const esquemaElementoCola = z.strictObject({
	version: z.literal(1),
	clienteId: esquemaUlid,
	usuarioId: esquemaUlid,
	tipoCapsulaId: esquemaUlid,
	invitado: z.boolean(),
	horaGesto: esquemaInstanteUtc,
	estado: z.enum(['pendiente', 'rechazado']),
	codigo: z.string().max(40).optional(),
});

export type ElementoCola = z.infer<typeof esquemaElementoCola>;

/** Campos del botón «toque» de la pantalla principal. Sin JavaScript, `horaGesto` no llega y lo fija el servidor. */
export const esquemaConsumirForm = z.strictObject({
	clienteId: esquemaUlid,
	tipoCapsulaId: esquemaUlid,
	invitado: z.enum(['0', '1'], { error: 'Elige si el consumo es para un invitado' }),
	horaGesto: esquemaInstanteUtc.optional(),
});

export const esquemaDeshacerForm = z.strictObject({
	consumoId: esquemaUlid,
});

/** Respuesta de un consumo registrado o recibido de nuevo (`duplicado`). `precio` en céntimos. */
export const esquemaRespuestaConsumo = z.strictObject({
	id: esquemaUlid,
	precio: z.number().int().min(0),
	descuadre: z.boolean(),
});

export type RespuestaConsumo = z.infer<typeof esquemaRespuestaConsumo>;
