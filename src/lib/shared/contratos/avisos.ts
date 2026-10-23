import { z } from 'zod';

// Consulta del panel de avisos (RF-107). Llega en la URL: se valida antes de usarla.

/** `nuevos` es cuántos avisos se acaban de abrir; van primero en la lista (son los más recientes). */
export const esquemaPanelAvisos = z.strictObject({
	nuevos: z.coerce.number().int().nonnegative().max(500).optional(),
});
