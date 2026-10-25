import { and, desc, eq, gt, inArray, isNull } from 'drizzle-orm';
import { enlaceVisitante, visita } from './esquema';
import { exigirAdministrador, type Actor } from './actor';
import { generarToken, hashToken } from './sesiones';
import { anotarAuditoria } from '#lib/server/usuarios';
import {
	ErrorDeNegocio,
	RecursoNoEncontrado,
	enTransaccion,
	nuevoId,
	registrar,
	type Ambiente,
	type Ejecutor,
} from '#lib/server/plataforma';

// Enlaces de visitante y visitas (plan F10 D1; RF-189, RF-190, RF-210). El token del enlace viaja en la URL y en el QR;
// el de la visita, en la cookie `becafe_visita`. La base guarda solo sus SHA-256 (mismo patrón que `enlace_acceso`).
// Una visita deja de servir en cuanto su enlace caduca o se revoca.

export const NOMBRE_COOKIE_VISITA = 'becafe_visita';
export const VIGENCIA_ENLACE_VISITANTE_MS = 24 * 60 * 60 * 1000;

export type EnlaceVisitante = { id: string; creadoPor: string; creadoEn: string; expiraEn: string };
export type EstadoEnlaceVisitante =
	{ valido: true; enlaceId: string; expiraEn: string } | { valido: false; motivo: 'caducado' | 'revocado' | 'desconocido' };
export type VisitaResuelta = { id: string; enlaceId: string; nombre: string | null; expiraEn: string };

/** Crea un enlace de visitante de 24 h. Cualquier miembro con sesión puede hacerlo (RF-189). El token solo se devuelve aquí. */
export function crearEnlaceVisitante(ambiente: Ambiente, actor: Actor): { enlaceId: string; token: string; expiraEn: string } {
	const instante = ambiente.reloj.ahora();
	const token = generarToken();
	const enlaceId = nuevoId();
	const expiraEn = new Date(Date.parse(instante) + VIGENCIA_ENLACE_VISITANTE_MS).toISOString();
	ambiente.db
		.insert(enlaceVisitante)
		.values({ id: enlaceId, tokenHash: hashToken(token), creadoPor: actor.usuarioId, creadoEn: instante, expiraEn })
		.run();
	registrar('visitante.enlace_creado', { enlaceId });
	return { enlaceId, token, expiraEn };
}

/** Revoca un enlace. Solo su creador o un administrador (RF-189). Revocar uno ya revocado no cambia nada. */
export function revocarEnlaceVisitante(ambiente: Ambiente, actor: Actor, enlaceId: string): void {
	const instante = ambiente.reloj.ahora();
	enTransaccion(ambiente.db, (tx) => {
		const fila = tx.select().from(enlaceVisitante).where(eq(enlaceVisitante.id, enlaceId)).get();
		if (!fila) throw new RecursoNoEncontrado();
		if (fila.creadoPor !== actor.usuarioId) exigirAdministrador(actor, 'visitantes.revocar');
		if (fila.revocadoEn) return;
		tx.update(enlaceVisitante).set({ revocadoEn: instante, revocadoPor: actor.usuarioId }).where(eq(enlaceVisitante.id, enlaceId)).run();
	});
	registrar('visitante.enlace_revocado', { enlaceId });
}

/** Enlaces vigentes: los propios para un miembro y todos para un administrador, del más reciente al más antiguo. */
export function listarEnlacesVisitante(db: Ejecutor, actor: Actor, ahora: string): EnlaceVisitante[] {
	const vigentes = and(isNull(enlaceVisitante.revocadoEn), gt(enlaceVisitante.expiraEn, ahora));
	return db
		.select({
			id: enlaceVisitante.id,
			creadoPor: enlaceVisitante.creadoPor,
			creadoEn: enlaceVisitante.creadoEn,
			expiraEn: enlaceVisitante.expiraEn,
		})
		.from(enlaceVisitante)
		.where(actor.rol === 'administrador' ? vigentes : and(vigentes, eq(enlaceVisitante.creadoPor, actor.usuarioId)))
		.orderBy(desc(enlaceVisitante.creadoEn))
		.all();
}

/** Estado de un enlace sin abrir una visita (`GET` de `/visita/[token]`). */
export function validarEnlaceVisitante(db: Ejecutor, token: string, ahora: string): EstadoEnlaceVisitante {
	const fila = db
		.select()
		.from(enlaceVisitante)
		.where(eq(enlaceVisitante.tokenHash, hashToken(token)))
		.get();
	if (!fila) return { valido: false, motivo: 'desconocido' };
	if (fila.revocadoEn) return { valido: false, motivo: 'revocado' };
	if (Date.parse(fila.expiraEn) <= Date.parse(ahora)) return { valido: false, motivo: 'caducado' };
	return { valido: true, enlaceId: fila.id, expiraEn: fila.expiraEn };
}

/** Abre una visita con el nombre del visitante (RF-190). Devuelve el token de la cookie, que solo existe aquí. */
export function abrirVisita(
	ambiente: Ambiente,
	token: string,
	nombre: string,
): { tokenVisita: string; visitaId: string; expiraEn: string } {
	const instante = ambiente.reloj.ahora();
	const estado = validarEnlaceVisitante(ambiente.db, token, instante);
	if (!estado.valido) {
		registrar('visitante.enlace_no_valido', { motivo: estado.motivo });
		throw new ErrorDeNegocio('ENLACE_NO_VALIDO');
	}
	const tokenVisita = generarToken();
	const visitaId = nuevoId();
	ambiente.db
		.insert(visita)
		.values({ id: visitaId, enlaceId: estado.enlaceId, tokenHash: hashToken(tokenVisita), nombre: nombre.trim(), creadaEn: instante })
		.run();
	registrar('visitante.visita_abierta', { visitaId, enlaceId: estado.enlaceId });
	return { tokenVisita, visitaId, expiraEn: estado.expiraEn };
}

/** Resuelve la cookie de una visita. Devuelve `null` si no existe o si su enlace ya no está vigente. */
export function resolverVisita(db: Ejecutor, tokenVisita: string, ahora: string): VisitaResuelta | null {
	const fila = db
		.select({
			id: visita.id,
			enlaceId: visita.enlaceId,
			nombre: visita.nombre,
			expiraEn: enlaceVisitante.expiraEn,
			revocadoEn: enlaceVisitante.revocadoEn,
		})
		.from(visita)
		.innerJoin(enlaceVisitante, eq(visita.enlaceId, enlaceVisitante.id))
		.where(eq(visita.tokenHash, hashToken(tokenVisita)))
		.get();
	if (!fila || fila.revocadoEn || Date.parse(fila.expiraEn) <= Date.parse(ahora)) return null;
	return { id: fila.id, enlaceId: fila.enlaceId, nombre: fila.nombre, expiraEn: fila.expiraEn };
}

/** Elimina el nombre de una visita (RF-210). Solo un administrador; es irreversible y la auditoría no guarda el nombre. */
export function eliminarNombreVisita(ambiente: Ambiente, actor: Actor, visitaId: string): void {
	exigirAdministrador(actor, 'visitantes.eliminar_nombre');
	const instante = ambiente.reloj.ahora();
	enTransaccion(ambiente.db, (tx) => {
		const fila = tx.select({ id: visita.id, nombre: visita.nombre }).from(visita).where(eq(visita.id, visitaId)).get();
		if (!fila) throw new RecursoNoEncontrado();
		if (fila.nombre === null) return;
		tx.update(visita).set({ nombre: null, nombreEliminadoEn: instante }).where(eq(visita.id, visitaId)).run();
		anotarAuditoria(tx, {
			actorId: actor.usuarioId,
			accion: 'visitante.nombre_eliminado',
			objetoTipo: 'visita',
			objetoId: visitaId,
			detalle: {},
			instante,
		});
	});
	registrar('visitante.nombre_eliminado', { visitaId });
}

/** Nombres de las visitas pedidas, para mostrarlos junto a sus cafés. Un nombre eliminado llega como `null`. */
export function leerVisitas(db: Ejecutor, ids: readonly string[]): { id: string; nombre: string | null }[] {
	if (ids.length === 0) return [];
	return db
		.select({ id: visita.id, nombre: visita.nombre })
		.from(visita)
		.where(inArray(visita.id, [...ids]))
		.all();
}

/** Opciones de la cookie de la visita: `HttpOnly` y hasta la caducidad del enlace (constitución V, research R2). */
export function opcionesCookieVisita(origen: string, expiraEn: string, ahora: string) {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: origen.startsWith('https:'),
		maxAge: Math.max(0, Math.floor((Date.parse(expiraEn) - Date.parse(ahora)) / 1000)),
	};
}
