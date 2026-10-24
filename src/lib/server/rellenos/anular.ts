import { and, eq } from 'drizzle-orm';
import { leerConfiguracion } from '#lib/server/configuracion';
import { enTransaccion, ErrorDeNegocio, RecursoNoEncontrado, registrar, type Ambiente } from '#lib/server/plataforma';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { rellenoAgua } from './esquema';
import type { PersonaRelleno } from './registrar';

// Anulación de un relleno (plan F8 D4, RN-083, Clarifications 6). Se anula en lugar de borrar; nunca vuelve a estar vigente.

export const MOTIVO_DESHACER = 'Deshecho por el autor';

/**
 * Anula un relleno. Lo puede hacer su autor dentro del plazo de autoanulación, o un administrador en cualquier momento
 * (también los de personas dadas de baja, Clarifications 6). Un relleno ya anulado no se vuelve a anular.
 */
export function anularRelleno(ambiente: Ambiente, persona: PersonaRelleno, rellenoId: string, motivo: string): void {
	const ahora = ambiente.reloj.ahora();
	enTransaccion(ambiente.db, (tx) => {
		const relleno = tx.select().from(rellenoAgua).where(eq(rellenoAgua.id, rellenoId)).get();
		if (!relleno) throw new RecursoNoEncontrado();
		const quien = buscarUsuarioPorId(tx, persona.usuarioId);
		if (!quien) throw new ErrorDeNegocio('SIN_SESION');
		const administrador = quien.rol === 'administrador';
		if (!administrador && relleno.usuarioId !== persona.usuarioId) throw new ErrorDeNegocio('SIN_PERMISO');
		if (relleno.estado === 'anulado') throw new ErrorDeNegocio('YA_ANULADO');
		if (!administrador) {
			const { plazoAutoanulacionMin } = leerConfiguracion(tx);
			if (Date.parse(ahora) - Date.parse(relleno.registradoEn) > plazoAutoanulacionMin * 60_000) throw new ErrorDeNegocio('FUERA_DE_PLAZO');
		}
		const cambios = tx
			.update(rellenoAgua)
			.set({ estado: 'anulado', anuladoPor: persona.usuarioId, anuladoEn: ahora, motivoAnulacion: motivo })
			.where(and(eq(rellenoAgua.id, rellenoId), eq(rellenoAgua.estado, 'vigente')))
			.run().changes;
		if (cambios === 0) throw new ErrorDeNegocio('YA_ANULADO');
		registrar('relleno.anulado', { rellenoId, usuarioId: persona.usuarioId });
	});
}

/** «Deshacer» de la tarjeta: la anulación del autor en plazo con el motivo fijo (F3, D3). */
export function deshacerRelleno(ambiente: Ambiente, persona: PersonaRelleno, rellenoId: string): void {
	anularRelleno(ambiente, persona, rellenoId, MOTIVO_DESHACER);
}
