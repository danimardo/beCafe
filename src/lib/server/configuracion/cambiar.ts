import { eq } from 'drizzle-orm';
import { anotarAuditoria, buscarUsuarioPorId } from '#lib/server/usuarios';
import { enTransaccion, ErrorDeNegocio, registrar, type Db, type Tx } from '#lib/server/plataforma';
import { configuracion } from './esquema';
import { leerConfiguracion, RANGOS, type ClaveConfiguracion, type Configuracion } from './leer';

// Cambio de parámetros de negocio (plan F8 D7; RF-150, CA-150). La reautenticación la exige la action antes (CA-138).

/** Quien cambia la configuración. Solo se usa su identificador: el rol se lee de la base de datos (RN-060). */
export type ActorConfiguracion = { usuarioId: string };

export type ValoresConfiguracion = Partial<Pick<Configuracion, 'plazoAutoanulacionMin' | 'limiteDeudaCentimos' | 'intervaloRellenosMin'>>;

const CAMPOS = ['plazoAutoanulacionMin', 'limiteDeudaCentimos', 'intervaloRellenosMin'] as const;

const CLAVE_POR_CAMPO: Record<keyof ValoresConfiguracion, ClaveConfiguracion> = {
	plazoAutoanulacionMin: 'plazo_autoanulacion_min',
	limiteDeudaCentimos: 'limite_deuda_centimos',
	intervaloRellenosMin: 'intervalo_rellenos_min',
};

export type CambioConfiguracion = { clave: ClaveConfiguracion; anterior: number; nuevo: number };

/** Cambia los parámetros recibidos que difieren de los actuales. Un valor fuera de su rango no se guarda (VALIDACION). */
export function cambiarConfiguracion(
	ambiente: { db: Db; reloj: { ahora(): string } },
	actor: ActorConfiguracion | undefined,
	valores: ValoresConfiguracion,
): CambioConfiguracion[] {
	if (!actor || buscarUsuarioPorId(ambiente.db, actor.usuarioId)?.rol !== 'administrador') throw new ErrorDeNegocio('SIN_PERMISO');
	const ahora = ambiente.reloj.ahora();

	const pendientes = CAMPOS.flatMap((campo) => {
		const nuevo = valores[campo];
		if (nuevo === undefined) return [];
		const clave = CLAVE_POR_CAMPO[campo];
		const validado = RANGOS[clave].safeParse(nuevo);
		if (!validado.success) throw new ErrorDeNegocio('VALIDACION', { campo });
		return [{ campo, clave, nuevo: validado.data }];
	});

	return enTransaccion(ambiente.db, (tx) => {
		const actuales = leerConfiguracion(tx);
		const cambios: CambioConfiguracion[] = [];
		for (const { campo, clave, nuevo } of pendientes) {
			const anterior = actuales[campo];
			if (anterior === nuevo) continue;
			guardar(tx, clave, nuevo, actor.usuarioId, ahora);
			anotarAuditoria(tx, {
				actorId: actor.usuarioId,
				accion: 'configuracion.cambiada',
				objetoTipo: 'configuracion',
				objetoId: clave,
				detalle: { clave, anterior, nuevo },
				instante: ahora,
			});
			registrar('configuracion.cambiada', { clave });
			cambios.push({ clave, anterior, nuevo });
		}
		return cambios;
	});
}

function guardar(tx: Tx, clave: string, valor: number, autor: string, instante: string): void {
	tx.insert(configuracion)
		.values({ clave, valor: JSON.stringify(valor), modificadoPor: autor, modificadoEn: instante })
		.onConflictDoUpdate({
			target: configuracion.clave,
			set: { valor: JSON.stringify(valor), modificadoPor: autor, modificadoEn: instante },
		})
		.run();
}

/** Último cambio de cada parámetro, para mostrarlo junto al valor (plan F8 D7). `null` si nunca se cambió. */
export function leerUltimosCambios(db: Db): Record<ClaveConfiguracion, { modificadoEn: string } | null> {
	return {
		plazo_autoanulacion_min: ultimoCambio(db, 'plazo_autoanulacion_min'),
		limite_deuda_centimos: ultimoCambio(db, 'limite_deuda_centimos'),
		intervalo_rellenos_min: ultimoCambio(db, 'intervalo_rellenos_min'),
	};
}

function ultimoCambio(db: Db, clave: ClaveConfiguracion): { modificadoEn: string } | null {
	const fila = db.select({ modificadoEn: configuracion.modificadoEn }).from(configuracion).where(eq(configuracion.clave, clave)).get();
	return fila ? { modificadoEn: fila.modificadoEn } : null;
}
