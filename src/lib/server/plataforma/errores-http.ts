// Respuestas JSON de error para las rutas sin formulario (`/api/*`). El mensaje es de textos.ts; nunca lleva el valor recibido.
import type { CodigoNegocio } from './errores';
import { textos } from '#lib/shared/textos';

export function respuestaError(estado: number, codigo: CodigoNegocio): Response {
	return Response.json({ codigo, mensaje: textos.errores[codigo] }, { status: estado });
}

// Estado HTTP de cada código de negocio. Es exhaustivo: añadir un código obliga a decidir su estado (ARCHITECTURE.md §6).
const ESTADO_POR_CODIGO: Record<CodigoNegocio, number> = {
	SIN_SESION: 401,
	SIN_PERMISO: 403,
	FUERA_DE_PLAZO: 409,
	YA_ANULADO: 409,
	VALIDACION: 400,
	REAUTENTICACION_REQUERIDA: 401,
	ULTIMO_ADMIN: 409,
	RELLENO_RECIENTE: 409,
	ESTADO_INCORRECTO: 409,
	CREDENCIALES_INCORRECTAS: 401,
	ENLACE_NO_VALIDO: 410,
	CONTRASENA_NO_VALIDA: 400,
	CORREO_DUPLICADO: 409,
	PRIVACIDAD_PENDIENTE: 403,
	LIMITE_SUPERADO: 429,
	NOMBRE_DUPLICADO: 409,
	FOTO_NO_VALIDA: 400,
	TIENE_REGISTROS: 409,
	CONFIRMACION_REQUERIDA: 409,
	NO_ES_EL_ULTIMO: 409,
	CAMBIO_CONCURRENTE: 409,
	TIPO_NO_DISPONIBLE: 400,
};

export function estadoDeNegocio(codigo: CodigoNegocio): number {
	return ESTADO_POR_CODIGO[codigo];
}
