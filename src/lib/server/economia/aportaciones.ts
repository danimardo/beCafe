import { eq } from 'drizzle-orm';
import type { Actor } from '#lib/server/auth';
import { enTransaccion, nuevoId, registrar, type Ambiente, type Tx } from '#lib/server/plataforma';
import { anotarMovimientos } from './libro';
import { aportacion } from './esquema';

// Aportaciones directas a la hucha (RF-040 a RF-046, RN-030, RN-034). Cada aportación y sus dos movimientos se
// escriben en una única transacción (constitución IV). Un `clienteId` repetido devuelve la aportación original (RF-046).

export type ResultadoAportacion = { id: string; duplicado: boolean };

export function registrarAportacion(ambiente: Ambiente, actor: Actor, datos: { clienteId: string; importe: number }): ResultadoAportacion {
	const instante = ambiente.reloj.ahora();
	return enTransaccion(ambiente.db, (tx) => {
		const existente = tx.select({ id: aportacion.id }).from(aportacion).where(eq(aportacion.clienteId, datos.clienteId)).get();
		if (existente) {
			registrar('registro.duplicado', { tipo: 'aportacion', id: existente.id });
			return { id: existente.id, duplicado: true };
		}
		const id = escribirAportacion(tx, {
			...datos,
			usuarioId: actor.usuarioId,
			registradaPor: actor.usuarioId,
			origen: 'directa',
			instante,
		});
		registrar('aportacion.registrada', { aportacionId: id });
		return { id, duplicado: false };
	});
}

/** Inserta una aportación y sus movimientos dentro de una transacción ya abierta. Lo usa también el pago de una baja. */
export function escribirAportacion(
	tx: Tx,
	datos: {
		clienteId?: string;
		importe: number;
		usuarioId: string;
		registradaPor: string;
		origen: 'directa' | 'baja';
		instante: string;
	},
): string {
	const id = nuevoId();
	tx.insert(aportacion)
		.values({
			id,
			clienteId: datos.clienteId ?? nuevoId(),
			usuarioId: datos.usuarioId,
			registradaPor: datos.registradaPor,
			importe: datos.importe,
			origen: datos.origen,
			registradaEn: datos.instante,
		})
		.run();
	anotarMovimientos(tx, [
		{
			cuenta: 'persona',
			usuarioId: datos.usuarioId,
			tipo: 'abono_aportacion',
			importe: datos.importe,
			origenTipo: 'aportacion',
			origenId: id,
			creadoEn: datos.instante,
		},
		{
			cuenta: 'hucha',
			usuarioId: null,
			tipo: 'hucha_aportacion',
			importe: datos.importe,
			origenTipo: 'aportacion',
			origenId: id,
			creadoEn: datos.instante,
		},
	]);
	return id;
}
