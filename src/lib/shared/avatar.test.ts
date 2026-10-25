import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { COLORES_AVATAR, ILUSTRACIONES_AVATAR, colorAvatar, ilustracionAvatar } from './avatar';
import { ulid } from 'ulid';

describe('color del avatar (RF-209, CA-209)', () => {
	it('CA-209: es estable: el mismo identificador da siempre el mismo color, dentro del rango', () => {
		const id = '01J8Z3K9Q4V7M2N5P8R0T6W1XY';
		expect(colorAvatar(id)).toBe(colorAvatar(id));
		expect(colorAvatar(id)).toBeGreaterThanOrEqual(0);
		expect(colorAvatar(id)).toBeLessThan(COLORES_AVATAR);
		expect(colorAvatar('')).toBe(colorAvatar(''));
	});

	it('CA-209: reparte las personas entre los 6 colores sin que ninguno quede vacío ni domine', () => {
		const cuenta = new Array<number>(COLORES_AVATAR).fill(0);
		for (let i = 0; i < 1200; i++) cuenta[colorAvatar(ulid())] += 1;

		for (const veces of cuenta) {
			expect(veces).toBeGreaterThan(120);
			expect(veces).toBeLessThan(280);
		}
	});
});

describe('ilustración del avatar (RF-222, CA-222)', () => {
	it('CA-222: es estable y está dentro de las 8 ilustraciones', () => {
		const id = '01J8Z3K9Q4V7M2N5P8R0T6W1XY';
		expect(ILUSTRACIONES_AVATAR).toBe(8);
		expect(ilustracionAvatar(id)).toBe(ilustracionAvatar(id));
		expect(ilustracionAvatar(id)).toBeGreaterThanOrEqual(0);
		expect(ilustracionAvatar(id)).toBeLessThan(ILUSTRACIONES_AVATAR);
	});

	it('CA-222: reparte las personas entre las 8 ilustraciones sin que ninguna quede vacía ni domine', () => {
		const cuenta = new Array<number>(ILUSTRACIONES_AVATAR).fill(0);
		for (let i = 0; i < 1600; i++) cuenta[ilustracionAvatar(ulid())] += 1;

		for (const veces of cuenta) {
			expect(veces).toBeGreaterThan(130);
			expect(veces).toBeLessThan(270);
		}
	});

	it('CA-222: color e ilustración no van siempre emparejados', () => {
		const parejas = new Set<string>();
		for (let i = 0; i < 400; i++) {
			const id = ulid();
			parejas.add(`${colorAvatar(id)}-${ilustracionAvatar(id)}`);
		}
		expect(parejas.size).toBeGreaterThan(30);
	});
});

// CA-209: las iniciales llevan `ink` sobre el token del avatar: contraste de 4,5:1 como mínimo en claro y oscuro.
const esquemaTokens = z.object({
	color: z.object({
		tokens: z.array(z.object({ name: z.string(), value: z.union([z.string(), z.record(z.string(), z.string())]) })),
	}),
});

function luminancia(hex: string): number {
	const canal = (inicio: number): number => {
		const c = parseInt(hex.slice(inicio, inicio + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5);
}

function contraste(a: string, b: string): number {
	const [la, lb] = [luminancia(a), luminancia(b)];
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('tokens del avatar (CA-209)', () => {
	const tokens = esquemaTokens.parse(JSON.parse(readFileSync(join(process.cwd(), 'tokens', 'tokens.json'), 'utf8'))).color.tokens;
	const valor = (nombre: string, tema: string): string => {
		const token = tokens.find((x) => x.name === nombre);
		const v = token?.value;
		return (typeof v === 'string' ? v : v?.[tema]) ?? '';
	};

	for (const tema of ['claro', 'oscuro']) {
		it(`CA-209: los 6 colores cumplen 4,5:1 con el texto en tema ${tema}`, () => {
			for (let n = 1; n <= COLORES_AVATAR; n++) {
				expect(contraste(valor(`avatar-${n}`, tema), valor('ink', tema)), `avatar-${n}`).toBeGreaterThanOrEqual(4.5);
			}
		});
	}
});
