import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import PasswordField from './PasswordField.svelte';

describe('PasswordField', () => {
	it('muestra y oculta la contraseña con un botón con nombre accesible', async () => {
		await render(PasswordField, { label: 'Contraseña' });

		const campo = page.getByLabelText('Contraseña');
		await expect.element(campo).toHaveAttribute('type', 'password');

		const mostrar = page.getByRole('button', { name: 'Mostrar contraseña' });
		await mostrar.click();

		await expect.element(campo).toHaveAttribute('type', 'text');
		await expect.element(page.getByRole('button', { name: 'Ocultar contraseña', pressed: true })).toBeVisible();
	});
});
