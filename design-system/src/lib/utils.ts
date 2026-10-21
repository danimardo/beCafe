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

/* ---------- Dinero (RN-020: importes en céntimos enteros) ---------- */

const MINUS = '−'; // signo menos tipográfico: −
const eur = new Intl.NumberFormat('es-ES', {
	style: 'currency',
	currency: 'EUR',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
const plain = new Intl.NumberFormat('es-ES', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
	useGrouping: false
});

/** 2345 -> «23,45 €». Con `signed`, añade «+» a los positivos. Los negativos siempre llevan «−». */
export function formatMoney(cents: number, opts: { signed?: boolean } = {}): string {
	const abs = eur.format(Math.abs(cents) / 100);
	if (cents < 0) return `${MINUS}${abs}`;
	if (cents > 0 && opts.signed) return `+${abs}`;
	return abs;
}

/** 2345 -> «23,45» (sin símbolo; para valores de campo). */
export function formatMoneyPlain(cents: number): string {
	return plain.format(cents / 100);
}

/** Interpreta «17», «17,5», «17.50» o «1.234,50». Devuelve céntimos enteros o null si no es válido. */
export function parseMoney(text: string): number | null {
	let s = text.trim().replace(/\s|€/g, '');
	if (!s) return null;
	if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
	else s = s.replace(',', '.');
	if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
	return Math.round(parseFloat(s) * 100);
}

/** Coste medio en diezmilésimas de euro (RN-020): 3483 -> «0,3483 €». */
export function formatUnitCost(tenThousandths: number): string {
	return `${(tenThousandths / 10000).toLocaleString('es-ES', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} €`;
}

/** Fechas en español: «20 oct», «20 oct 2026». */
export function formatDate(d: Date | string, withYear = false): string {
	const date = typeof d === 'string' ? new Date(d) : d;
	return date
		.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })
		.replace('.', '');
}

export function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '')).toUpperCase();
}

/* ---------- Botones: clases compartidas por Button, ConfirmDialog, etc. ---------- */

export type ButtonVariant = 'primary' | 'soft' | 'ghost' | 'danger' | 'glass';
export type ButtonSize = 'md' | 'lg';

const buttonVariants: Record<ButtonVariant, string> = {
	primary: 'bg-accent text-on-accent',
	soft: 'bg-accent-soft text-ink',
	ghost: 'text-accent hover:bg-accent-soft',
	danger: 'bg-negative text-on-negative',
	glass: 'glass text-ink'
};
const buttonSizes: Record<ButtonSize, string> = {
	md: 'min-h-11 px-5 text-[15px]',
	lg: 'min-h-[52px] px-6 text-[17px]'
};

export function buttonClasses(
	variant: ButtonVariant = 'primary',
	size: ButtonSize = 'md',
	block = false,
	extra?: string
): string {
	return cn(
		'inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold leading-none',
		'motion-safe:transition motion-safe:duration-150 active:scale-[0.98] hover:brightness-95',
		'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
		buttonVariants[variant],
		buttonSizes[size],
		block && 'w-full',
		extra
	);
}
