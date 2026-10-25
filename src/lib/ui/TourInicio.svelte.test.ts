import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import TourInicio from './TourInicio.svelte';
import { PASOS_TOUR } from '#lib/shared/ayuda/tour';

describe('TourInicio (RF-204)', () => {
	it('CA-204: recorre los cuatro pasos con «Siguiente» y avisa al terminar', async () => {
		const onterminar = vi.fn();
		await render(TourInicio, { onterminar });

		for (const paso of PASOS_TOUR.slice(0, -1)) {
			await expect.element(page.getByRole('dialog', { name: paso.titulo })).toBeVisible();
			await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
		}
		await page.getByRole('button', { name: 'Terminar', exact: true }).click();
		expect(onterminar).toHaveBeenCalledTimes(1);
	});

	it('CA-204: el foco empieza en «Siguiente», Tab no sale de la tarjeta y Esc salta el tour', async () => {
		const onterminar = vi.fn();
		await render(TourInicio, { onterminar });
		const siguiente = page.getByRole('button', { name: 'Siguiente', exact: true });

		await expect.element(siguiente).toHaveFocus();
		await userEvent.keyboard('{Tab}');
		await expect.element(page.getByRole('button', { name: 'Saltar', exact: true })).toHaveFocus();
		await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
		await expect.element(siguiente).toHaveFocus();
		await userEvent.keyboard('{Escape}');
		expect(onterminar).toHaveBeenCalledTimes(1);
	});

	it('CA-204: sin ancla en la pantalla, el paso se muestra centrado y con su texto completo', async () => {
		await render(TourInicio, {
			onterminar: () => {},
			pasos: [{ ancla: 'deshacer', titulo: 'Paso suelto', texto: 'Texto completo del paso.' }],
		});

		const tarjeta = page.getByRole('dialog', { name: 'Paso suelto' });
		await expect.element(tarjeta).toHaveAccessibleDescription('Texto completo del paso.');
		expect(tarjeta.element().getAttribute('style')).toContain('translate(-50%, -50%)');
	});

	it('CA-204: con ancla, la resalta mientras el paso está activo', async () => {
		const ancla = document.createElement('button');
		ancla.dataset.tour = 'capsula';
		ancla.textContent = 'Cápsula';
		document.body.append(ancla);
		await render(TourInicio, { onterminar: () => {} });

		expect(ancla.hasAttribute('data-tour-activo')).toBe(true);
		await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
		expect(ancla.hasAttribute('data-tour-activo')).toBe(false);
		ancla.remove();
	});
});
