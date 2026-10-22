import type { RequestHandler } from './$types';
import {
	CODIGOS_CLIENTE,
	registrar,
	registrarDesdeCliente,
	respuestaError,
	type Ambiente,
	type CodigoClienteEvento,
} from '#lib/server/plataforma';
import { esquemaRegistroCliente } from '#lib/shared/contratos/registro-cliente';

// Registro de eventos del navegador (constitución XVI, research R14, PEND-034). Exige sesión y limita tamaño y frecuencia.
const LIMITE_BYTES = 16 * 1024;

export const POST: RequestHandler = async ({ request, locals }) => {
	const { actor, ambiente } = locals;
	if (!actor) return respuestaError(401, 'SIN_SESION');
	const instante = ambiente.reloj.ahora();

	const tipo = request.headers.get('content-type') ?? '';
	if (!tipo.startsWith('application/json')) return respuestaError(415, 'VALIDACION');

	const texto = await request.text();
	if (new TextEncoder().encode(texto).length > LIMITE_BYTES) {
		avisarRechazo(ambiente, actor.sesionIdHash, instante, 'tamano');
		return respuestaError(413, 'LIMITE_SUPERADO');
	}

	const entrada = esquemaRegistroCliente.safeParse(parsearJson(texto));
	if (!entrada.success) {
		avisarRechazo(ambiente, actor.sesionIdHash, instante, 'esquema');
		return respuestaError(400, 'VALIDACION');
	}

	if (!ambiente.limitadorRegistro.admite(actor.sesionIdHash, instante, entrada.data.eventos.length)) {
		avisarRechazo(ambiente, actor.sesionIdHash, instante, 'frecuencia');
		return respuestaError(429, 'LIMITE_SUPERADO');
	}

	for (const evento of entrada.data.eventos) {
		if (esCodigoCliente(evento.codigo)) registrarDesdeCliente(evento.codigo, evento.campos);
	}
	return new Response(null, { status: 204 });
};

/** Como mucho un aviso de rechazo por sesión y minuto, para que un cliente roto no inunde el registro. */
function avisarRechazo(ambiente: Ambiente, sesionIdHash: string, instante: string, motivo: 'tamano' | 'frecuencia' | 'esquema'): void {
	if (ambiente.limitadorAvisos.admite(sesionIdHash, instante)) {
		registrar('cliente.registro_rechazado', { motivo });
	}
}

function parsearJson(texto: string): unknown {
	try {
		return JSON.parse(texto);
	} catch {
		return undefined;
	}
}

function esCodigoCliente(codigo: string): codigo is CodigoClienteEvento {
	return CODIGOS_CLIENTE.some((permitido) => permitido === codigo);
}
