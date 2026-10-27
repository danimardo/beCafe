import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import CapsuleColorField from './CapsuleColorField.svelte';

// El CSS no se carga en estas pruebas: aquí se comprueba el comportamiento y los nombres accesibles; el color real se mide en el E2E.
const OPCIONES = [
	{ value: 'cap-ristretto', label: 'Ristretto' },
	{ value: 'cap-lungo', label: 'Lungo' },
];
const OTRO = { value: 'otro', label: 'Otro color', selectorLabel: 'Elegir el color con el selector', name: 'colorPropio' };

describe('CapsuleColorField (RF-269)', () => {
	it('CA-269: ofrece los colores fijos y «Otro color», todos como radios con nombre', async () => {
		await render(CapsuleColorField, { label: 'Color', name: 'color', options: OPCIONES, otro: OTRO });

		await expect.element(page.getByRole('radio', { name: 'Ristretto' })).toBeInTheDocument();
		await expect.element(page.getByRole('radio', { name: 'Lungo' })).toBeInTheDocument();
		await expect.element(page.getByRole('radio', { name: 'Otro color' })).toBeInTheDocument();
	});

	it('CA-269: elegir un color en el selector marca «Otro color»', async () => {
		await render(CapsuleColorField, { label: 'Color', name: 'color', value: 'cap-lungo', options: OPCIONES, otro: OTRO });
		await expect.element(page.getByRole('radio', { name: 'Lungo' })).toBeChecked();

		await page.getByLabelText('Elegir el color con el selector').fill('#336699');

		await expect.element(page.getByRole('radio', { name: 'Otro color' })).toBeChecked();
		await expect.element(page.getByLabelText('Elegir el color con el selector')).toHaveValue('#336699');
	});

	it('CA-269: el rosa heredado se ofrece como color actual cuando llega entre las opciones', async () => {
		await render(CapsuleColorField, {
			label: 'Color',
			name: 'color',
			value: 'cap-rosa',
			options: [...OPCIONES, { value: 'cap-rosa', label: 'Rosa (color actual)' }],
			otro: OTRO,
		});

		await expect.element(page.getByRole('radio', { name: 'Rosa (color actual)' })).toBeChecked();
	});
});
