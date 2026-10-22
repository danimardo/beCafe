import { and, eq, isNull } from 'drizzle-orm';
import { enlaceAcceso, credencial } from './esquema';
import { contrasenaAceptable, hashContrasena } from './contrasenas';
import { anotarAuditoria } from '#lib/server/usuarios';
import { ErrorDeNegocio, enTransaccion, nuevoId, registrar, type Db, type Ejecutor, type Tx } from '#lib/server/plataforma';
import { cerrarSesionesDeUsuario, crearSesion, generarToken, hashToken } from './sesiones';

// Enlaces de acceso (RN-052, RF-131, RF-132; research R8). El token viaja en la URL; la base de datos guarda su SHA-256.
export const VIGENCIA_INVITACION_MS = 24 * 60 * 60 * 1000;
export const VIGENCIA_RECUPERACION_MS = 60 * 60 * 1000;

export type TipoEnlace = 'invitacion' | 'recuperacion';
export type OrigenEnlace = 'aplicacion' | 'arranque' | 'comando';

/** Aclaración 8: sin contraseña, invitación; con contraseña, recuperación. */
export function tipoEnlacePara(tieneContrasena: boolean): TipoEnlace {
	return tieneContrasena ? 'recuperacion' : 'invitacion';
}

/**
 * Genera un enlace nuevo y anula los sin usar de la misma persona, en la transacción recibida (RN-052).
 * Devuelve el token en claro: solo se muestra una vez.
 */
export function generarEnlace(
	tx: Tx,
	entrada: { usuarioId: string; tipo: TipoEnlace; origen: OrigenEnlace; creadoPor: string | null; instante: string },
): { token: string; expiraEn: string } {
	tx.update(enlaceAcceso)
		.set({ anuladoEn: entrada.instante })
		.where(and(eq(enlaceAcceso.usuarioId, entrada.usuarioId), isNull(enlaceAcceso.usadoEn), isNull(enlaceAcceso.anuladoEn)))
		.run();

	const token = generarToken();
	const vigencia = entrada.tipo === 'invitacion' ? VIGENCIA_INVITACION_MS : VIGENCIA_RECUPERACION_MS;
	const expiraEn = new Date(Date.parse(entrada.instante) + vigencia).toISOString();
	tx.insert(enlaceAcceso)
		.values({
			id: nuevoId(),
			usuarioId: entrada.usuarioId,
			tipo: entrada.tipo,
			tokenHash: hashToken(token),
			expiraEn,
			creadoPor: entrada.creadoPor,
			creadoEn: entrada.instante,
		})
		.run();

	anotarAuditoria(tx, {
		actorId: entrada.creadoPor,
		accion: 'enlace.generado',
		objetoId: entrada.usuarioId,
		detalle: { tipo: entrada.tipo, origen: entrada.origen },
		instante: entrada.instante,
	});
	registrar('auth.enlace_generado', { usuarioId: entrada.usuarioId, tipo: entrada.tipo, origen: entrada.origen });
	return { token, expiraEn };
}

export type ValidezEnlace =
	{ valido: true; tipo: TipoEnlace; usuarioId: string } | { valido: false; motivo: 'usado' | 'caducado' | 'anulado' | 'desconocido' };

/** Comprueba un enlace sin consumirlo (`GET` de `/acceso/[token]`). */
export function validarEnlace(db: Ejecutor, token: string, instante: string): ValidezEnlace {
	const fila = db
		.select()
		.from(enlaceAcceso)
		.where(eq(enlaceAcceso.tokenHash, hashToken(token)))
		.get();
	if (!fila) return { valido: false, motivo: 'desconocido' };
	if (fila.usadoEn) return { valido: false, motivo: 'usado' };
	if (fila.anuladoEn) return { valido: false, motivo: 'anulado' };
	if (Date.parse(fila.expiraEn) <= Date.parse(instante)) return { valido: false, motivo: 'caducado' };
	return { valido: true, tipo: fila.tipo === 'recuperacion' ? 'recuperacion' : 'invitacion', usuarioId: fila.usuarioId };
}

/** Anula los enlaces sin usar de una persona (la reactivación y la generación de uno nuevo lo usan). */
export function anularEnlacesPendientes(tx: Ejecutor, usuarioId: string, instante: string): void {
	tx.update(enlaceAcceso)
		.set({ anuladoEn: instante })
		.where(and(eq(enlaceAcceso.usuarioId, usuarioId), isNull(enlaceAcceso.usadoEn), isNull(enlaceAcceso.anuladoEn)))
		.run();
}

export type DefinicionContrasena = { token: string; contrasena: string; instante: string };

/**
 * Define la contraseña con un enlace válido (RF-132, CA-132). La verificación del enlace se repite dentro de la transacción,
 * porque dos envíos a la vez no pueden usar el mismo enlace. El hash se calcula fuera, porque Argon2 es asíncrono.
 */
export async function definirContrasenaConEnlace(
	db: Db,
	entrada: DefinicionContrasena,
): Promise<{ usuarioId: string; sesionToken: string }> {
	if (!contrasenaAceptable(entrada.contrasena)) throw new ErrorDeNegocio('CONTRASENA_NO_VALIDA');
	const previa = validarEnlace(db, entrada.token, entrada.instante);
	if (!previa.valido) {
		registrar('auth.enlace_rechazado', { motivo: previa.motivo });
		throw new ErrorDeNegocio('ENLACE_NO_VALIDO');
	}
	const hash = await hashContrasena(entrada.contrasena);

	const resultado = enTransaccion(db, (tx) => {
		const vigente = validarEnlace(tx, entrada.token, entrada.instante);
		if (!vigente.valido) {
			registrar('auth.enlace_rechazado', { motivo: vigente.motivo });
			throw new ErrorDeNegocio('ENLACE_NO_VALIDO');
		}
		tx.insert(credencial)
			.values({ usuarioId: vigente.usuarioId, hash, intentosFallidos: 0, bloqueadoHasta: null, actualizadaEn: entrada.instante })
			.onConflictDoUpdate({
				target: credencial.usuarioId,
				set: { hash, intentosFallidos: 0, bloqueadoHasta: null, actualizadaEn: entrada.instante },
			})
			.run();
		tx.update(enlaceAcceso)
			.set({ usadoEn: entrada.instante })
			.where(eq(enlaceAcceso.tokenHash, hashToken(entrada.token)))
			.run();
		cerrarSesionesDeUsuario(tx, vigente.usuarioId);
		const sesionToken = crearSesion(tx, { usuarioId: vigente.usuarioId, instante: entrada.instante });
		return { usuarioId: vigente.usuarioId, tipo: vigente.tipo, sesionToken };
	});

	registrar('auth.enlace_usado', { usuarioId: resultado.usuarioId, tipo: resultado.tipo });
	registrar('auth.contrasena_cambiada', { usuarioId: resultado.usuarioId, via: 'enlace' });
	registrar('auth.sesion_iniciada', { usuarioId: resultado.usuarioId });
	return { usuarioId: resultado.usuarioId, sesionToken: resultado.sesionToken };
}
