import { error, fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { estadoDeNegocio, esErrorDeNegocio, RecursoNoEncontrado, registrarRechazo, type CodigoNegocio } from '#lib/server/plataforma';
import { fallo } from '#lib/shared/contratos/formularios';
import { textos } from '#lib/shared/textos';

export { fallo };

// Campo del formulario al que pertenece cada rechazo. Lo que no tiene campo va al aviso general.
const CAMPO_POR_CODIGO: Partial<Record<CodigoNegocio, string>> = {
	REAUTENTICACION_REQUERIDA: 'contrasenaActual',
	CREDENCIALES_INCORRECTAS: 'contrasenaActual',
	CORREO_DUPLICADO: 'email',
	CONTRASENA_NO_VALIDA: 'contrasenaNueva',
	NOMBRE_DUPLICADO: 'nombre',
	FOTO_NO_VALIDA: 'foto',
};

/** Fallo de formulario por una regla de negocio. `valores` nunca lleva contraseñas (constitución XVII). */
export function falloDeNegocio(codigo: CodigoNegocio, valores: Record<string, unknown>) {
	const campo = CAMPO_POR_CODIGO[codigo] ?? 'general';
	return fail(estadoDeNegocio(codigo), { errores: { [campo]: { codigo, mensaje: textos.errores[codigo] } }, valores });
}

/** Ejecuta un caso de uso desde una action: el rechazo esperado vuelve como fallo y un recurso inexistente como 404. */
export async function ejecutarAccion<T>(
	valores: Record<string, unknown>,
	operacion: () => T | Promise<T>,
): Promise<T | ReturnType<typeof falloDeNegocio>> {
	try {
		return await operacion();
	} catch (causa) {
		if (causa instanceof RecursoNoEncontrado) error(404, textos.admin.personaNoEncontrada);
		if (!esErrorDeNegocio(causa)) throw causa;
		registrarRechazo(causa);
		return falloDeNegocio(causa.codigo, valores);
	}
}

/** Traduce el fallo de una carga de página: sin sesión a la entrada, sin permiso y sin recurso a su error HTTP. */
export function errorDeCarga(causa: unknown): never {
	if (causa instanceof RecursoNoEncontrado) error(404, textos.admin.personaNoEncontrada);
	if (esErrorDeNegocio(causa) && causa.codigo === 'SIN_PERMISO') error(403, textos.errores.SIN_PERMISO);
	if (esErrorDeNegocio(causa) && causa.codigo === 'SIN_SESION') redirect(303, resolve('/(auth)/login'));
	throw causa;
}
