import { z } from 'zod';

// Tipos de fecha de los contratos y del dominio (constitución V; ARCHITECTURE.md §6.1). `Date` no entra en ellos.

/** Instante UTC en ISO 8601, con la letra Z (`2026-10-21T09:30:00.000Z`). */
export const esquemaInstanteUtc = z.iso.datetime({ error: 'El instante debe ir en UTC (ISO 8601)' }).brand<'InstanteUtc'>();
export type InstanteUtc = z.infer<typeof esquemaInstanteUtc>;

/** Fecha de calendario de Europe/Madrid (`2026-10-21`). */
export const esquemaFechaMadrid = z.iso.date({ error: 'La fecha debe tener el formato aaaa-mm-dd' }).brand<'FechaMadrid'>();
export type FechaMadrid = z.infer<typeof esquemaFechaMadrid>;

/** Mes natural (`2026-10`). */
export const esquemaMes = z
	.string({ error: 'El mes debe tener el formato aaaa-mm' })
	.regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error: 'El mes debe tener el formato aaaa-mm' })
	.brand<'Mes'>();
export type Mes = z.infer<typeof esquemaMes>;

/** Convierte un `Date` real en el tipo del proyecto. Lo usan solo el reloj y los bordes, nunca el dominio. */
export function instanteDesdeFecha(fecha: Date): InstanteUtc {
	return esquemaInstanteUtc.parse(fecha.toISOString());
}
