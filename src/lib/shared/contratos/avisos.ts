import { z } from 'zod';
import { esquemaUlid } from './comunes';

// Consulta del panel de avisos (RF-107). Llega en la URL: se valida antes de usarla.

/** `nuevos` es cuántos avisos se acaban de abrir; van primero en la lista (son los más recientes). */
export const esquemaPanelAvisos = z.strictObject({
	nuevos: z.coerce.number().int().nonnegative().max(500).optional(),
});

/** «Entendido» en el aviso de recuento de Inicio (RF-246): marca ese aviso como visto. */
export const esquemaVerAviso = z.strictObject({ avisoId: esquemaUlid });
