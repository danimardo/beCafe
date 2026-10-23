import type { RequestHandler } from './$types';
import { motivoSesionInvalida } from '#lib/server/auth';
import { registrarConsumo } from '#lib/server/economia';
import { esErrorDeNegocio, estadoDeNegocio, registrarRechazo, respuestaError } from '#lib/server/plataforma';
import { esquemaConsumoApi } from '#lib/shared/contratos/consumos';

// Cola sin conexión (constitución XVII, excepción cerrada): el único cliente es `lib/client/cola-consumos`.
// Un solo caso de uso (`registrarConsumo`) para el toque con red y para la cola (plan D1). Contrato v1 en
// contracts/api-consumos.md. El cuerpo se limita a 2 KB y una clave o versión desconocidas responden 400.
const LIMITE_BYTES = 2 * 1024;

export const POST: RequestHandler = async ({ request, locals }) => {
	const { actor, ambiente } = locals;
	if (!actor) {
		// Una sesión cerrada por una baja responde 403 (D9); una sesión caducada, 401. Solo lo sabe quien tiene la cookie.
		const motivo = locals.tokenNoValido ? motivoSesionInvalida(ambiente.db, locals.tokenNoValido) : 'sin_sesion';
		return motivo === 'baja' ? respuestaError(403, 'USUARIO_DE_BAJA') : respuestaError(401, 'SIN_SESION');
	}

	const texto = await leerCuerpoAcotado(request);
	if (texto === null) return respuestaError(413, 'VALIDACION');

	const entrada = esquemaConsumoApi.safeParse(parsearJson(texto));
	if (!entrada.success) return respuestaError(400, 'VALIDACION');

	try {
		const { id, precio, descuadre, duplicado } = registrarConsumo(ambiente, actor, {
			clienteId: entrada.data.clienteId,
			tipoCapsulaId: entrada.data.tipoCapsulaId,
			invitado: entrada.data.invitado,
			horaGesto: entrada.data.horaGesto,
			via: 'cola',
		});
		return Response.json({ id, precio, descuadre }, { status: duplicado ? 200 : 201 });
	} catch (causa) {
		if (!esErrorDeNegocio(causa)) throw causa;
		registrarRechazo(causa);
		return respuestaError(estadoDeNegocio(causa.codigo), causa.codigo);
	}
};

/** Lee el cuerpo sin pasar de 2 KB. Devuelve null si es más grande, aunque la cabecera no lo declare. */
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
