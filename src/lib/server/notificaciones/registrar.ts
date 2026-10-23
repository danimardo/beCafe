import { and, eq } from 'drizzle-orm';
import { nuevoId, registrar, type Tx } from '#lib/server/plataforma';
import type { InstanteUtc } from '#lib/shared/fechas/tipos';
import { listarUsuarios, type FilaUsuario } from '#lib/server/usuarios';
import { CATALOGO, esDesactivable, validarDatos } from './catalogo';
import { entregaPush, notificacion, preferenciaNotificacion, suscripcionPush, type TipoNotificacion } from './esquema';

// Registro de un aviso dentro de la transacción de su origen (plan F6 D2, ADR-0003, RF-103). Síncrono.
// Un aviso se guarda una vez por destinatario; la entrega push, una vez por dispositivo suscrito en ese momento.

export type EntradaAviso = {
	tipo: TipoNotificacion;
	/** Obligatorio solo para los tipos dirigidos a la persona (`deuda`, `resumen_mensual`). */
	destinatario?: string;
	datos: unknown;
	/** Id del registro que origina el aviso (`entrada_stock_bajo`, `aviso_economia`, consumo…). */
	origenId?: string;
	instante: InstanteUtc;
};

/** Devuelve el número de destinatarios. Lanza `ZodError` si los datos no cumplen el esquema del tipo. */
export function registrarAviso(tx: Tx, entrada: EntradaAviso): number {
	const { tipo, instante } = entrada;
	const datos = validarDatos(tipo, entrada.datos);
	const destinatarios = resolverDestinatarios(tx, tipo, entrada.destinatario);

	for (const destinatario of destinatarios) {
		const avisoId = nuevoId();
		tx.insert(notificacion)
			.values({
				id: avisoId,
				usuarioId: destinatario.id,
				tipo,
				datos: JSON.stringify(datos),
				origenId: entrada.origenId ?? null,
				creadaEn: instante,
				vistaEn: null,
			})
			.run();
		if (!entregaActiva(tx, destinatario.id, tipo)) continue;
		const dispositivos = tx
			.select({ id: suscripcionPush.id })
			.from(suscripcionPush)
			.where(eq(suscripcionPush.usuarioId, destinatario.id))
			.all();
		for (const dispositivo of dispositivos) {
			tx.insert(entregaPush)
				.values({
					id: nuevoId(),
					notificacionId: avisoId,
					suscripcionId: dispositivo.id,
					estado: 'pendiente',
					intentos: 0,
					proximoIntento: instante,
					ultimoCodigo: null,
				})
				.run();
		}
	}

	registrar('aviso.registrado', { tipo, destinatarios: destinatarios.length });
	return destinatarios.length;
}

function resolverDestinatarios(tx: Tx, tipo: TipoNotificacion, destinatario: string | undefined): FilaUsuario[] {
	const activos = listarUsuarios(tx).filter((usuario) => usuario.estado === 'activo');
	switch (CATALOGO[tipo].destinatarios) {
		case 'todos':
			return activos;
		case 'administradores':
			return activos.filter((usuario) => usuario.rol === 'administrador');
		case 'persona': {
			if (destinatario === undefined) throw new Error('AVISO_SIN_DESTINATARIO');
			return activos.filter((usuario) => usuario.id === destinatario);
		}
	}
}

/** Sin fila la preferencia está activada (Clarifications 5). `deuda` nunca se desactiva (RF-102). */
function entregaActiva(tx: Tx, usuarioId: string, tipo: TipoNotificacion): boolean {
	if (!esDesactivable(tipo)) return true;
	const preferencia = tx
		.select({ activada: preferenciaNotificacion.activada })
		.from(preferenciaNotificacion)
		.where(and(eq(preferenciaNotificacion.usuarioId, usuarioId), eq(preferenciaNotificacion.tipo, tipo)))
		.get();
	return preferencia?.activada ?? true;
}
