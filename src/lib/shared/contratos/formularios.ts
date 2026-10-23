import { fail } from '@sveltejs/kit';
import type { ZodError } from 'zod';

// Respuestas de error de las *actions* (ARCHITECTURE.md §7). `valores` nunca lleva secretos ni archivos.

/** Campos que nunca vuelven al formulario. */
const CAMPOS_SECRETOS = new Set(['contrasena', 'contrasenaActual', 'contrasenaNueva', 'repeticion', 'token', 'archivo', 'foto']);

export type ErrorDeCampo = { codigo: string; mensaje: string };

export function fallo(estado: number, error: ZodError, datos: Record<string, unknown>) {
	const errores: Record<string, ErrorDeCampo> = {};
	for (const incidencia of error.issues) {
		const campo = String(incidencia.path[0] ?? 'general');
		errores[campo] ??= { codigo: incidencia.code, mensaje: incidencia.message };
	}
	const valores = Object.fromEntries(
		Object.entries(datos).filter(([campo, valor]) => !CAMPOS_SECRETOS.has(campo) && !(valor instanceof File)),
	);
	return fail(estado, { errores, valores });
}
