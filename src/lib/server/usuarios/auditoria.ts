import { desc, eq } from 'drizzle-orm';
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
	// Plan F10: foto de persona (RF-208) y eliminación del nombre de un visitante (RF-210), sin el nombre.
	'usuario.foto_cambiada': z.strictObject({ quitada: z.boolean() }),
	'visitante.nombre_eliminado': z.strictObject({}),
	// Plan F15: quitar la foto de un tipo de cápsula (RF-272). Sin datos: el objeto es el tipo.
	'capsula.foto_quitada': z.strictObject({}),
	// Plan F14: restauración de una copia (RF-256). Solo claves de objetos del bucket, sin datos personales.
	// Plan F17: copia manual (RF-287) y descarga (RF-285). El objeto es la copia; sin datos.
	'copia.manual': z.strictObject({}),
	'copia.descargada': z.strictObject({}),
	'copia.restaurada': z.strictObject({ resguardo: z.string().min(1).max(300), confirmadaEn: z.string().min(1).max(40) }),
} as const;

export type AccionAuditoria = keyof typeof esquemasDetalle;

export type EntradaAuditoria<A extends AccionAuditoria> = {
	actorId: string | null;
	accion: A;
	objetoId: string;
	/** Tipo del objeto afectado. Por defecto, `usuario`. La configuración usa `configuracion`. */
	objetoTipo?: 'usuario' | 'configuracion' | 'visita' | 'copia' | 'tipo_capsula';
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

/** Última fila de auditoría de una acción, o `null`. Para mostrar la última restauración (RF-256) y comprobar quién lanzó una copia manual (RF-287). */
export function leerUltimaAuditoria(
	db: Ejecutor,
	accion: AccionAuditoria,
): { objetoId: string; detalle: unknown; creadoEn: string; actorId: string | null } | null {
	const fila = db
		.select({
			objetoId: registroAuditoria.objetoId,
			detalle: registroAuditoria.detalle,
			creadoEn: registroAuditoria.creadoEn,
			actorId: registroAuditoria.actorId,
		})
		.from(registroAuditoria)
		.where(eq(registroAuditoria.accion, accion))
		.orderBy(desc(registroAuditoria.creadoEn))
		.limit(1)
		.get();
	return fila ? { objetoId: fila.objetoId, detalle: JSON.parse(fila.detalle), creadoEn: fila.creadoEn, actorId: fila.actorId } : null;
}
