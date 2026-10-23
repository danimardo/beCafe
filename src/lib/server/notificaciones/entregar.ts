import { and, eq, lte } from 'drizzle-orm';
import { enTransaccion, registrar, type Db, type Reloj, type Tx } from '#lib/server/plataforma';
import { instanteDesdeFecha, type InstanteUtc } from '#lib/shared/fechas/tipos';
import { construirMensaje } from './catalogo';
import type { EnviarPush } from './entrega-push';
import { entregaPush, notificacion, suscripcionPush, type TipoNotificacion } from './esquema';

// Entrega de avisos pendientes (plan F6 D6, D9; RF-104, RF-105). Lee fuera de transacción y escribe una transacción corta
// por entrega. Un fallo de envío nunca deshace el aviso (RNF-008).

/** Esperas tras cada fallo, en minutos (plan D6). */
export const ESPERAS_MINUTOS = [1, 5, 30, 120, 720] as const;
/** Tras este número de fallos la entrega queda `agotada`. Con cinco intentos, la espera de 720 min no llega a usarse. */
export const MAX_INTENTOS = 5;
/** Un aviso con más de 24 horas ya no se envía por push: sigue en el panel (plan D6). */
const VENTANA_PUSH_MS = 24 * 60 * 60 * 1000;
/** Los avisos y sus entregas se borran a los 30 días (plan D9). */
const RETENCION_AVISOS_MS = 30 * 24 * 60 * 60 * 1000;
const MINUTO_MS = 60 * 1000;

type EntregaPendiente = {
	entregaId: string;
	notificacionId: string;
	suscripcionId: string;
	intentos: number;
	endpoint: string;
	clavePdh: string;
	claveAuth: string;
	tipo: TipoNotificacion;
	datos: string;
	creadaEn: string;
};

export async function entregarPendientes({ db, reloj, enviar }: { db: Db; reloj: Reloj; enviar: EnviarPush }): Promise<void> {
	const ahora = reloj.ahora();
	const pendientes: EntregaPendiente[] = db
		.select({
			entregaId: entregaPush.id,
			notificacionId: entregaPush.notificacionId,
			suscripcionId: entregaPush.suscripcionId,
			intentos: entregaPush.intentos,
			endpoint: suscripcionPush.endpoint,
			clavePdh: suscripcionPush.clavePdh,
			claveAuth: suscripcionPush.claveAuth,
			tipo: notificacion.tipo,
			datos: notificacion.datos,
			creadaEn: notificacion.creadaEn,
		})
		.from(entregaPush)
		.innerJoin(notificacion, eq(entregaPush.notificacionId, notificacion.id))
		.innerJoin(suscripcionPush, eq(entregaPush.suscripcionId, suscripcionPush.id))
		.where(and(eq(entregaPush.estado, 'pendiente'), lte(entregaPush.proximoIntento, ahora)))
		.all();

	for (const entrega of pendientes) {
		if (Date.parse(ahora) - Date.parse(entrega.creadaEn) > VENTANA_PUSH_MS) {
			enTransaccion(db, (tx) => marcarEstado(tx, entrega.entregaId, 'caducada'));
			continue;
		}
		const mensaje = prepararMensaje(entrega);
		if (mensaje === undefined) {
			enTransaccion(db, (tx) => marcarEstado(tx, entrega.entregaId, 'agotada'));
			continue;
		}
		const { estado } = await enviar({ endpoint: entrega.endpoint, keys: { p256dh: entrega.clavePdh, auth: entrega.claveAuth } }, mensaje);
		enTransaccion(db, (tx) => resolverEnvio(tx, entrega, estado, reloj.ahora()));
	}
}

/** Borra los avisos de más de 30 días; sus entregas caen en cascada (plan D9). Devuelve cuántos avisos se borraron. */
export function borrarAvisosAntiguos(db: Db, ahora: InstanteUtc): number {
	const limite = instanteDesdeFecha(new Date(Date.parse(ahora) - RETENCION_AVISOS_MS));
	return enTransaccion(db, (tx) => tx.delete(notificacion).where(lte(notificacion.creadaEn, limite)).run().changes);
}

/** Construye el cuerpo del mensaje desde el dato guardado. Un dato que no supera su esquema devuelve `undefined` y se registra. */
function prepararMensaje(entrega: EntregaPendiente): string | undefined {
	try {
		const datos: unknown = JSON.parse(entrega.datos);
		const { titulo, texto, enlace } = construirMensaje(entrega.tipo, datos);
		return JSON.stringify({ version: 1, tipo: entrega.tipo, titulo, texto, enlace });
	} catch {
		registrar('dato.invalido', { origen: 'notificacion', id: entrega.notificacionId, campo: 'datos', incidencia: 'no_cumple_esquema' });
		return undefined;
	}
}

function resolverEnvio(tx: Tx, entrega: EntregaPendiente, codigoHttp: number, ahora: InstanteUtc): void {
	if (codigoHttp >= 200 && codigoHttp < 300) {
		tx.update(entregaPush).set({ estado: 'enviada', ultimoCodigo: codigoHttp }).where(eq(entregaPush.id, entrega.entregaId)).run();
		registrar('push.enviado', { entregaId: entrega.entregaId, codigoHttp });
		return;
	}
	if (codigoHttp === 404 || codigoHttp === 410) {
		// El dispositivo ya no existe: se borra la suscripción y, en cascada, sus entregas (plan D6).
		tx.delete(suscripcionPush).where(eq(suscripcionPush.id, entrega.suscripcionId)).run();
		registrar('push.suscripcion_caducada', { suscripcionId: entrega.suscripcionId });
		return;
	}
	const intento = entrega.intentos + 1;
	registrar('push.fallido', { entregaId: entrega.entregaId, codigoHttp, intento });
	if (intento >= MAX_INTENTOS) {
		tx.update(entregaPush)
			.set({ estado: 'agotada', intentos: intento, ultimoCodigo: codigoHttp })
			.where(eq(entregaPush.id, entrega.entregaId))
			.run();
		registrar('push.reintentos_agotados', { entregaId: entrega.entregaId });
		return;
	}
	const espera = ESPERAS_MINUTOS[intento - 1] ?? ESPERAS_MINUTOS[ESPERAS_MINUTOS.length - 1];
	const proximo = instanteDesdeFecha(new Date(Date.parse(ahora) + espera * MINUTO_MS));
	tx.update(entregaPush)
		.set({ intentos: intento, proximoIntento: proximo, ultimoCodigo: codigoHttp })
		.where(eq(entregaPush.id, entrega.entregaId))
		.run();
}

function marcarEstado(tx: Tx, entregaId: string, estado: 'agotada' | 'caducada'): void {
	tx.update(entregaPush).set({ estado }).where(eq(entregaPush.id, entregaId)).run();
}
