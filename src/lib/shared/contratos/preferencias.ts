import { z } from 'zod';
import { TIPOS_DESACTIVABLES } from './push';

// Entrada del formulario de preferencias de avisos (RF-102). Los valores llegan como texto desde el formulario.

export const esquemaPreferencia = z.strictObject({
	tipo: z.enum(TIPOS_DESACTIVABLES),
	activada: z.enum(['si', 'no']).transform((valor) => valor === 'si'),
});
