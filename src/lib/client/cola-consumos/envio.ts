import { esquemaConsumoV1 } from '#lib/shared/contratos/consumos';
import { borrarElemento, listarElementos, marcarRechazado } from './cola';

// Envío de la cola desde la página, no desde el service worker: Safari no admite Background Sync (plan D5, RNF-013).
// Un elemento se envía tras otro, en orden de hora del toque. Un fallo de red, de privacidad o del servidor deja el
// elemento en la cola y reintenta con espera creciente (30 s, 1 min, 2 min… hasta 10 min).

export type Enviador = (url: string, init: RequestInit) => Promise<Response>;

export type ResultadoEnvio = {
	/** Elementos que siguen pendientes tras el envío. */
	pendientes: number;
	/** Falta la sesión: el móvil conserva la cola y pide iniciar sesión (401). */
	sesionCaducada: boolean;
	/** Milisegundos hasta el próximo intento, o `null` si no hay nada que reintentar. */
	reintentoEnMs: number | null;
};

const ESPERAS_MS = [30_000, 60_000, 120_000, 240_000, 600_000] as const;

let enCurso: Promise<ResultadoEnvio> | undefined;
let intentos = 0;

/** Envía los pendientes de una persona. Dos llamadas seguidas comparten el mismo envío. */
export function enviarPendientes(usuarioId: string, enviador: Enviador = fetch): Promise<ResultadoEnvio> {
	enCurso ??= ejecutar(usuarioId, enviador).finally(() => {
		enCurso = undefined;
	});
	return enCurso;
}

async function ejecutar(usuarioId: string, enviador: Enviador): Promise<ResultadoEnvio> {
	const elementos = (await listarElementos(usuarioId)).filter((elemento) => elemento.estado === 'pendiente');
	let reintentar = false;
	for (const elemento of elementos) {
		const cuerpo = esquemaConsumoV1.parse({
			version: 1,
			clienteId: elemento.clienteId,
			tipoCapsulaId: elemento.tipoCapsulaId,
			invitado: elemento.invitado,
			horaGesto: elemento.horaGesto,
		});
		const resultado = await enviarUno(enviador, cuerpo);
		if (resultado.tipo === 'sesion') {
			return { pendientes: elementos.length, sesionCaducada: true, reintentoEnMs: null };
		}
		if (resultado.tipo === 'reintentar') reintentar = true;
	}
	const restantes = (await listarElementos(usuarioId)).filter((elemento) => elemento.estado === 'pendiente').length;
	if (!reintentar) {
		intentos = 0;
		return { pendientes: restantes, sesionCaducada: false, reintentoEnMs: null };
	}
	const espera = ESPERAS_MS[Math.min(intentos, ESPERAS_MS.length - 1)] ?? ESPERAS_MS[0];
	intentos += 1;
	return { pendientes: restantes, sesionCaducada: false, reintentoEnMs: espera };
}

type Paso = { tipo: 'enviado' | 'rechazado' | 'reintentar' | 'sesion' };

async function enviarUno(enviador: Enviador, cuerpo: ReturnType<typeof esquemaConsumoV1.parse>): Promise<Paso> {
	let respuesta: Response;
	try {
		respuesta = await enviador('/api/consumos', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(cuerpo),
		});
	} catch {
		return { tipo: 'reintentar' };
	}
	if (respuesta.status === 201 || respuesta.status === 200) {
		await borrarElemento(cuerpo.clienteId);
		return { tipo: 'enviado' };
	}
	if (respuesta.status === 401) return { tipo: 'sesion' };
	const codigo = await codigoDe(respuesta);
	if (respuesta.status === 403 && codigo === 'USUARIO_DE_BAJA') return rechazar(cuerpo.clienteId, codigo);
	if (respuesta.status === 409 || respuesta.status === 400) return rechazar(cuerpo.clienteId, codigo ?? 'VALIDACION');
	return { tipo: 'reintentar' };
}

async function rechazar(clienteId: string, codigo: string): Promise<Paso> {
	await marcarRechazado(clienteId, codigo);
	return { tipo: 'rechazado' };
}

/** Código de la respuesta de error, si el cuerpo lo trae. El valor recibido nunca se registra. */
async function codigoDe(respuesta: Response): Promise<string | undefined> {
	const cuerpo: unknown = await respuesta.json().catch(() => undefined);
	if (typeof cuerpo !== 'object' || cuerpo === null || !('codigo' in cuerpo)) return undefined;
	return typeof cuerpo.codigo === 'string' ? cuerpo.codigo : undefined;
}
