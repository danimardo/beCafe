// Valores del formulario de cápsulas: se devuelven al formulario tras un rechazo (constitución XVII). Nunca llevan la foto.

export type ValoresCapsula = {
	nombre: string;
	marca: string;
	intensidad: string;
	color: string;
	umbralMinimo: string;
};

function textoDe(valor: unknown): string {
	return typeof valor === 'string' ? valor : '';
}

export function valoresDeFormulario(datos: Record<string, unknown>): ValoresCapsula {
	return {
		nombre: textoDe(datos.nombre),
		marca: textoDe(datos.marca),
		intensidad: textoDe(datos.intensidad),
		color: textoDe(datos.color),
		umbralMinimo: textoDe(datos.umbralMinimo),
	};
}

/** Lee la foto elegida como bytes. Sin archivo, devuelve `undefined`. */
export async function bytesDeFoto(foto: File | undefined): Promise<Uint8Array | undefined> {
	return foto ? new Uint8Array(await foto.arrayBuffer()) : undefined;
}
