import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import WaterRefillCard from './WaterRefillCard.svelte';

// Tarjeta de agua (RF-170 a RF-176, CA-170, CA-173): estados normal, sin conexión, rechazo, sin rellenos y aguador.
const CLIENTE = '01HZX0000000000000000000AA';

describe('WaterRefillCard', () => {
	it('CA-170: muestra el último relleno y un botón de envío con su identificador oculto', async () => {
		await render(WaterRefillCard, { ultimo: { nombre: 'Jorge', hace: 'hace 20 min', esPropio: false }, clienteId: CLIENTE });

		await expect.element(page.getByText('Último: Jorge, hace 20 min')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'He rellenado el agua' })).toBeEnabled();
	});

	it('sin rellenos registrados lo dice en lugar de un último', async () => {
		await render(WaterRefillCard, { ultimo: null, clienteId: CLIENTE });

		await expect.element(page.getByText('Sin rellenos registrados')).toBeVisible();
	});

	it('CA-173: sin conexión el botón está desactivado y se explica por qué', async () => {
		await render(WaterRefillCard, { ultimo: null, clienteId: CLIENTE, enConexion: false });

		await expect.element(page.getByRole('button', { name: 'He rellenado el agua' })).toBeDisabled();
		await expect.element(page.getByText('Necesitas conexión para registrar el relleno')).toBeVisible();
	});

	it('CA-172: un rechazo se anuncia como alerta con quién y hace cuánto', async () => {
		await render(WaterRefillCard, {
			ultimo: { nombre: 'Jorge', hace: 'hace 5 min', esPropio: false },
			clienteId: CLIENTE,
			rechazo: { nombre: 'Jorge', hace: 'hace 5 min', esPropio: false },
		});

		await expect.element(page.getByRole('alert')).toHaveTextContent('Jorge la rellenó hace 5 min');
	});

	it('RF-176: el aguador del mes se muestra con «(¡tú!)» si la persona que mira está incluida', async () => {
		await render(WaterRefillCard, {
			ultimo: null,
			clienteId: CLIENTE,
			aguador: { mes: 'octubre', nombres: 'Ana y Jorge', incluyeAlUsuario: true },
		});

		await expect.element(page.getByText('Aguador de octubre: Ana y Jorge (¡tú!)')).toBeVisible();
	});
});
