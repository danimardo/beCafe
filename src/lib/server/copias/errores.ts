import type { CODIGOS_COPIA } from './esquema';

// Fallo técnico de una copia con su código del conjunto cerrado (plan F8 D3). Nunca lleva la URL, las cabeceras ni el cuerpo de S3.
export type CodigoCopia = (typeof CODIGOS_COPIA)[number];

export class ErrorCopia extends Error {
	readonly codigo: CodigoCopia;
	readonly estadoHttp: number | undefined;

	constructor(codigo: CodigoCopia, estadoHttp?: number) {
		super(codigo);
		this.name = 'ErrorCopia';
		this.codigo = codigo;
		this.estadoHttp = estadoHttp;
	}
}

/** Códigos de rechazo de una restauración (plan F14, contracts/restauracion.md). Conjunto cerrado. */
export const CODIGOS_RESTAURACION = ['SIN_S3', 'NO_ENCONTRADA', 'EN_CURSO', 'BUCKET', 'RESGUARDO', 'DANADA', 'VERSION_NUEVA'] as const;
export type CodigoRestauracion = (typeof CODIGOS_RESTAURACION)[number];

/** Rechazo esperado de una restauración. Nada se ha sustituido cuando se lanza (RF-255). */
export class ErrorRestauracion extends Error {
	readonly codigo: CodigoRestauracion;
	readonly estadoHttp: number | undefined;

	constructor(codigo: CodigoRestauracion, estadoHttp?: number) {
		super(codigo);
		this.name = 'ErrorRestauracion';
		this.codigo = codigo;
		this.estadoHttp = estadoHttp;
	}
}

/** Rechazos de la copia manual y de la descarga (plan F17 D1, D3). Conjunto cerrado; ninguno se guarda en `copia_seguridad`. */
export const CODIGOS_OPERACION_COPIA = ['SIN_S3', 'NO_ENCONTRADA', 'EN_CURSO'] as const;
export type CodigoOperacionCopia = (typeof CODIGOS_OPERACION_COPIA)[number];

/** Rechazo esperado de la copia manual o de la descarga. No ha cambiado ningún dato cuando se lanza. */
export class ErrorOperacionCopia extends Error {
	readonly codigo: CodigoOperacionCopia;

	constructor(codigo: CodigoOperacionCopia) {
		super(codigo);
		this.name = 'ErrorOperacionCopia';
		this.codigo = codigo;
	}
}

export const ESTADO_OPERACION_COPIA: Record<CodigoOperacionCopia, number> = { SIN_S3: 404, NO_ENCONTRADA: 404, EN_CURSO: 409 };
