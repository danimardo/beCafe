// Consultas de movimiento compartidas por las acciones de esta carpeta (RF-233 a RF-236).
// Con `prefers-reduced-motion: reduce` ninguna acción mueve nada; el estado final se ve igual.

export function movimientoReducido(): boolean {
	return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function punteroFino(): boolean {
	return typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
}
