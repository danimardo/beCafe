import { describe, expect, it } from 'vitest';
import { esquemaInstanteUtc, esquemaMes } from './tipos';
import { inicioDeVentanaDias, limitesDeAnio, limitesDeMes, mesDeInstante, mesesEntre } from './meses';

// Plan F6 D8 y tareas T001-T002: meses y años de Madrid, con los cambios de horario de marzo y octubre.
const mes = (texto: string) => esquemaMes.parse(texto);
const instante = (texto: string) => esquemaInstanteUtc.parse(texto);

describe('meses de Madrid (constitución V)', () => {
	it('un mes de invierno empieza a las 23:00 UTC del día anterior', () => {
		expect(limitesDeMes(mes('2026-02'))).toEqual({
			desde: '2026-01-31T23:00:00.000Z',
			hasta: '2026-02-28T23:00:00.000Z',
		});
	});

	it('marzo de 2026, con el cambio de horario del último domingo (29 de marzo), cierra en 22:00 UTC del 31', () => {
		expect(limitesDeMes(mes('2026-03'))).toEqual({
			desde: '2026-02-28T23:00:00.000Z',
			hasta: '2026-03-31T22:00:00.000Z',
		});
	});

	it('octubre de 2026, con el cambio de horario del 25 de octubre, empieza a las 22:00 UTC del 30 de septiembre', () => {
		expect(limitesDeMes(mes('2026-10'))).toEqual({
			desde: '2026-09-30T22:00:00.000Z',
			hasta: '2026-10-31T23:00:00.000Z',
		});
	});

	it('las 23:59 del 31 de octubre en Madrid pertenecen a octubre; las 00:00 del 1 de noviembre, a noviembre', () => {
		expect(mesDeInstante(instante('2026-10-31T22:59:00.000Z'))).toBe('2026-10');
		expect(mesDeInstante(instante('2026-10-31T23:00:00.000Z'))).toBe('2026-11');
	});

	it('un año natural de Madrid va del 1 de enero 00:00 al 1 de enero siguiente', () => {
		expect(limitesDeAnio(2026)).toEqual({
			desde: '2025-12-31T23:00:00.000Z',
			hasta: '2026-12-31T23:00:00.000Z',
		});
	});

	it('mesesEntre incluye los extremos y cruza el cambio de año', () => {
		expect(mesesEntre(mes('2026-11'), mes('2027-02'))).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
		expect(mesesEntre(mes('2026-05'), mes('2026-05'))).toEqual(['2026-05']);
	});
});

describe('ventana de días de Madrid (RN-090)', () => {
	it('30 días desde el 26 de octubre empiezan a las 00:00 de Madrid del 27 de septiembre (horario de verano)', () => {
		expect(inicioDeVentanaDias(instante('2026-10-26T10:00:00.000Z'), 30)).toBe('2026-09-26T22:00:00.000Z');
	});

	it('un día es el día de Madrid de ahora: las 23:30 UTC del 26 ya son el 27 en Madrid', () => {
		expect(inicioDeVentanaDias(instante('2026-10-26T10:00:00.000Z'), 1)).toBe('2026-10-25T23:00:00.000Z');
		expect(inicioDeVentanaDias(instante('2026-10-26T23:30:00.000Z'), 1)).toBe('2026-10-26T23:00:00.000Z');
	});

	it('cruza el cambio de horario de marzo sin desplazar la medianoche', () => {
		expect(inicioDeVentanaDias(instante('2026-03-30T10:00:00.000Z'), 3)).toBe('2026-03-27T23:00:00.000Z');
	});

	it('cruza el cambio de año', () => {
		expect(inicioDeVentanaDias(instante('2026-01-05T10:00:00.000Z'), 30)).toBe('2025-12-06T23:00:00.000Z');
	});

	it('rechaza una ventana sin días', () => {
		expect(() => inicioDeVentanaDias(instante('2026-10-26T10:00:00.000Z'), 0)).toThrow(RangeError);
	});
});
