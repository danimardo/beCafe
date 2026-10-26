import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { textos } from '#lib/shared/textos';
import PruebasCorto from './PruebasCorto.svelte';

describe('Corto (RF-249, RF-251, RF-252)', () => {
	it('CA-249: la portada ofrece «Ver el corto» y «Saltar», y no descarga ni reproduce nada antes de pulsar', async () => {
		await render(PruebasCorto);

		await expect.element(page.getByRole('dialog', { name: textos.corto.titulo })).toBeVisible();
		await expect.element(page.getByRole('button', { name: textos.corto.ver, exact: true })).toBeVisible();
		await expect.element(page.getByRole('button', { name: textos.corto.saltar, exact: true })).toBeVisible();
		const reproductor = page.getByLabelText(textos.corto.portadaAlt).element();
		if (!(reproductor instanceof HTMLVideoElement)) throw new Error('No hay vídeo');
		expect(reproductor.preload).toBe('none');
		expect(reproductor.paused).toBe(true);
		expect(reproductor.controls).toBe(false);
		expect(reproductor.networkState).not.toBe(HTMLMediaElement.NETWORK_LOADING);
	});

	it('CA-251: el vídeo lleva los subtítulos en español activados por defecto', async () => {
		await render(PruebasCorto);

		const reproductor = page.getByLabelText(textos.corto.portadaAlt).element();
		if (!(reproductor instanceof HTMLVideoElement)) throw new Error('No hay vídeo');
		const pista = reproductor.querySelector('track');
		expect(pista?.getAttribute('srclang')).toBe('es');
		expect(pista?.default).toBe(true);
	});

	it('CA-251: «Ver el corto» muestra los controles del vídeo y quita el botón', async () => {
		await render(PruebasCorto);

		await page.getByRole('button', { name: textos.corto.ver, exact: true }).click();
		const reproductor = page.getByLabelText(textos.corto.portadaAlt).element();
		if (!(reproductor instanceof HTMLVideoElement)) throw new Error('No hay vídeo');
		await expect.poll(() => reproductor.controls).toBe(true);
		await expect.element(page.getByRole('button', { name: textos.corto.ver, exact: true })).not.toBeInTheDocument();
	});

	it('CA-251: la transcripción está enlazada y se abre al pulsarla', async () => {
		await render(PruebasCorto, { animar: true });
		const cerrada = page.getByText(textos.corto.transcripcion).element().closest('details');
		expect(cerrada?.open).toBe(false);
		await page.getByText(textos.corto.transcripcion).click();
		await expect.element(page.getByText('Buenos días, señora cafetera. Lo de siempre.')).toBeVisible();
	});

	it('CA-251: con movimiento reducido la transcripción aparece abierta', async () => {
		await render(PruebasCorto, { animar: false });
		const abierta = page.getByText(textos.corto.transcripcion).element().closest('details');
		expect(abierta?.open).toBe(true);
		await expect.element(page.getByText('Buenos días, señora cafetera. Lo de siempre.')).toBeVisible();
	});

	it('CA-249: «Saltar» avisa de que se saltó el corto', async () => {
		await render(PruebasCorto);

		await page.getByRole('button', { name: textos.corto.saltar, exact: true }).click();
		await expect.element(page.getByText('Estado del corto: saltado')).toBeVisible();
	});

	it('CA-252: «Saltar» tiene nombre accesible y se alcanza con el teclado', async () => {
		await render(PruebasCorto);

		const saltar = page.getByRole('button', { name: textos.corto.saltar, exact: true });
		await expect.element(saltar).toBeVisible();
		saltar.element().focus();
		await expect.element(saltar).toHaveFocus();
	});

	it('CA-250: en el diálogo hay «Cerrar el corto» y no «Saltar»', async () => {
		await render(PruebasCorto, { modo: 'dialogo' });

		await expect.element(page.getByRole('button', { name: textos.corto.saltar, exact: true })).not.toBeInTheDocument();
		await page.getByRole('button', { name: textos.corto.cerrar, exact: true }).click();
		await expect.element(page.getByText('Estado del corto: saltado')).toBeVisible();
	});
});
