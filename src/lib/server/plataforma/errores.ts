import { registrar } from './registro';

// Errores esperados de negocio, con un conjunto cerrado de códigos (ARCHITECTURE.md §6, R12).
export const CODIGOS_NEGOCIO = [
	'SIN_SESION',
	'SIN_PERMISO',
	'FUERA_DE_PLAZO',
	'YA_ANULADO',
	'VALIDACION',
	'REAUTENTICACION_REQUERIDA',
	'ULTIMO_ADMIN',
	'RELLENO_RECIENTE',
	'ESTADO_INCORRECTO',
	'CREDENCIALES_INCORRECTAS',
	'ENLACE_NO_VALIDO',
	'CONTRASENA_NO_VALIDA',
	'CORREO_DUPLICADO',
	'PRIVACIDAD_PENDIENTE',
	'LIMITE_SUPERADO',
	'NOMBRE_DUPLICADO',
	'FOTO_NO_VALIDA',
	'TIENE_REGISTROS',
	'CONFIRMACION_REQUERIDA',
	'NO_ES_EL_ULTIMO',
	'CAMBIO_CONCURRENTE',
	'TIPO_NO_DISPONIBLE',
	'TIPO_SIN_COSTE',
	'USUARIO_DE_BAJA',
] as const;

export type CodigoNegocio = (typeof CODIGOS_NEGOCIO)[number];

/** Rechazo esperado de una regla. El mensaje se toma de `textos.errores` en la capa de presentación. */
export class ErrorDeNegocio extends Error {
	readonly codigo: CodigoNegocio;

	constructor(codigo: CodigoNegocio) {
		super(codigo);
		this.name = 'ErrorDeNegocio';
		this.codigo = codigo;
	}
}

export function esErrorDeNegocio(error: unknown): error is ErrorDeNegocio {
	return error instanceof ErrorDeNegocio;
}

/** Registra un rechazo esperado con su código, sin traza (ARCHITECTURE.md §9). */
export function registrarRechazo(error: ErrorDeNegocio): void {
	registrar('operacion.rechazada', { codigo: error.codigo });
}

/** Recurso inexistente: la ruta lo traduce a `error(404)` (constitución XVII). No es un rechazo de negocio. */
export class RecursoNoEncontrado extends Error {
	constructor() {
		super('RECURSO_NO_ENCONTRADO');
		this.name = 'RecursoNoEncontrado';
	}
}
