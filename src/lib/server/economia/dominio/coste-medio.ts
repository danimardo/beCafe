import { dividirRedondeando } from './redondeo';

// Coste medio y stock de un tipo de cápsula (RN-003, RN-004, RN-012, RN-013, RN-016, RN-021, INV-02).
// Funciones puras: reciben enteros y devuelven enteros. Sin reloj ni azar (constitución III).
// Unidades: importes en céntimos; coste medio en diezmilésimas de euro (1 € = 10 000).

/** Coste medio de un tipo; `null` si no tiene compras vigentes (RN-006). */
export type CosteMedio = number | null;

/**
 * Coste medio tras una compra (RN-003, RN-004).
 * Con stock positivo y coste conocido, pondera el coste anterior con el de la compra; con stock 0 o negativo, o sin coste,
 * el coste es solo el de la compra. Redondea a la diezmilésima (Clarifications 8).
 */
export function costeTrasCompra(stock: number, costeMedio: CosteMedio, cantidad: number, importeCentimos: number): number {
	if (cantidad <= 0) throw new RangeError('La cantidad de una compra debe ser positiva');
	const costeCompra = importeCentimos * 100;
	if (stock > 0 && costeMedio !== null) {
		return dividirRedondeando(stock * costeMedio + costeCompra, stock + cantidad);
	}
	return dividirRedondeando(costeCompra, cantidad);
}

/** Precio de un consumo en céntimos: el coste medio redondeado al céntimo, mitad hacia arriba (RN-021). */
export function precioDeConsumo(costeMedio: number): number {
	return dividirRedondeando(costeMedio, 100);
}

/** Valor de un faltante de `faltante` cápsulas al coste medio. Un tipo sin coste vale 0 € (Clarifications 6). */
export function valorFaltante(faltante: number, costeMedio: CosteMedio): number {
	if (faltante < 0) throw new RangeError('El faltante no puede ser negativo');
	if (costeMedio === null) return 0;
	return dividirRedondeando(faltante * costeMedio, 100);
}

/** Un hecho que cambia el stock o el coste de un tipo, en el orden de su instante. */
export type HechoTipo =
	| { tipo: 'compra'; instante: string; cantidad: number; importeCentimos: number }
	| { tipo: 'consumo'; instante: string; consumoId: string }
	| { tipo: 'anulacionConsumo'; instante: string }
	| { tipo: 'recuento'; instante: string; diferencia: number }
	| { tipo: 'anulacionRecuento'; instante: string; diferencia: number }
	/** Café de visitante aprobado (RN-086): resta stock y no cambia el coste medio ni se regulariza. */
	| { tipo: 'cafeVisitante'; instante: string };

export type EstadoTipo = {
	stock: number;
	costeMedio: CosteMedio;
	/** Coste medio que se aplicó a cada consumo al registrarlo. Se usa para regularizar (RN-012). */
	costePorConsumo: ReadonlyMap<string, CosteMedio>;
};

export const ESTADO_INICIAL: EstadoTipo = { stock: 0, costeMedio: null, costePorConsumo: new Map() };

/** Aplica un hecho al estado. Es el mismo paso que se usa al registrar en la transacción (INV-02). */
export function aplicarHecho(estado: EstadoTipo, hecho: HechoTipo): EstadoTipo {
	switch (hecho.tipo) {
		case 'compra':
			return {
				stock: estado.stock + hecho.cantidad,
				costeMedio: costeTrasCompra(estado.stock, estado.costeMedio, hecho.cantidad, hecho.importeCentimos),
				costePorConsumo: estado.costePorConsumo,
			};
		case 'consumo': {
			const costePorConsumo = new Map(estado.costePorConsumo);
			costePorConsumo.set(hecho.consumoId, estado.costeMedio);
			return { stock: estado.stock - 1, costeMedio: estado.costeMedio, costePorConsumo };
		}
		case 'anulacionConsumo':
			return { ...estado, stock: estado.stock + 1 };
		case 'recuento':
			return { ...estado, stock: estado.stock + hecho.diferencia };
		case 'anulacionRecuento':
			return { ...estado, stock: estado.stock - hecho.diferencia };
		case 'cafeVisitante':
			return { ...estado, stock: estado.stock - 1 };
	}
}

/**
 * Reproduce la historia de un tipo en orden y devuelve su estado (RN-012, INV-02). Las compras anuladas no deben
 * pasarse: se excluyen desde el principio (Clarifications 9 de la spec de F4). Los hechos llegan ya ordenados por
 * instante; el orden de llegada es el de aplicación.
 */
export function reconstruir(historia: readonly HechoTipo[]): EstadoTipo {
	return historia.reduce(aplicarHecho, ESTADO_INICIAL);
}
