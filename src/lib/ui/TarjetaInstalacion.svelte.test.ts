import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import TarjetaInstalacion from './TarjetaInstalacion.svelte';

describe('TarjetaInstalacion (RF-206)', () => {
	it('CA-206: en Android y Chrome ofrece «Instalar» y «Ahora no»', async () => {
		const oninstalar = vi.fn();
		const ondescartar = vi.fn();
		await render(TarjetaInstalacion, { estado: 'instalable', oninstalar, ondescartar });

		await expect.element(page.getByRole('heading', { name: 'Instalar beCafé' })).toBeVisible();
		await page.getByRole('button', { name: 'Instalar', exact: true }).click();
		await page.getByRole('button', { name: 'Ahora no', exact: true }).click();
		expect(oninstalar).toHaveBeenCalledTimes(1);
		expect(ondescartar).toHaveBeenCalledTimes(1);
	});

	it('CA-206: en iPhone y iPad explica «Compartir → Añadir a pantalla de inicio» y no ofrece el botón del sistema', async () => {
		await render(TarjetaInstalacion, { estado: 'ios', ondescartar: () => {} });

		await expect.element(page.getByText('Elige «Añadir a pantalla de inicio».')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Instalar', exact: true })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Ahora no', exact: true })).toBeVisible();
	});

	it('CA-206: en Perfil (compacta, sin descartar) no repite el título ni ofrece «Ahora no»', async () => {
		await render(TarjetaInstalacion, { estado: 'instalable', oninstalar: () => {}, compacta: true });

		await expect.element(page.getByRole('heading')).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Ahora no', exact: true })).not.toBeInTheDocument();
	});
});
