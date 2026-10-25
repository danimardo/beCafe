/** Fechas en español: «20 oct», «20 oct 2026». */
export function formatDate(d: Date | string, withYear = false): string {
	const date = typeof d === 'string' ? new Date(d) : d;
	return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) }).replace('.', '');
}

const MINUTO_MS = 60_000;

/** Antigüedad de un instante respecto a otro: «hace un momento», «hace 20 min», «hace 3 h», «hace 2 días» (RF-170). Sin reloj propio. */
export function formatearHace(desde: string, ahora: string): string {
	const minutos = Math.floor((Date.parse(ahora) - Date.parse(desde)) / MINUTO_MS);
	if (minutos < 1) return 'hace un momento';
	if (minutos < 60) return `hace ${minutos} min`;
	const horas = Math.floor(minutos / 60);
	if (horas < 24) return `hace ${horas} h`;
	const dias = Math.floor(horas / 24);
	return dias === 1 ? 'hace 1 día' : `hace ${dias} días`;
}

/** Día y hora de un instante en la zona `Europe/Madrid`: «25 oct, 14:05» (constitución V). */
export function formatearFechaHoraMadrid(instante: string): string {
	const fecha = new Date(instante);
	const dia = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }).replace('.', '');
	return `${dia}, ${formatearHoraMadrid(instante)}`;
}

/** Hora de un instante en la zona `Europe/Madrid`: «14:05». */
export function formatearHoraMadrid(instante: string): string {
	return new Date(instante).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
}
