import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { REFERENCIAS_TEMA } from './referencias-tema';

// Las referencias de contraste no pueden divergir de los tokens reales (research R2).
const esquemaTokens = z.object({
	color: z.object({
		tokens: z.array(z.object({ name: z.string(), value: z.union([z.string(), z.record(z.string(), z.string())]) })),
	}),
});
const tokens = esquemaTokens.parse(JSON.parse(readFileSync('tokens/tokens.json', 'utf8'))).color.tokens;
const css = readFileSync('src/tokens.css', 'utf8');

function valorDeToken(nombre: string, tema: 'claro' | 'oscuro'): string | undefined {
	const valor = tokens.find((token) => token.name === nombre)?.value;
	return typeof valor === 'string' ? valor : valor?.[tema];
}

describe('referencias de tema del color propio', () => {
	for (const tema of ['claro', 'oscuro'] as const) {
		it(`RF-270: las referencias del tema ${tema} coinciden con tokens/tokens.json`, () => {
			expect(REFERENCIAS_TEMA[tema]).toEqual({
				fondo: valorDeToken('wall-base', tema),
				tarjeta: valorDeToken('wall-raised', tema),
				tinta: valorDeToken('ink', tema),
				sobreAcento: valorDeToken('on-accent', tema),
			});
		});
	}

	it('RF-270: los mismos valores aparecen en src/tokens.css', () => {
		for (const tema of ['claro', 'oscuro'] as const) {
			const bloque = css.split(tema === 'claro' ? ':root, [data-theme=' : "[data-theme='oscuro'] {")[1] ?? '';
			const { fondo, tarjeta, tinta, sobreAcento } = REFERENCIAS_TEMA[tema];
			expect(bloque).toContain(`--wall-base: ${fondo};`);
			expect(bloque).toContain(`--wall-raised: ${tarjeta};`);
			expect(bloque).toContain(`--ink: ${tinta};`);
			expect(bloque).toContain(`--on-accent: ${sobreAcento};`);
		}
	});
});
