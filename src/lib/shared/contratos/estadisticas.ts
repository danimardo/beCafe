import { z } from 'zod';
import { esquemaMes } from '#lib/shared/fechas/tipos';

// Consultas de `/historial` y de `/estadisticas` (contracts/rutas.md de F5). Son `GET`: la entrada llega de la URL.
// Rechazan claves desconocidas (constitución VI) y usan `coerce` solo con `int` y un mínimo.

/** Consulta del historial: `quien`, `tipo`, `anulados` y `pagina` (20 registros por página). */
export const esquemaConsultaHistorial = z.strictObject({
	quien: z.enum(['todo', 'mios']).default('todo'),
	tipo: z.enum(['todos', 'consumos', 'aportaciones', 'compras', 'control', 'rellenos']).default('todos'),
	anulados: z.literal('on').optional(),
	pagina: z.coerce.number().int().min(1).default(1),
});

/** Consulta de las estadísticas: `vista`, `periodo` y el mes o el año del periodo. */
export const esquemaConsultaEstadisticas = z.strictObject({
	vista: z.enum(['mias', 'equipo']).default('mias'),
	periodo: z.enum(['mes', 'anio', 'todo']).default('mes'),
	mes: esquemaMes.optional(),
	anio: z.coerce.number().int().min(2026).optional(),
});

export type ConsultaHistorial = z.infer<typeof esquemaConsultaHistorial>;
export type ConsultaEstadisticas = z.infer<typeof esquemaConsultaEstadisticas>;
