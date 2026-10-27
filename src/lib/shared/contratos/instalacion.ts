import { z } from 'zod';

// Estado de instalación que el navegador envía al servidor (F16, RF-279). Un valor fuera de la lista se rechaza.
export const ESTADOS_INSTALACION = ['instalada', 'rechazada'] as const;

export const esquemaRegistrarInstalacion = z.strictObject({ estado: z.enum(ESTADOS_INSTALACION) });
