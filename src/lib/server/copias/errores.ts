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
