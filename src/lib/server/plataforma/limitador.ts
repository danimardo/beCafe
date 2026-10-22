// Límite de frecuencia en ventana fija (PEND-034, research R14). Es un recurso de proceso válido porque hay una sola
// instancia (RT-010). Cada clave cuenta por separado: aquí, la sesión.
export type Limitador = { admite(clave: string, instante: string, cantidad?: number): boolean };

export function crearLimitador(opciones: { maximo: number; ventanaMs: number }): Limitador {
	const ventanas = new Map<string, { inicio: number; usados: number }>();
	return {
		admite(clave, instante, cantidad = 1) {
			const ahora = Date.parse(instante);
			const ventana = ventanas.get(clave);
			if (!ventana || ahora - ventana.inicio >= opciones.ventanaMs) {
				ventanas.set(clave, { inicio: ahora, usados: cantidad });
				return cantidad <= opciones.maximo;
			}
			if (ventana.usados + cantidad > opciones.maximo) return false;
			ventana.usados += cantidad;
			return true;
		},
	};
}
