import { z } from 'zod';
import { configuracion } from './esquema';
import { registrar, type Db } from '#lib/server/plataforma';

// Parámetros de negocio con valores por defecto (ARCHITECTURE.md §8; data-model.md). Sin fila, vale el defecto.
const CLAVES = {
	plazo_autoanulacion_min: { defecto: 15, esquema: z.number().int().positive() },
	limite_deuda_centimos: { defecto: -500, esquema: z.number().int().max(0) },
	intervalo_rellenos_min: { defecto: 60, esquema: z.number().int().positive() },
} as const;

export type Configuracion = { plazoAutoanulacionMin: number; limiteDeudaCentimos: number; intervalorRellenosMin: number };

export function leerConfiguracion(db: Db): Configuracion {
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
		intervalorRellenosMin: valor('intervalo_rellenos_min'),
	};
}

function parsearJson(texto: string): unknown {
	try {
		return JSON.parse(texto);
	} catch {
		return undefined;
	}
}
