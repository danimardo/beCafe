import { z } from 'zod';

// Esquemas reutilizables de los contratos (ARCHITECTURE.md §6.1). Los mensajes van en español.

/** ULID en Crockford base32: 26 caracteres. */
export const esquemaUlid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, { error: 'Identificador no válido' });

/** Correo normalizado: sin espacios y en minúsculas. */
export const esquemaCorreo = z
	.string({ error: 'Escribe un correo' })
	.trim()
	.pipe(z.email({ error: 'Escribe un correo válido, como nombre@ejemplo.es' }))
	.transform((correo) => correo.toLowerCase());

/** Nombre visible: de 1 a 80 caracteres tras quitar los espacios de los extremos. */
export const esquemaNombre = z
	.string({ error: 'Escribe un nombre' })
	.trim()
	.min(1, { error: 'Escribe un nombre' })
	.max(80, { error: 'El nombre no puede tener más de 80 caracteres' });
