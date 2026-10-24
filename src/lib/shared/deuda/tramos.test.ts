import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { esquemaFechaMadrid, type FechaMadrid } from '#lib/shared/fechas/tipos';
import { diasNaturales, intervaloRecordatorio, parsearLimite, tocaRecordatorio, tramos } from './tramos';

// EV-101 y CA-074 (RN-074, Clarifications 8): recordatorios de deuda con límite de −500 céntimos (−5 €).
const LIMITE = -500;
const fecha = (texto: string): FechaMadrid => esquemaFechaMadrid.parse(texto);

describe('intervaloRecordatorio (CA-074, RN-074)', () => {
	it('CA-074: con −6 €, −12 € y −25 € el intervalo es de 7, 3 y 1 días', () => {
		expect(intervaloRecordatorio(-600, LIMITE)).toBe(7);
		expect(intervaloRecordatorio(-1200, LIMITE)).toBe(3);
		expect(intervaloRecordatorio(-2500, LIMITE)).toBe(1);
	});

	it('RN-074: un saldo igual al límite o por encima no genera aviso', () => {
		expect(intervaloRecordatorio(LIMITE, LIMITE)).toBeNull();
		expect(intervaloRecordatorio(0, LIMITE)).toBeNull();
	});

	it('CA-074 punto 3: con límite −1000 y saldo −1200 el intervalo es de 7 días', () => {
		expect(intervaloRecordatorio(-1200, -1000)).toBe(7);
	});

	it('los umbrales de un límite son el límite, el doble y el cuádruple', () => {
		expect(tramos(LIMITE)).toEqual({ aviso: -500, frecuente: -1000, diario: -2000 });
	});

	it('nunca aumenta el intervalo cuando el saldo baja (sin aviso cuenta como infinito)', () => {
		fc.assert(
			fc.property(fc.integer({ min: -100_000, max: 100_000 }), fc.integer({ min: 1, max: 100_000 }), (saldo, bajada) => {
				const sinAviso = (valor: number | null): number => valor ?? Number.POSITIVE_INFINITY;
				const antes = sinAviso(intervaloRecordatorio(saldo, LIMITE));
				const despues = sinAviso(intervaloRecordatorio(saldo - bajada, LIMITE));
				return despues <= antes;
			}),
		);
	});
});

describe('tocaRecordatorio (CA-074 puntos 1, 2 y 4)', () => {
	it('CA-074 punto 2: con cambio de tramo dos días después del último aviso, el siguiente llega al tercer día', () => {
		const ultimo = fecha('2026-10-10');
		const dosDespues = { saldo: -1200, limite: LIMITE, ultimoEnvio: ultimo, hoy: fecha('2026-10-12') };
		const tercerDia = { ...dosDespues, hoy: fecha('2026-10-13') };
		expect(tocaRecordatorio(dosDespues)).toBe(false);
		expect(tocaRecordatorio(tercerDia)).toBe(true);
	});

	it('CA-074 punto 4: un saldo por encima del límite no genera recordatorio aunque nunca se haya enviado', () => {
		expect(tocaRecordatorio({ saldo: -100, limite: LIMITE, ultimoEnvio: null, hoy: fecha('2026-10-23') })).toBe(false);
	});

	it('EV-101: sin ningún envío previo y con saldo bajo, toca enviar hoy', () => {
		expect(tocaRecordatorio({ saldo: -600, limite: LIMITE, ultimoEnvio: null, hoy: fecha('2026-10-23') })).toBe(true);
	});

	it('EV-101: con −6 € el aviso llega cada 7 días, no antes', () => {
		const base = { saldo: -600, limite: LIMITE, ultimoEnvio: fecha('2026-10-01') };
		expect(tocaRecordatorio({ ...base, hoy: fecha('2026-10-07') })).toBe(false);
		expect(tocaRecordatorio({ ...base, hoy: fecha('2026-10-08') })).toBe(true);
	});

	it('Clarifications 8: cuenta días naturales de calendario, también a través de fin de mes', () => {
		expect(diasNaturales(fecha('2026-10-30'), fecha('2026-11-02'))).toBe(3);
	});
});

describe('parsearLimite: el límite se escribe como importe de la deuda y se guarda en negativo', () => {
	it.each([
		['5', -500],
		['5,00', -500],
		['-5,00', -500],
		['−100', -10_000],
		['  6 €', -600],
	])('«%s» vale %i céntimos', (texto, esperado) => {
		expect(parsearLimite(texto)).toBe(esperado);
	});

	it.each(['', 'abc', '0', '1,234'])('«%s» no es un límite válido', (texto) => {
		expect(parsearLimite(texto)).toBeNull();
	});
});
