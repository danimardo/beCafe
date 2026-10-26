import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Capsulito from './Capsulito.svelte';
import PruebasReposo from './PruebasReposo.svelte';
import { DURACION_POSE_RIV } from '#lib/shared/mascota/momentos';

describe('Capsulito (RF-185, RF-187, CA-185, CA-187)', () => {
	it('CA-185, CA-187: muestra la imagen decorativa alt="" con su bocadillo accesible y los atributos de pose y expresión', async () => {
		const { container } = await render(Capsulito, {
			momento: 'saludo-manana',
			nombre: 'Ana',
			size: 'md',
			modo: 'svg',
		});

		await expect.element(page.getByText('¡Buenos días, Ana! ¿Qué cápsula compilamos hoy?')).toBeVisible();
		const img = container.querySelector('img');
		expect(img).not.toBeNull();
		expect(img?.getAttribute('alt')).toBe('');
		expect(img?.getAttribute('aria-hidden')).toBe('true');

		const envoltorio = container.querySelector('[data-momento="saludo-manana"]');
		expect(envoltorio?.getAttribute('data-pose')).toBe('saludando');
		expect(envoltorio?.getAttribute('data-expresion')).toBe('feliz');
	});

	it('CA-187: con mensaje={null} no renderiza bocadillo y permite respaldo fallback', async () => {
		const fallback = createRawSnippet(() => ({ render: () => '<span>Icono alternativo</span>' }));
		const { container } = await render(Capsulito, {
			momento: 'vacio-capsulas',
			mensaje: null,
			size: 'sm',
			modo: 'svg',
			fallback,
		});

		expect(container.querySelector('p.capsulito-bocadillo')).toBeNull();
		expect(container.querySelector('img')).not.toBeNull();
	});

	it('CA-240: con «callado» la boca se queda en 0 aunque se pida otra forma; sin él, sigue la forma pedida', async () => {
		const callado = await render(Capsulito, { pose: 'saludando', size: 'sm', modo: 'svg', mensaje: null, boca: 3, callado: true });
		expect(callado.container.querySelector('[data-pose]')?.getAttribute('data-boca')).toBe('0');
		await callado.unmount();

		const hablando = await render(Capsulito, { pose: 'saludando', size: 'sm', modo: 'svg', mensaje: null, boca: 3 });
		expect(hablando.container.querySelector('[data-pose]')?.getAttribute('data-boca')).toBe('3');
	});
});

// F12 US8 (RF-248, CA-248, SC-006): Capsulito en reposo parpadea y hace un gesto según el tiempo que lleva quieta.
// Solo se falsea el reloj de intervalos: el montaje de Rive (que falla sin el archivo en el servidor de pruebas) sigue con el reloj real.
describe('Capsulito en reposo (RF-248, CA-248)', () => {
	const PAUSA_POSE = Math.ceil(DURACION_POSE_RIV.saludo);

	afterEach(() => vi.useRealTimers());

	const gesto = (contenedor: HTMLElement) => contenedor.querySelector('[data-pose]')?.getAttribute('data-reposo');
	const avanzar = (segundos: number) => vi.advanceTimersByTimeAsync(segundos * 1000);

	it('CA-248: a los 6, 12, 16 y 21 s en reposo cambia al gesto que toca y después vuelve a quedarse quieta', async () => {
		vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
		const { container } = await render(PruebasReposo, { size: 'md' });

		await avanzar(PAUSA_POSE + 5);
		expect(gesto(container)).toBe('quieto');
		await avanzar(1);
		expect(gesto(container)).toBe('mirarLados');
		await avanzar(2);
		expect(gesto(container)).toBe('quieto');
		await avanzar(4);
		expect(gesto(container)).toBe('pie');
		await avanzar(4);
		expect(gesto(container)).toBe('reloj');
		await avanzar(5);
		expect(gesto(container)).toBe('bostezo');
		await avanzar(8);
		// El ciclo de 23 s empieza otra vez: 29 s en reposo es el 6 del ciclo siguiente.
		expect(gesto(container)).toBe('mirarLados');
	});

	it('CA-248: hablar interrumpe el reposo y el ciclo empieza de nuevo desde 0', async () => {
		vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
		const { container } = await render(PruebasReposo, { size: 'lg' });

		await avanzar(PAUSA_POSE + 6);
		expect(gesto(container)).toBe('mirarLados');

		await page.getByRole('button', { name: 'Hablar', exact: true }).click();
		expect(gesto(container)).toBe('quieto');
		await avanzar(60);
		expect(gesto(container)).toBe('quieto');

		await page.getByRole('button', { name: 'Callar', exact: true }).click();
		await avanzar(PAUSA_POSE + 5);
		expect(gesto(container)).toBe('quieto');
		await avanzar(1);
		expect(gesto(container)).toBe('mirarLados');
	});

	it('CA-248: en tamaño pequeño, con movimiento reducido o con «callado» nunca cambia', async () => {
		vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
		for (const propiedades of [{ size: 'sm' }, { size: 'md', reducirMovimiento: true }, { size: 'md', callado: true }] as const) {
			const { container, unmount } = await render(PruebasReposo, propiedades);
			for (const segundos of [6, 6, 4, 5, 8]) {
				await avanzar(segundos + PAUSA_POSE);
				expect(gesto(container)).toBe('quieto');
			}
			await unmount();
		}
	});
});
