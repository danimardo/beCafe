import { z } from 'zod';
import { esquemaUlid } from './comunes';

// Entradas de los formularios de rellenos de agua (plan F8, contracts/rutas.md). Compartidas: el servidor las valida.

export const esquemaRellenar = z.strictObject({ clienteId: esquemaUlid });

export const esquemaDeshacerRelleno = z.strictObject({ rellenoId: esquemaUlid });

export const esquemaAnulacionRelleno = z.strictObject({
	motivo: z.string().trim().min(1).max(200),
});
