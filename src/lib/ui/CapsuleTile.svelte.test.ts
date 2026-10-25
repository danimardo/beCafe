import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import CapsuleTile from './CapsuleTile.svelte';

const TIPO_ID = '01HZX0000000000000000000T1';
const CLIENTE_ID = '01HZX0000000000000000000C1';

describe('CapsuleTile (RF-183, CA-183)', () => {
	it('CA-183: renderiza un formulario con dos botones submit (propio e invitado ≥ 44 px), ilustración, stock y contadores cuando son > 0', async () => {
		const { container } = await render(CapsuleTile, {
			tipoId: TIPO_ID,
			clienteId: CLIENTE_ID,
			name: 'Ristretto',
			brand: 'Nespresso',
			intensity: 10,
			stock: 8,
			threshold: 10,
			priceCents: 38,
			color: '#3b2a6b',
			daysLeft: 4,
			ownCount: 3,
			guestCount: 1,
		});

		const botonPropio = page.getByRole('button', { name: 'Registrar Ristretto', exact: true });
		const botonInvitado = page.getByRole('button', { name: 'Registrar Ristretto para un invitado', exact: true });

		await expect.element(botonPropio).toBeVisible();
		await expect.element(botonInvitado).toBeVisible();
		await expect.element(page.getByText('Stock bajo')).toBeVisible();

		// Comprueba que ambos botones son type="submit" dentro del mismo formulario POST ?/consumir (constitución XVII).
		const form = container.querySelector('form[method="post"][action="?/consumir"]');
		expect(form).not.toBeNull();
		const btn0 = form?.querySelector('button[type="submit"][name="invitado"][value="0"]');
		const btn1 = form?.querySelector('button[type="submit"][name="invitado"][value="1"]');
		expect(btn0).not.toBeNull();
		expect(btn1).not.toBeNull();

		// Objetivo táctil del botón de invitado ≥ 44 px (RNF-001).
		const rectInvitado = btn1?.getBoundingClientRect();
		expect(rectInvitado?.width ?? 0).toBeGreaterThanOrEqual(44);
		expect(rectInvitado?.height ?? 0).toBeGreaterThanOrEqual(44);
	});

	it('CA-183: oculta los contadores de uso cuando ownCount y guestCount son 0', async () => {
		const { container } = await render(CapsuleTile, {
			tipoId: TIPO_ID,
			clienteId: CLIENTE_ID,
			name: 'Colombia',
			stock: 25,
			threshold: 10,
			priceCents: 42,
			color: '#2f6b3b',
			ownCount: 0,
			guestCount: 0,
		});

		expect(container.querySelector('[title="Tus consumos"]')).toBeNull();
		expect(container.querySelector('[title="Invitados"]')).toBeNull();
	});

	it('CA-191: en modo visitante envía a ?/registrar, sin botón de invitado, sin campo invitado y sin precio', async () => {
		const { container } = await render(CapsuleTile, {
			tipoId: TIPO_ID,
			clienteId: CLIENTE_ID,
			name: 'Ristretto',
			brand: 'Nespresso',
			stock: 8,
			threshold: 10,
			priceCents: 38,
			color: 'cap-ristretto',
			ownCount: 3,
			modo: 'visitante',
		});

		await expect.element(page.getByRole('button', { name: 'Registrar Ristretto', exact: true })).toBeVisible();
		expect(container.querySelector('form[method="post"][action="?/registrar"]')).not.toBeNull();
		expect(container.querySelector('button[name="invitado"]')).toBeNull();
		expect(container.querySelector('[title="Tus consumos"]')).toBeNull();
		expect(container.textContent).not.toContain('0,38');
	});
});
