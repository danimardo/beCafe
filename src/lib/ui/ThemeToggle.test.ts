import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import EnvoltorioTema from './pruebas/EnvoltorioTema.svelte';

// RF-180 y RF-181: cambiar de opción actualiza el documento al instante, conserva el foco y se guarda en el dispositivo.
describe('ThemeToggle (RF-180, RF-181)', () => {
	afterEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.removeAttribute('data-transparencia');
	});

	it('CA-180: elegir Oscuro cambia el tema sin mover el foco y se guarda en el dispositivo', async () => {
		await render(EnvoltorioTema);

		const oscuro = page.getByRole('radio', { name: 'Oscuro', exact: true });
		await oscuro.click();

		expect(document.documentElement.getAttribute('data-theme')).toBe('oscuro');
		expect(localStorage.getItem('becafe-tema')).toBe('oscuro');
		await expect.element(oscuro).toHaveFocus();
	});

	it('CA-180: con una preferencia no válida guardada, Automático es la opción marcada', async () => {
		localStorage.setItem('becafe-tema', 'azul');

		await render(EnvoltorioTema);

		await expect.element(page.getByRole('radio', { name: 'Automático', exact: true })).toBeChecked();
	});
});
