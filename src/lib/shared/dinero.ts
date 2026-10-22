/* ---------- Dinero (RN-020: importes en céntimos enteros) ---------- */

const MINUS = '−'; // signo menos tipográfico: −
const eur = new Intl.NumberFormat('es-ES', {
	style: 'currency',
	currency: 'EUR',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});
const plain = new Intl.NumberFormat('es-ES', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
	useGrouping: false,
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
