import { coloresCapsula, esColorPropio } from '#lib/shared/capsulas/color-propio';

/** Valores aceptados por cn(). Incluye el tipo que Svelte permite en `class`. */
export type ClassValue = string | number | bigint | boolean | null | undefined | ClassValue[] | Record<string, unknown>;

/** Une clases CSS ignorando valores vacíos (acepta cadenas, listas y objetos, como clsx).
 *  No resuelve conflictos entre utilidades de Tailwind: no pases por `class` utilidades
 *  que contradigan las que ya pone el componente. */
export function cn(...parts: ClassValue[]): string {
	const out: string[] = [];
	const walk = (v: ClassValue) => {
		if (!v && v !== 0) return;
		if (typeof v === 'string' || typeof v === 'number') out.push(String(v));
		else if (Array.isArray(v)) v.forEach(walk);
		else if (typeof v === 'object') for (const [k, on] of Object.entries(v)) if (on) out.push(k);
	};
	parts.forEach(walk);
	return out.join(' ');
}

/** Color CSS de un token de cápsula (`cap-lungo`). Un color propio no se pinta con esta función: usa `estiloColorCapsula`. */
export function colorCapsulaCss(color: string): string {
	return color.startsWith('cap-') ? `var(--${color})` : `var(--cap-intenso)`;
}

/**
 * Estilo en línea que define `--cap-color` (relleno) y `--cap-limite` (aro) de un tipo de cápsula.
 * Un token usa su variable del sistema de diseño. Un color propio (`#rrggbb`, RF-269) lleva los valores calculados para
 * cada tema (RF-270); la regla `[style*='--cap-propio-claro']` de `app.css` elige los del tema activo.
 */
export function estiloColorCapsula(color: string): string {
	if (!esColorPropio(color)) {
		const variable = colorCapsulaCss(color);
		return `--cap-color:${variable};--cap-limite:${variable}`;
	}
	const { claro, oscuro } = coloresCapsula(color);
	return [
		`--cap-propio-claro:${claro.relleno}`,
		`--cap-propio-limite-claro:${claro.limite}`,
		`--cap-propio-texto-claro:${claro.texto}`,
		`--cap-propio-oscuro:${oscuro.relleno}`,
		`--cap-propio-limite-oscuro:${oscuro.limite}`,
		`--cap-propio-texto-oscuro:${oscuro.texto}`,
	].join(';');
}

/* ---------- Botones: clases compartidas por Button, ConfirmDialog, etc. ---------- */

export type ButtonVariant = 'primary' | 'soft' | 'ghost' | 'danger' | 'glass';
export type ButtonSize = 'md' | 'lg';

const buttonVariants: Record<ButtonVariant, string> = {
	primary: 'bg-accent text-on-accent',
	soft: 'bg-accent-soft text-ink',
	ghost: 'text-accent hover:bg-accent-soft',
	danger: 'bg-negative text-on-negative',
	glass: 'glass text-ink',
};
const buttonSizes: Record<ButtonSize, string> = {
	md: 'min-h-11 px-5 text-[15px]',
	lg: 'min-h-[52px] px-6 text-[17px]',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', block = false, extra?: string): string {
	return cn(
		'inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold leading-none',
		'motion-safe:transition motion-safe:duration-150 active:scale-[0.98] hover:brightness-95',
		'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
		buttonVariants[variant],
		buttonSizes[size],
		block && 'w-full',
		extra,
	);
}
