import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import AyudaPanel from './AyudaPanel.svelte';
import { CATALOGO_AYUDA } from '#lib/shared/ayuda/pantallas';

describe('AyudaPanel (RF-203)', () => {
	it('CA-203: abre la ayuda de la pantalla con su propósito, sus acciones y sus campos, y se cierra con Esc', async () => {
		await render(AyudaPanel, { open: true, pantalla: 'compras' });

		const panel = page.getByRole('dialog', { name: 'Ayuda: Compras' });
		await expect.element(panel).toBeVisible();
		await expect.element(panel.getByText(CATALOGO_AYUDA.compras.proposito)).toBeVisible();
		await expect.element(panel.getByText('Registrar compra', { exact: true })).toBeVisible();
		await expect.element(panel.getByText('Foto del ticket', { exact: true })).toBeVisible();
		await expect.element(panel.getByRole('button', { name: 'Repetir el tour' })).not.toBeInTheDocument();

		await userEvent.keyboard('{Escape}');
		await expect.element(panel).not.toBeInTheDocument();
	});

	it('CA-204: en Inicio ofrece «Repetir el tour»', async () => {
		await render(AyudaPanel, { open: true, pantalla: 'inicio' });

		await expect.element(page.getByRole('button', { name: 'Repetir el tour', exact: true })).toBeVisible();
	});

	it('CA-228: con JavaScript, «Repetir el tour» llama a la función recibida y cierra el panel', async () => {
		const onrepetirtour = vi.fn();
		await render(AyudaPanel, { open: true, pantalla: 'inicio', onrepetirtour });

		await page.getByRole('button', { name: 'Repetir el tour', exact: true }).click();

		expect(onrepetirtour).toHaveBeenCalledTimes(1);
		await expect.element(page.getByRole('dialog', { name: 'Ayuda: Inicio' })).not.toBeInTheDocument();
	});
});
