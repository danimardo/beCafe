import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import CounterField from './CounterField.svelte';

const PROPS = { label: 'Cantidad de Lungo', name: 'cantidad', decreaseLabel: 'Quitar una de Lungo', increaseLabel: 'Añadir una de Lungo' };

describe('CounterField (RF-197)', () => {
	it('CA-197: «+» y «−» cambian la cantidad sin bajar de 0', async () => {
		await render(CounterField, { ...PROPS, value: 0 });
		const campo = page.getByRole('spinbutton', { name: 'Cantidad de Lungo', exact: true });
		const menos = page.getByRole('button', { name: 'Quitar una de Lungo', exact: true });
		const mas = page.getByRole('button', { name: 'Añadir una de Lungo', exact: true });

		await expect.element(menos).toBeDisabled();
		await mas.click();
		await mas.click();
		await expect.element(campo).toHaveValue(2);
		await menos.click();
		await expect.element(campo).toHaveValue(1);
	});

	it('CA-197: la cifra escrita se limita a 999 y «+» queda desactivado en el máximo', async () => {
		await render(CounterField, { ...PROPS, value: 0 });
		const campo = page.getByRole('spinbutton', { name: 'Cantidad de Lungo', exact: true });

		await campo.fill('1200');
		await expect.element(page.getByRole('button', { name: 'Añadir una de Lungo', exact: true })).toBeDisabled();
	});
});
