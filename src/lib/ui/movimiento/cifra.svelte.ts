import { untrack } from 'svelte';
import { movimientoReducido } from './preferencias';

const DURACION_MS = 240;

/**
 * Cifra que pasa del valor visible al nuevo en 240 ms (RF-236). Se llama durante la inicialización del componente.
 * No anima al montar; si llega otro valor a mitad, continúa desde el valor visible. `visible` es el valor del fotograma
 * y `animando` indica que difiere del destino: la interfaz anuncia solo el destino.
 */
export function cifraAnimada(destino: () => number) {
	let visible = $state(untrack(destino));
	$effect(() => {
		const fin = destino();
		const inicio = untrack(() => visible);
		if (inicio === fin || movimientoReducido()) {
			visible = fin;
			return;
		}
		const t0 = performance.now();
		let cuadro = 0;
		const paso = (ahora: number) => {
			const progreso = Math.min(1, (ahora - t0) / DURACION_MS);
			const suave = 1 - (1 - progreso) ** 3;
			visible = progreso === 1 ? fin : Math.round(inicio + (fin - inicio) * suave);
			if (progreso < 1) cuadro = requestAnimationFrame(paso);
		};
		cuadro = requestAnimationFrame(paso);
		return () => cancelAnimationFrame(cuadro);
	});
	return {
		get visible() {
			return visible;
		},
		get animando() {
			return visible !== destino();
		},
	};
}
