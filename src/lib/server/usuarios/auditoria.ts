import { z } from 'zod';
import { registroAuditoria } from './esquema';
import { esquemaRol } from './tipos';
import type { Ejecutor } from '#lib/server/plataforma';
import { nuevoId } from '#lib/server/plataforma';

// Auditoría de administración (RF-139c, data-model.md). El `detalle` solo lleva identificadores, roles y tipos de enlace.
const esquemasDetalle = {
	'usuario.alta': z.strictObject({ rol: esquemaRol }),
	'usuario.rol_cambiado': z.strictObject({ rolAnterior: esquemaRol, rolNuevo: esquemaRol }),
	'usuario.reactivado': z.strictObject({}),
	'usuario.baja': z.strictObject({ modo: z.enum(['ninguna', 'pago', 'devolucion', 'incobrable']) }),
	'enlace.generado': z.strictObject({
		tipo: z.enum(['invitacion', 'recuperacion']),
		origen: z.enum(['aplicacion', 'arranque', 'comando']),
	}),
	// Valores de negocio (plan F8 D7): números de configuración, sin datos personales.
	'configuracion.cambiada': z.strictObject({ clave: z.string().min(1).max(60), anterior: z.number(), nuevo: z.number() }),
} as const;

export type AccionAuditoria = keyof typeof esquemasDetalle;

export type EntradaAuditoria<A extends AccionAuditoria> = {
	actorId: string | null;
	accion: A;
	objetoId: string;
	/** Tipo del objeto afectado. Por defecto, `usuario`. La configuración usa `configuracion`. */
	objetoTipo?: 'usuario' | 'configuracion';
	detalle: z.input<(typeof esquemasDetalle)[A]>;
	instante: string;
};

/** Escribe una fila de auditoría dentro de la transacción recibida. Valida el `detalle` antes de guardarlo. */
export function anotarAuditoria<A extends AccionAuditoria>(tx: Ejecutor, entrada: EntradaAuditoria<A>): void {
	const detalle = esquemasDetalle[entrada.accion].parse(entrada.detalle);
	tx.insert(registroAuditoria)
		.values({
			id: nuevoId(),
			actorId: entrada.actorId,
			accion: entrada.accion,
			objetoTipo: entrada.objetoTipo ?? 'usuario',
			objetoId: entrada.objetoId,
			detalle: JSON.stringify(detalle),
			creadoEn: entrada.instante,
		})
		.run();
}
