import { desc, eq } from 'drizzle-orm';
import { leerConfiguracion } from '#lib/server/configuracion';
import { enTransaccion, ErrorDeNegocio, nuevoId, registrar, type Ambiente } from '#lib/server/plataforma';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { rellenoAgua } from './esquema';

// Registro de un relleno de agua (plan F8 D1, RF-171, RN-080, RN-082, INV-07). Un relleno nunca mueve dinero.

const MINUTO_MS = 60_000;

/** Persona que registra o anula. Solo el identificador: el rol se lee de `usuarios` (ARCHITECTURE.md §4). */
export type PersonaRelleno = { usuarioId: string };

export type ResultadoRelleno = { id: string; duplicado: boolean };

/**
 * Registra un relleno a nombre de la persona. Con un `clienteId` ya usado devuelve el relleno original (idempotencia).
 * Dentro de la transacción (`BEGIN IMMEDIATE`) el último relleno vigente se lee y el nuevo se inserta sin que otro escritor se cuele.
 */
export function registrarRelleno(ambiente: Ambiente, persona: PersonaRelleno, entrada: { clienteId: string }): ResultadoRelleno {
	const ahora = ambiente.reloj.ahora();
	return enTransaccion(ambiente.db, (tx) => {
		const existente = tx.select({ id: rellenoAgua.id }).from(rellenoAgua).where(eq(rellenoAgua.clienteId, entrada.clienteId)).get();
		if (existente) return { id: existente.id, duplicado: true };

		const autor = buscarUsuarioPorId(tx, persona.usuarioId);
		if (!autor) throw new ErrorDeNegocio('SIN_SESION');
		if (autor.estado !== 'activo') throw new ErrorDeNegocio('USUARIO_DE_BAJA');

		const { intervaloRellenosMin: intervalo } = leerConfiguracion(tx);
		if (intervalo > 0) {
			const ultimo = tx
				.select({ usuarioId: rellenoAgua.usuarioId, registradoEn: rellenoAgua.registradoEn })
				.from(rellenoAgua)
				.where(eq(rellenoAgua.estado, 'vigente'))
				.orderBy(desc(rellenoAgua.registradoEn))
				.limit(1)
				.get();
			// Exactamente al cumplirse el intervalo se acepta (Clarifications 7): el rechazo es estrictamente menor.
			if (ultimo && Date.parse(ahora) - Date.parse(ultimo.registradoEn) < intervalo * MINUTO_MS) {
				registrar('relleno.rechazado_intervalo', { usuarioId: persona.usuarioId });
				throw new ErrorDeNegocio('RELLENO_RECIENTE', {
					autorId: ultimo.usuarioId,
					registradoEn: ultimo.registradoEn,
					esPropio: ultimo.usuarioId === persona.usuarioId,
				});
			}
		}

		const id = nuevoId();
		tx.insert(rellenoAgua)
			.values({ id, clienteId: entrada.clienteId, usuarioId: persona.usuarioId, registradoEn: ahora, estado: 'vigente' })
			.run();
		registrar('relleno.registrado', { rellenoId: id, usuarioId: persona.usuarioId });
		return { id, duplicado: false };
	});
}
