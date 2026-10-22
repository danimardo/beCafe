import type { SubmitFunction } from '$app/forms';
import { textos } from '#lib/shared/textos';
import type { EstadoAvisos } from './contextos/avisos.svelte';

// Opciones de `use:enhance` compartidas (constitución XVII). Ante un fallo se conserva lo escrito: no se llama a `update` con reset.
export function opcionesFormulario(avisos: EstadoAvisos, confirmacion?: string): SubmitFunction {
	return () =>
		async ({ result, update }) => {
			if (result.type === 'error') {
				const sinRed = result.error instanceof TypeError;
				avisos.informar({ title: sinRed ? textos.sinConexion : textos.errorNoPrevisto, kind: 'warning' });
				return;
			}
			if (result.type === 'success' && confirmacion) avisos.informar({ title: confirmacion });
			await update({ reset: result.type === 'success' });
		};
}
