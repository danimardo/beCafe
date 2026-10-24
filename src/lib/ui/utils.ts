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

/** Color CSS de un tipo de cápsula: los tipos guardan un token (`cap-lungo`) y los colores libres (hex) pasan tal cual. */
export function colorCapsulaCss(color: string): string {
	return color.startsWith('cap-') ? `var(--${color})` : color;
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
