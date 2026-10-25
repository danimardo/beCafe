import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buscarFrase, FRASES_REGISTRO, FRASES_SALUDO, idsDeLista } from './frases';
import { POSES } from './momentos';

// El anexo de la spec es la fuente literal de las frases (RF-237, constitución I).
const anexo = readFileSync(resolve(process.cwd(), 'specs/011-inicio-cafe-capsulito/frases.md'), 'utf8');

function frasesDelAnexo(titulo: string): string[] {
	const bloque = anexo.split(titulo)[1]?.split('\n## ')[0] ?? '';
	return [...bloque.matchAll(/^\d+\. «(.*)»$/gm)].map((coincidencia) => coincidencia[1]);
}

function sinEtiquetas(texto: string): string {
	return texto
		.replace(/\[[^\]]+\]/g, '')
		.replace(/\s{2,}/g, ' ')
		.trim();
}

describe('frases de Capsulito', () => {
	it('CA-237: las 80 frases de registro son literales del anexo y en su orden', () => {
		expect(FRASES_REGISTRO.map((frase) => frase.texto)).toEqual(frasesDelAnexo('## Frases de registro (80)'));
		expect(FRASES_REGISTRO).toHaveLength(80);
	});

	it('CA-237: los 80 saludos son literales del anexo y en su orden', () => {
		expect(FRASES_SALUDO.map((frase) => frase.texto)).toEqual(frasesDelAnexo('## Frases de bienvenida (80)'));
		expect(FRASES_SALUDO).toHaveLength(80);
	});

	it('CA-237: el texto de voz solo añade etiquetas y dice las mismas palabras', () => {
		for (const frase of [...FRASES_REGISTRO, ...FRASES_SALUDO]) {
			expect(sinEtiquetas(frase.textoVoz)).toBe(frase.texto);
			expect(frase.textoVoz).toMatch(/\[[a-z ]+\]/);
		}
	});

	it('los identificadores son únicos, las poses existen y se encuentran por identificador', () => {
		const todas = [...FRASES_REGISTRO, ...FRASES_SALUDO];
		expect(new Set(todas.map((frase) => frase.id)).size).toBe(160);
		for (const frase of todas) {
			expect(POSES).toContain(frase.pose);
			expect(buscarFrase(frase.id)).toBe(frase);
		}
		expect(idsDeLista('registro')[0]).toBe('registro_01');
		expect(idsDeLista('saludo')[79]).toBe('saludo_80');
		expect(buscarFrase('no_existe')).toBeUndefined();
	});
});
