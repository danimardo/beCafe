import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import UndoToast from './UndoToast.svelte';
import type { AvisoDeshacer } from './contextos/avisos.svelte';

// «Deshacer» (RF-013, RF-171): el aviso dura 5 s, el botón llama a la función recibida y el aviso se cierra al vencer.
// Solo se simula el temporizador; el puntero y el foco se usan de verdad.
describe('UndoToast', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function aviso(onundo?: () => void): AvisoDeshacer {
		return { id: 'a1', title: 'Ristretto', detail: 'Consumo registrado', onundo, kind: 'capsula' };
	}

	it('RF-013: muestra el aviso con «Deshacer» y lo cierra a los 5 s', async () => {
		const cerrar = vi.fn();
		await render(UndoToast, { toast: aviso(() => {}), onclose: cerrar });

		await expect.element(page.getByText('Ristretto')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Deshacer' })).toBeVisible();

		vi.advanceTimersByTime(4_999);
		expect(cerrar).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(cerrar).toHaveBeenCalledTimes(1);
	});

	it('«Deshacer» llama a la función recibida y cierra el aviso', async () => {
		const deshacer = vi.fn();
		const cerrar = vi.fn();
		await render(UndoToast, { toast: aviso(deshacer), onclose: cerrar });

		await page.getByRole('button', { name: 'Deshacer' }).click();

		expect(deshacer).toHaveBeenCalledTimes(1);
		expect(cerrar).toHaveBeenCalledTimes(1);
	});

	it('un aviso informativo no ofrece «Deshacer», sino un botón para cerrarlo', async () => {
		await render(UndoToast, { toast: { id: 'a2', title: 'Rol cambiado', kind: 'ok' }, onclose: () => {} });

		await expect.element(page.getByRole('button', { name: 'Cerrar aviso' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Deshacer' })).not.toBeInTheDocument();
	});
});
