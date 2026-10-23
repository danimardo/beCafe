import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { aplicarHecho, costeTrasCompra, ESTADO_INICIAL, precioDeConsumo, reconstruir, valorFaltante, type HechoTipo } from './coste-medio';

// Ejemplos de la spec de F4 (CA-041, CA-045, RN-021) y propiedades de INV-02 (EV-030, EV-031).

describe('costeTrasCompra (RN-003, RN-004, CA-041)', () => {
	it('CA-041: pondera el coste medio con stock 10 a 0,4000 € y 50 cápsulas por 17,00 €', () => {
		expect(costeTrasCompra(10, 4000, 50, 1700)).toBe(3500);
	});

	it('CA-041: con stock negativo, el coste es solo el de la compra', () => {
		expect(costeTrasCompra(-2, 4000, 50, 1700)).toBe(3400);
	});

	it('RN-004: sin coste conocido, el coste es solo el de la compra', () => {
		expect(costeTrasCompra(0, null, 20, 800)).toBe(4000);
	});

	it('rechaza una cantidad no positiva', () => {
		expect(() => costeTrasCompra(1, 4000, 0, 100)).toThrow(RangeError);
	});
});

describe('precioDeConsumo y valorFaltante (RN-021, RN-016, Clarifications 6)', () => {
	it('redondea el coste medio al céntimo, mitad hacia arriba', () => {
		expect(precioDeConsumo(3483)).toBe(35);
		expect(precioDeConsumo(3500)).toBe(35);
		expect(precioDeConsumo(3550)).toBe(36);
	});

	it('valora un faltante al coste medio', () => {
		expect(valorFaltante(6, 4000)).toBe(240);
	});

	it('un faltante de un tipo sin coste vale 0 €', () => {
		expect(valorFaltante(6, null)).toBe(0);
	});
});

describe('reconstruir (EV-031, RN-012, RN-013, RN-002, RN-005)', () => {
	it('RN-002: el consumo guarda el coste vigente en su instante; una compra posterior no lo cambia', () => {
		const estado = reconstruir([
			{ tipo: 'compra', instante: '2026-10-01T10:00:00Z', cantidad: 10, importeCentimos: 400 },
			{ tipo: 'consumo', instante: '2026-10-02T10:00:00Z', consumoId: 'c1' },
			{ tipo: 'compra', instante: '2026-10-03T10:00:00Z', cantidad: 10, importeCentimos: 300 },
		]);
		expect(estado.costePorConsumo.get('c1')).toBe(4000);
	});

	it('RN-005: un consumo con stock 0 deja el stock en −1', () => {
		const estado = reconstruir([{ tipo: 'consumo', instante: '2026-10-02T10:00:00Z', consumoId: 'c1' }]);
		expect(estado.stock).toBe(-1);
	});

	it('RN-013: anular un consumo devuelve una unidad y no cambia el coste medio', () => {
		const antes = reconstruir([
			{ tipo: 'compra', instante: '2026-10-01T10:00:00Z', cantidad: 10, importeCentimos: 400 },
			{ tipo: 'consumo', instante: '2026-10-02T10:00:00Z', consumoId: 'c1' },
		]);
		const despues = aplicarHecho(antes, { tipo: 'anulacionConsumo', instante: '2026-10-02T11:00:00Z' });
		expect(despues.stock).toBe(10);
		expect(despues.costeMedio).toBe(antes.costeMedio);
	});

	it('un recuento cambia el stock sin movimientos de coste', () => {
		const estado = reconstruir([
			{ tipo: 'compra', instante: '2026-10-01T10:00:00Z', cantidad: 30, importeCentimos: 1200 },
			{ tipo: 'recuento', instante: '2026-10-05T10:00:00Z', diferencia: -6 },
		]);
		expect(estado.stock).toBe(24);
		expect(estado.costeMedio).toBe(4000);
	});

	it('historia vacía: stock 0 y sin coste', () => {
		expect(reconstruir([])).toEqual(ESTADO_INICIAL);
	});
});

const hechoArbitrario: fc.Arbitrary<HechoTipo> = fc.oneof(
	fc.record({
		tipo: fc.constant('compra' as const),
		instante: fc.constant('2026-10-01T00:00:00Z'),
		cantidad: fc.integer({ min: 1, max: 60 }),
		importeCentimos: fc.integer({ min: 1, max: 50_000 }),
	}),
	fc.record({ tipo: fc.constant('consumo' as const), instante: fc.constant('2026-10-01T00:00:00Z'), consumoId: fc.uuid() }),
	fc.record({ tipo: fc.constant('anulacionConsumo' as const), instante: fc.constant('2026-10-01T00:00:00Z') }),
	fc.record({
		tipo: fc.constant('recuento' as const),
		instante: fc.constant('2026-10-01T00:00:00Z'),
		diferencia: fc.integer({ min: -5, max: 5 }),
	}),
);

describe('propiedades de INV-02 (EV-030)', () => {
	it('EV-030: aplicar los hechos uno a uno da el mismo estado que reconstruir', () => {
		fc.assert(
			fc.property(fc.array(hechoArbitrario, { maxLength: 40 }), (historia) => {
				const incremental = historia.reduce(aplicarHecho, ESTADO_INICIAL);
				expect(reconstruir(historia)).toEqual(incremental);
			}),
		);
	});

	it('EV-030: el stock es la suma de las variaciones de la historia', () => {
		fc.assert(
			fc.property(fc.array(hechoArbitrario, { maxLength: 40 }), (historia) => {
				const esperado = historia.reduce((stock, hecho) => {
					switch (hecho.tipo) {
						case 'compra':
							return stock + hecho.cantidad;
						case 'consumo':
							return stock - 1;
						case 'anulacionConsumo':
							return stock + 1;
						case 'recuento':
							return stock + hecho.diferencia;
						case 'anulacionRecuento':
							return stock - hecho.diferencia;
					}
				}, 0);
				expect(reconstruir(historia).stock).toBe(esperado);
			}),
		);
	});

	it('EV-030: el coste medio es nulo solo mientras no haya compras', () => {
		fc.assert(
			fc.property(fc.array(hechoArbitrario, { maxLength: 40 }), (historia) => {
				const haCompra = historia.some((hecho) => hecho.tipo === 'compra');
				expect(reconstruir(historia).costeMedio === null).toBe(!haCompra);
			}),
		);
	});
});

describe('EV-031: anular una compra', () => {
	it('reconstruir sin la compra anulada devuelve el coste de la compra vigente anterior', () => {
		const sinAnulada = reconstruir([
			{ tipo: 'compra', instante: '2026-10-01T10:00:00Z', cantidad: 10, importeCentimos: 400 },
			{ tipo: 'consumo', instante: '2026-10-02T10:00:00Z', consumoId: 'c1' },
		]);
		expect(sinAnulada.costePorConsumo.get('c1')).toBe(4000);
	});
});
