/** Fechas en español: «20 oct», «20 oct 2026». */
export function formatDate(d: Date | string, withYear = false): string {
	const date = typeof d === 'string' ? new Date(d) : d;
	return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) }).replace('.', '');
}
