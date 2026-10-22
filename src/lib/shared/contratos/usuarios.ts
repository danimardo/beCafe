import { z } from 'zod';
import { esquemaCorreo, esquemaNombre } from './comunes';

// Contratos de la administración de personas (RF-130, RF-134, RF-131, RF-136). Son `strictObject`: un campo extra falla.
// La contraseña actual se pide solo cuando la ventana de reautenticación (RN-050) ha vencido; vacía equivale a ausente.
const ROL = z.enum(['miembro', 'administrador']);
const contrasenaActual = z
	.string()
	.max(256)
	.optional()
	.transform((valor) => (valor ? valor : undefined));

export const esquemaAltaUsuario = z.strictObject({
	nombre: esquemaNombre,
	email: esquemaCorreo,
	rol: ROL,
	contrasenaActual,
});

export const esquemaCambioRol = z.strictObject({ rol: ROL, contrasenaActual });

export const esquemaSoloReautenticacion = z.strictObject({ contrasenaActual });
