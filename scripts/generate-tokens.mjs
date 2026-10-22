// Genera src/tokens.css a partir de tokens/tokens.json (fuente única de verdad).
// Uso: npm run tokens   (se ejecuta solo antes de dev, build y check)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const t = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'));
const themes = t.color.themes.map((x) => x.id);
const first = themes[0];
const val = (v, theme) => (typeof v === 'string' ? v : (v[theme] ?? v[first]));
const out = [`/* Generado desde tokens/tokens.json — NO editar a mano. Ejecuta: npm run tokens */`];

// 1. Variables por tema (color y sombra)
themes.forEach((theme, i) => {
	const sel = i === 0 ? `:root, [data-theme='${theme}']` : `[data-theme='${theme}']`;
	const lines = [...t.color.tokens, ...t.shadow.tokens].map((x) => `\t--${x.name}: ${val(x.value, theme)};`);
	out.push(`${sel} {\n${lines.join('\n')}\n}`);
});

// 2. Mapeo a Tailwind 4: bg-glass, text-ink, border-glass-border, rounded-panel, font-serif…
const th = [];
for (const x of t.color.tokens) th.push(`\t--color-${x.name}: var(--${x.name});`);
for (const x of t.radius.tokens) th.push(`\t--${x.name}: ${x.value};`);
th.push(`\t--font-sans: ${t.type.families.sans};`);
th.push(`\t--font-serif: ${t.type.families.serif};`);
out.push(`@theme inline {\n${th.join('\n')}\n}`);

// 3. Variables fijas
const fixed = t.blur.tokens.map((x) => `\t--${x.name}: ${x.value};`);
out.push(`:root {\n${fixed.join('\n')}\n}`);

// 4. Estilos tipográficos como utilidades: type-display, type-body…
for (const g of t.type.groups) {
	for (const s of g.styles) {
		const fam = g.family === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)';
		const props = [`font-family: ${fam}`, `font-size: ${s.fontSize}`, `line-height: ${s.lineHeight}`, `font-weight: ${s.fontWeight}`];
		if (s.letterSpacing) props.push(`letter-spacing: ${s.letterSpacing}`);
		if (s.name === 'eyebrow') props.push('text-transform: uppercase');
		if (s.name === 'amount') props.push('font-variant-numeric: tabular-nums');
		out.push(`@utility type-${s.name} {\n\t${props.join(';\n\t')};\n}`);
	}
}
writeFileSync(join(root, 'src/tokens.css'), out.join('\n\n') + '\n');
console.log('src/tokens.css generado');
