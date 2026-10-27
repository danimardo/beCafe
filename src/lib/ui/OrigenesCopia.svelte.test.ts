import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import '../../app.css';
import OrigenesCopia from './OrigenesCopia.svelte';

// F17 US3 (RF-290, CA-290): la confirmación de restaurar muestra los dos orígenes y destaca la diferencia con texto.
describe('OrigenesCopia', () => {
	const base = { etiquetaCopia: 'Origen de la copia', etiquetaSistema: 'Este sistema', origenSistema: 'becafe.mardomingo.com' };

	it('CA-290: muestra el origen de la copia y el del sistema', async () => {
		await render(OrigenesCopia, { ...base, origenCopia: 'Local' });

		await expect.element(page.getByText('Origen de la copia:', { exact: true })).toBeVisible();
		await expect.element(page.getByText('Local', { exact: true })).toBeVisible();
		await expect.element(page.getByText('becafe.mardomingo.com', { exact: true })).toBeVisible();
	});

	it('CA-290: con orígenes distintos destaca la diferencia con un aviso de texto, anunciado sin mover el foco', async () => {
		await render(OrigenesCopia, {
			...base,
			origenCopia: 'Local',
			aviso: 'Esta copia se hizo en Local y este sistema es becafe.mardomingo.com.',
		});

		const aviso = page.getByRole('status');
		await expect.element(aviso).toBeVisible();
		await expect.element(page.getByText('Esta copia se hizo en Local', { exact: false })).toBeVisible();
	});

	it('CA-290: con el mismo origen no hay aviso', async () => {
		await render(OrigenesCopia, { ...base, origenCopia: 'becafe.mardomingo.com' });

		await expect.element(page.getByRole('status')).not.toBeInTheDocument();
	});
});
