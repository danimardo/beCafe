import { createHash, randomBytes } from 'node:crypto';
import { and, eq, ne } from 'drizzle-orm';
import { sesion, sesionCerradaPorBaja } from './esquema';
import { usuario, type FilaUsuario } from '#lib/server/usuarios';
import { enTransaccion, registrar, type Db, type Ejecutor } from '#lib/server/plataforma';

// Sesiones (RN-049, RN-051, RNF-005; research R5). La cookie lleva el token; la base de datos, solo su SHA-256.
export const NOMBRE_COOKIE = 'becafe_sesion';
const DIA_MS = 24 * 60 * 60 * 1000;
export const DURACION_SESION_MS = 90 * DIA_MS;
export const INTERVALO_RENOVACION_MS = 60 * 60 * 1000;

export function generarToken(): string {
	return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

/** Crea una sesión nueva en cada inicio de sesión, para evitar la fijación de sesión. */
export function crearSesion(tx: Ejecutor, entrada: { usuarioId: string; instante: string }): string {
	const token = generarToken();
	tx.insert(sesion)
		.values({
			idHash: hashToken(token),
			usuarioId: entrada.usuarioId,
			creadaEn: entrada.instante,
			ultimoUsoEn: entrada.instante,
			ultimaAutenticacionEn: entrada.instante,
		})
		.run();
	return token;
}

export type SesionResuelta = {
	usuario: FilaUsuario;
	idHash: string;
	ultimaAutenticacionEn: string;
	/** Verdadero si la cookie debe reenviarse con la caducidad nueva. */
	renovada: boolean;
};

/**
 * Resuelve la sesión de una cookie. Devuelve `null` si no existe, si caducó (90 días desde el último uso) o si la
 * persona no está activa (RN-051). Actualiza `ultimo_uso_en` como mucho una vez por hora (research R5).
 */
export function resolverSesion(db: Ejecutor, token: string, instante: string): SesionResuelta | null {
	const idHash = hashToken(token);
	const fila = db
		.select({ sesion, usuario })
		.from(sesion)
		.innerJoin(usuario, eq(usuario.id, sesion.usuarioId))
		.where(eq(sesion.idHash, idHash))
		.get();
	if (!fila) return null;

	const desdeUltimoUso = Date.parse(instante) - Date.parse(fila.sesion.ultimoUsoEn);
	if (desdeUltimoUso >= DURACION_SESION_MS) return null;
	if (fila.usuario.estado !== 'activo') return null;

	const renovada = desdeUltimoUso >= INTERVALO_RENOVACION_MS;
	if (renovada) {
		db.update(sesion).set({ ultimoUsoEn: instante }).where(eq(sesion.idHash, idHash)).run();
	}
	return { usuario: fila.usuario, idHash, ultimaAutenticacionEn: fila.sesion.ultimaAutenticacionEn, renovada };
}

export function cerrarSesion(db: Ejecutor, idHash: string): void {
	db.delete(sesion).where(eq(sesion.idHash, idHash)).run();
}

/** Borra todas las sesiones de una persona, o todas salvo la indicada (aclaración 9). */
export function cerrarSesionesDeUsuario(tx: Ejecutor, usuarioId: string, excepto?: string): void {
	const condicion = excepto ? and(eq(sesion.usuarioId, usuarioId), ne(sesion.idHash, excepto)) : eq(sesion.usuarioId, usuarioId);
	tx.delete(sesion).where(condicion).run();
}

/** Cierre de la sesión actual (RF-138): borra solo el token que llega en la cookie. */
export function cerrarSesionActual(db: Db, usuarioId: string, idHash: string): void {
	db.delete(sesion).where(eq(sesion.idHash, idHash)).run();
	registrar('auth.sesion_cerrada', { usuarioId, alcance: 'actual' });
}

/** Cierre en todos los dispositivos (RF-137, CA-137): invalida todas las sesiones de la persona en la siguiente petición. */
export function cerrarSesionesGlobal(db: Db, usuarioId: string): void {
	enTransaccion(db, (tx) => cerrarSesionesDeUsuario(tx, usuarioId));
	registrar('auth.sesion_cerrada', { usuarioId, alcance: 'todas' });
}

/** Opciones de la cookie de sesión. `Secure` depende de `ORIGIN` (aclaración 10). */
export function opcionesCookie(origen: string) {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: origen.startsWith('https:'),
		maxAge: DURACION_SESION_MS / 1000,
	};
}

/**
 * Cierra todas las sesiones de una persona dada de baja (RF-135, CA-135). Guarda sus hashes para que la reactivación
 * pueda distinguirlas; nunca guarda el token (constitución V).
 */
export function cerrarSesionesPorBaja(tx: Ejecutor, usuarioId: string, instante: string): void {
	const sesiones = tx.select({ idHash: sesion.idHash }).from(sesion).where(eq(sesion.usuarioId, usuarioId)).all();
	for (const { idHash } of sesiones) {
		tx.insert(sesionCerradaPorBaja).values({ idHash, usuarioId, cerradaEn: instante }).onConflictDoNothing().run();
	}
	tx.delete(sesion).where(eq(sesion.usuarioId, usuarioId)).run();
}

/** Al reactivar, la persona vuelve a tener sesiones posibles: se borran las marcas de la baja anterior. */
export function limpiarSesionesCerradasPorBaja(tx: Ejecutor, usuarioId: string): void {
	tx.delete(sesionCerradaPorBaja).where(eq(sesionCerradaPorBaja.usuarioId, usuarioId)).run();
}

/**
 * Motivo por el que un token no da sesión: `baja` si lo cerró la baja de su persona (RN-054, D9), `sin_sesion` en
 * otro caso. Solo lo puede conocer quien tiene la cookie: la respuesta no revela nada a otra persona (RN-055).
 */
export function motivoSesionInvalida(db: Ejecutor, token: string): 'baja' | 'sin_sesion' {
	const cerrada = db
		.select({ idHash: sesionCerradaPorBaja.idHash })
		.from(sesionCerradaPorBaja)
		.where(eq(sesionCerradaPorBaja.idHash, hashToken(token)))
		.get();
	return cerrada ? 'baja' : 'sin_sesion';
}
