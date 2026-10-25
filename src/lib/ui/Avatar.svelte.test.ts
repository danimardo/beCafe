import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Avatar from './Avatar.svelte';

// El CSS no se carga en estas pruebas: aquí se comprueban las clases y la estructura; el color real se mide en el E2E.
const IMAGEN_VALIDA = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

describe('Avatar (RF-208, RF-209)', () => {
	it('CA-209, CA-222: sin foto muestra una ilustración decorativa, estable, sobre el color de su persona', async () => {
		const primero = await render(Avatar, { name: 'Ana Pérez', usuarioId: '01ANA' });
		const clasePrimero = primero.container.querySelector('span')?.className;
		const dibujoPrimero = primero.container.querySelector('svg')?.innerHTML;
		expect(clasePrimero).toMatch(/bg-avatar-[1-6]/);
		expect(dibujoPrimero).toBeTruthy();
		expect(primero.container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
		expect(primero.container.textContent.trim()).toBe('');
		await primero.unmount();

		const segundo = await render(Avatar, { name: 'Ana Pérez', usuarioId: '01ANA' });
		expect(segundo.container.querySelector('span')?.className).toBe(clasePrimero);
		expect(segundo.container.querySelector('svg')?.innerHTML).toBe(dibujoPrimero);
	});

	it('CA-208: con foto muestra la imagen decorativa y no las iniciales', async () => {
		const { container } = await render(Avatar, { name: 'Ana Pérez', usuarioId: '01ANA', fotoUrl: IMAGEN_VALIDA });

		expect(container.querySelector('img')).toHaveAttribute('alt', '');
		expect(container.textContent.trim()).toBe('');
	});

	it('CA-208, CA-222: si la foto no carga, vuelve a la ilustración', async () => {
		const { container } = await render(Avatar, {
			name: 'Ana Pérez',
			usuarioId: '01ANA',
			fotoUrl: 'data:image/png;base64,no-es-una-imagen',
		});

		await expect.poll(() => container.querySelector('svg')).not.toBeNull();
		expect(container.querySelector('img')).toBeNull();
	});

	it('sin identificador conserva el color neutro y las iniciales de antes', async () => {
		const { container } = await render(Avatar, { name: 'Ana Pérez' });

		expect(container.querySelector('span')?.className).toContain('bg-accent-soft');
		await expect.element(page.getByText('AP')).toBeVisible();
	});
});
