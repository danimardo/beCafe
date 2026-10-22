import { describe, expect, it } from 'vitest';
import { formatMoney, formatMoneyPlain, formatUnitCost, parseMoney } from './dinero';

describe('dinero en céntimos (RN-020)', () => {
	it('formatea céntimos enteros como euros en español', () => {
		expect(formatMoney(2345)).toMatch(/^23,45\s€$/);
		expect(formatMoneyPlain(2345)).toBe('23,45');
	});

	it('usa el signo menos tipográfico para los importes negativos', () => {
		expect(formatMoney(-500)).toMatch(/^−5,00\s€$/);
	});

	it('añade el signo más solo cuando se pide y el importe es positivo', () => {
		expect(formatMoney(2345, { signed: true })).toMatch(/^\+23,45\s€$/);
		expect(formatMoney(2345)).toMatch(/^23,45\s€$/);
		expect(formatMoney(0, { signed: true })).toMatch(/^0,00\s€$/);
	});

	it('interpreta importes escritos en español y devuelve céntimos enteros', () => {
		expect(parseMoney('17')).toBe(1700);
		expect(parseMoney('17,5')).toBe(1750);
		expect(parseMoney('1.234,50')).toBe(123450);
		expect(parseMoney('17 €')).toBe(1700);
		expect(parseMoney('')).toBeNull();
		expect(parseMoney('1,234')).toBeNull();
		expect(parseMoney('no es un importe')).toBeNull();
	});

	it('muestra el coste medio en diezmilésimas', () => {
		expect(formatUnitCost(3483)).toMatch(/^0,3483\s€$/);
	});
});
