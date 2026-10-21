export interface UndoToastData {
	/** Identificador único; cambia en cada aviso para reiniciar el temporizador. */
	id: string;
	title: string;
	detail?: string;
	/** Color de la cápsula (hex) para el icono. */
	color?: string;
	photoUrl?: string | null;
	/** Si se indica, el aviso lleva el botón «Deshacer». Sin él es un aviso informativo. */
	onundo?: () => void;
	/** Icono: «capsula» (por defecto, miniatura de la cápsula), «ok» (hecho) o «warning» (aviso). */
	kind?: 'capsula' | 'ok' | 'warning';
	/** Línea de advertencia bajo el detalle, p. ej. el descuadre de stock (RF-017). */
	warning?: string;
	/** Milisegundos hasta desaparecer. RF-013: 5000. */
	duration?: number;
}

class ToastState {
	current = $state<UndoToastData | null>(null);
	/** Muestra el aviso «Deshacer». Sustituye al anterior si lo había. */
	showUndo(data: Omit<UndoToastData, 'id'>) {
		this.current = { ...data, id: crypto.randomUUID() };
	}
	/** Aviso informativo sin «Deshacer» (p. ej. «Rol cambiado»). */
	notify(data: Omit<UndoToastData, 'id' | 'onundo'>) {
		this.current = { kind: 'ok', ...data, id: crypto.randomUUID() };
	}
	dismiss() {
		this.current = null;
	}
}

export const toasts = new ToastState();
