import { z } from 'zod';

// Parámetro de la portada que confirma una aceptación (RF-161). Cualquier otro parámetro se rechaza.
export const esquemaAvisoInicio = z.strictObject({
	aviso: z.literal('privacidad-aceptada').optional(),
	// RF-204: «Repetir el tour» desde la ayuda de Inicio.
	tour: z.literal('si').optional(),
});
