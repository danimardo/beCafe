import { z } from 'zod';

// Contrato v1 de la suscripción push (contracts/api-push.md, RF-105). Compartido: el cliente y el servidor lo validan.

/** Tipos de aviso que el servidor puede enviar. Es la lista del catálogo de `notificaciones`. */
export const TIPOS_NOTIFICACION = ['stock_bajo', 'stock_negativo', 'hucha_negativa', 'deuda', 'resumen_mensual', 'fallo_copia'] as const;

/** Tipos que la persona puede desactivar. `deuda` siempre llega (RF-102). */
export const TIPOS_DESACTIVABLES = ['stock_bajo', 'stock_negativo', 'hucha_negativa', 'resumen_mensual', 'fallo_copia'] as const;

const esquemaEndpoint = z.url({ protocol: /^https$/ }).max(1000);

export const esquemaSuscripcion = z.strictObject({
	version: z.literal(1),
	endpoint: esquemaEndpoint,
	claves: z.strictObject({
		p256dh: z.string().min(1).max(200),
		auth: z.string().min(1).max(100),
	}),
});

export const esquemaBajaSuscripcion = z.strictObject({
	version: z.literal(1),
	endpoint: esquemaEndpoint,
});

/** Mensaje que el servidor envía al service worker. El service worker lo valida antes de mostrarlo (contrato). */
export const esquemaMensajePush = z.strictObject({
	version: z.literal(1),
	tipo: z.enum(TIPOS_NOTIFICACION),
	titulo: z.string(),
	texto: z.string(),
	enlace: z.string().startsWith('/'),
});

export type EntradaSuscripcion = z.infer<typeof esquemaSuscripcion>;
