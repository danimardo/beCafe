import type { RequestHandler } from './$types';
import { motivoSesionInvalida } from '#lib/server/auth';
import { borrarSuscripcion, registrarSuscripcion } from '#lib/server/notificaciones';
import { esErrorDeNegocio, estadoDeNegocio, registrarRechazo, respuestaError } from '#lib/server/plataforma';
import { esquemaBajaSuscripcion, esquemaSuscripcion } from '#lib/shared/contratos/push';

// Suscripción push (constitución XVII, excepción cerrada; contracts/api-push.md). El cliente es `lib/client/push`.
// La sesión se comprueba aquí y el caso de uso recibe el identificador de la persona. El cuerpo se limita a 4 KB.
const LIMITE_BYTES = 4 * 1024;

export const POST: RequestHandler = async ({ request, locals }) => {
	const { actor, ambiente } = locals;
	if (!actor) return respuestaSinSesion(locals.tokenNoValido, ambiente.db);

	const texto = await leerCuerpoAcotado(request);
	if (texto === null) return respuestaError(413, 'VALIDACION');

	const entrada = esquemaSuscripcion.safeParse(parsearJson(texto));
	if (!entrada.success) return respuestaError(400, 'VALIDACION');

	registrarSuscripcion(ambiente, actor.usuarioId, entrada.data);
	return new Response(null, { status: 201 });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const { actor, ambiente } = locals;
	if (!actor) return respuestaSinSesion(locals.tokenNoValido, ambiente.db);

	const texto = await leerCuerpoAcotado(request);
	if (texto === null) return respuestaError(413, 'VALIDACION');

	const entrada = esquemaBajaSuscripcion.safeParse(parsearJson(texto));
	if (!entrada.success) return respuestaError(400, 'VALIDACION');

	try {
		borrarSuscripcion(ambiente, actor.usuarioId, entrada.data.endpoint);
		return new Response(null, { status: 204 });
	} catch (causa) {
		if (!esErrorDeNegocio(causa)) throw causa;
		registrarRechazo(causa);
		return respuestaError(estadoDeNegocio(causa.codigo), causa.codigo);
	}
};

function respuestaSinSesion(tokenNoValido: string | undefined, db: Parameters<typeof motivoSesionInvalida>[0]): Response {
	// Una sesión cerrada por una baja responde 403 (D9); una sesión caducada, 401.
	const motivo = tokenNoValido ? motivoSesionInvalida(db, tokenNoValido) : 'sin_sesion';
	return motivo === 'baja' ? respuestaError(403, 'USUARIO_DE_BAJA') : respuestaError(401, 'SIN_SESION');
}

async function leerCuerpoAcotado(request: Request): Promise<string | null> {
	const declarado = Number(request.headers.get('content-length') ?? 0);
	if (declarado > LIMITE_BYTES) return null;
	const texto = await request.text();
	return new TextEncoder().encode(texto).length > LIMITE_BYTES ? null : texto;
}

function parsearJson(texto: string): unknown {
	try {
		return JSON.parse(texto);
	} catch {
		return undefined;
	}
}
