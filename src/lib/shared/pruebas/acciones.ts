import type { RequestEvent } from '@sveltejs/kit';
import type { RouteId } from '$app/types';
import { z } from 'zod';

// Evento falso para probar una action o un `+server.ts` sin levantar el servidor (docs/pruebas.md §8). Sin aserciones de tipo.

export type OpcionesEvento<P extends Record<string, string>, R extends RouteId> = {
	locals: App.Locals;
	ruta: R;
	params: P;
	url?: string;
	metodo?: string;
	cuerpo?: BodyInit;
	cabeceras?: Record<string, string>;
};

export function crearEventoAccion<P extends Record<string, string>, R extends RouteId>(opciones: OpcionesEvento<P, R>): RequestEvent<P, R> {
	const url = new URL(opciones.url ?? 'https://becafe.test/');
	const request = new Request(url, { method: opciones.metodo ?? 'POST', headers: opciones.cabeceras, body: opciones.cuerpo });
	const galletas = new Map<string, string>();
	const cookies = {
		get: (nombre: string) => galletas.get(nombre),
		getAll: () => [...galletas].map(([name, value]) => ({ name, value })),
		set: (nombre: string, valor: string) => {
			galletas.set(nombre, valor);
		},
		delete: (nombre: string) => {
			galletas.delete(nombre);
		},
		serialize: (nombre: string, valor: string) => `${nombre}=${valor}`,
		parse: () => ({ name: '', value: '' }),
	};
	return {
		cookies,
		fetch: globalThis.fetch,
		getClientAddress: () => '127.0.0.1',
		locals: opciones.locals,
		params: opciones.params,
		request,
		route: { id: opciones.ruta },
		setHeaders: () => undefined,
		url,
		isDataRequest: false,
		isSubRequest: false,
		isRemoteRequest: false,
		platform: undefined,
		// `Span` de OpenTelemetry es un peer opcional de SvelteKit sin instalar: el tipo no resuelve. Sin tracing, nada que construir.
		tracing: { enabled: false, root: undefined, current: undefined },
	};
}

// `ActionFailure` solo es tipo en SvelteKit 3: se reconoce por su forma (`status` y `data`), validada con Zod.
const esquemaFallo = z.object({ status: z.number().int(), data: z.record(z.string(), z.unknown()) });

/** Devuelve el estado y los datos de un `fail(estado, datos)`. Cualquier otro resultado falla la prueba. */
export function desenvolverFallo(resultado: unknown): { estado: number; datos: Record<string, unknown> } {
	const fallo = esquemaFallo.safeParse(resultado);
	if (!fallo.success) throw new Error('Se esperaba un fallo (fail) y la acción devolvió otro resultado');
	return { estado: fallo.data.status, datos: fallo.data.data };
}
