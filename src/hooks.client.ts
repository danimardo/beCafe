import type { HandleClientError } from '@sveltejs/kit/hooks';
import { registrarEnCliente } from '#lib/client/registro';
import { textos } from '#lib/shared/textos';

/** Envía al servidor un error no previsto del navegador, solo con su tipo y su traza (constitución XVI). */
function notificar(error: unknown): void {
	registrarEnCliente({
		codigo: 'cliente.error_no_previsto',
		instante: new Date().toISOString(),
		campos: {
			tipo: (error instanceof Error ? error.name : 'desconocido').slice(0, 80),
			pila: (error instanceof Error ? (error.stack ?? error.message) : '').slice(0, 4000),
		},
	});
}

// Errores que SvelteKit no pasa por `handleError`: manejadores de eventos y promesas sin capturar.
window.addEventListener('error', (evento) => notificar(evento.error));
window.addEventListener('unhandledrejection', (evento) => notificar(evento.reason));

export const handleError: HandleClientError = (entrada) => {
	if (entrada.kind !== 'unknown') return undefined;
	notificar(entrada.error);
	return { message: textos.errorNoPrevisto };
};
