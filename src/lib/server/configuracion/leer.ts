import { z } from 'zod';
import { configuracion } from './esquema';
import { registrar, type Ejecutor } from '#lib/server/plataforma';

// Parámetros de negocio con valores por defecto (ARCHITECTURE.md §8; data-model.md). Sin fila, vale el defecto.
// Rangos de cada parámetro (plan F8 D7, Clarifications 2). Los mismos esquemas leen y escriben: un valor fuera de rango no se guarda.
export const RANGOS = {
	plazo_autoanulacion_min: z.number().int().min(1).max(1440),
	limite_deuda_centimos: z.number().int().min(-10_000).max(-100),
	intervalo_rellenos_min: z.number().int().min(0).max(1440),
} as const;

const CLAVES = {
	plazo_autoanulacion_min: { defecto: 15, esquema: RANGOS.plazo_autoanulacion_min },
	limite_deuda_centimos: { defecto: -500, esquema: RANGOS.limite_deuda_centimos },
	intervalo_rellenos_min: { defecto: 60, esquema: RANGOS.intervalo_rellenos_min },
} as const;

export type ClaveConfiguracion = keyof typeof CLAVES;

export type Configuracion = { plazoAutoanulacionMin: number; limiteDeudaCentimos: number; intervaloRellenosMin: number };

export function leerConfiguracion(db: Ejecutor): Configuracion {
	const filas = new Map(
		db
			.select()
			.from(configuracion)
			.all()
			.map((fila) => [fila.clave, fila.valor]),
	);
	const valor = (clave: keyof typeof CLAVES): number => {
		const { defecto, esquema } = CLAVES[clave];
		const guardado = filas.get(clave);
		if (guardado === undefined) return defecto;
		const leido = esquema.safeParse(parsearJson(guardado));
		if (leido.success) return leido.data;
		registrar('dato.invalido', {
			origen: 'configuracion',
			id: clave,
			campo: 'valor',
			incidencia: leido.error.issues[0]?.code ?? 'invalido',
		});
		return defecto;
	};
	return {
		plazoAutoanulacionMin: valor('plazo_autoanulacion_min'),
		limiteDeudaCentimos: valor('limite_deuda_centimos'),
		intervaloRellenosMin: valor('intervalo_rellenos_min'),
	};
}

function parsearJson(texto: string): unknown {
	try {
		return JSON.parse(texto);
	} catch {
		return undefined;
	}
}
