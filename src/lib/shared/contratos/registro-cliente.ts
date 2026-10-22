import { z } from 'zod';

// Contrato `/api/registro-cliente`, versión 1 (contracts/api.md, constitución XIV). Un cambio de forma crea una versión nueva.
const esquemaEventoCliente = z.discriminatedUnion('codigo', [
	z.strictObject({
		codigo: z.literal('dato.invalido'),
		instante: z.iso.datetime(),
		campos: z.strictObject({
			origen: z.string().max(40),
			id: z.string().max(80).optional(),
			campo: z.string().max(80),
			incidencia: z.string().max(80),
		}),
	}),
	z.strictObject({
		codigo: z.literal('cliente.error_no_previsto'),
		instante: z.iso.datetime(),
		campos: z.strictObject({ tipo: z.string().max(80), pila: z.string().max(4000) }),
	}),
]);

export const esquemaRegistroCliente = z.strictObject({
	version: z.literal(1),
	eventos: z.array(esquemaEventoCliente).min(1).max(10),
});

export type RegistroCliente = z.infer<typeof esquemaRegistroCliente>;
