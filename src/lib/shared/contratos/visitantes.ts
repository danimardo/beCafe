import { z } from 'zod';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { esquemaUlid } from './comunes';
import { esquemaAnulacion } from './economia';

// Contratos de los visitantes (plan F10, contracts/formularios.md; RF-189 a RF-193, RF-210). Toda entrada de ruta
// rechaza claves desconocidas (constitución VI). Los mensajes no incluyen el valor recibido.

/** Nombre del visitante: de 1 a 60 caracteres tras quitar los espacios de los extremos (data-model, `visita.nombre`). */
export const esquemaNombreVisitante = z
	.string({ error: 'Escribe tu nombre' })
	.trim()
	.min(1, { error: 'Escribe tu nombre' })
	.max(60, { error: 'El nombre no puede tener más de 60 caracteres' });

/** Token de la URL o de la cookie: base64url de 32 bytes (43 caracteres). */
export const esquemaTokenVisitante = z.string().regex(/^[A-Za-z0-9_-]{43}$/, { error: 'Enlace no válido' });

export const esquemaEntrarVisita = z.strictObject({
	nombre: esquemaNombreVisitante,
	privacidad: z.literal('si', { error: 'Lee el texto de privacidad y marca la casilla para continuar' }),
});

/** Toque del visitante. Sin JavaScript, `horaGesto` no llega y lo fija el servidor. */
export const esquemaCafeVisitanteForm = z.strictObject({
	clienteId: esquemaUlid,
	tipoCapsulaId: esquemaUlid,
	horaGesto: esquemaInstanteUtc.optional(),
});

export const esquemaRevocarEnlace = z.strictObject({ enlaceId: esquemaUlid });

export const esquemaRevisarCafes = z.strictObject({
	ids: z.array(esquemaUlid).min(1, { error: 'Marca al menos un café' }).max(100, { error: 'Revisa como máximo 100 cafés de una vez' }),
	decision: z.enum(['aprobar', 'rechazar'], { error: 'Elige aprobar o rechazar' }),
});

export const esquemaAnularCafeVisitante = z.strictObject({ id: esquemaUlid, motivo: esquemaAnulacion.shape.motivo });

export const esquemaEliminarNombre = z.strictObject({
	visitaId: esquemaUlid,
	confirmar: z.literal('si', { error: 'Confirma que quieres eliminar el nombre' }),
});

/** Pestaña de la pantalla de revisión (`<form method="get">`). */
export const esquemaVistaVisitantes = z.strictObject({
	vista: z.enum(['pendientes', 'revisados']).default('pendientes'),
	pagina: z.coerce.number().int().positive().default(1),
});
