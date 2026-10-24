import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import PanelGrid from './PanelGrid.svelte';

describe('PanelGrid (RF-182, CA-182)', () => {
	it('CA-182: mantiene el orden del DOM resumen → principal → secundario', async () => {
		const resumen = createRawSnippet(() => ({ render: () => '<p>Bloque resumen</p>' }));
		const principal = createRawSnippet(() => ({ render: () => '<p>Bloque principal</p>' }));
		const secundario = createRawSnippet(() => ({ render: () => '<p>Bloque secundario</p>' }));

		const { container } = await render(PanelGrid, { resumen, principal, secundario });

		await expect.element(page.getByText('Bloque resumen')).toBeVisible();
		await expect.element(page.getByText('Bloque principal')).toBeVisible();
		await expect.element(page.getByText('Bloque secundario')).toBeVisible();

		const textoCompleto = container.textContent;
		const idxResumen = textoCompleto.indexOf('Bloque resumen');
		const idxPrincipal = textoCompleto.indexOf('Bloque principal');
		const idxSecundario = textoCompleto.indexOf('Bloque secundario');
		expect(idxResumen).toBeLessThan(idxPrincipal);
		expect(idxPrincipal).toBeLessThan(idxSecundario);
	});
});
