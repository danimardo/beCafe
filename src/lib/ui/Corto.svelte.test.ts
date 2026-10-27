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

	it('CA-265: no hay pista de subtítulos aparte, ni título ni descripción a la vista: los subtítulos van grabados en el vídeo', async () => {
		await render(PruebasCorto);

		const reproductor = page.getByLabelText(textos.corto.portadaAlt).element();
		if (!(reproductor instanceof HTMLVideoElement)) throw new Error('No hay vídeo');
		expect(reproductor.querySelector('track')).toBeNull();
		expect(reproductor.textTracks).toHaveLength(0);
		// El diálogo conserva su nombre accesible, pero el título no se ve (RF-264).
		const titulo = page.getByRole('heading', { name: textos.corto.titulo }).element();
		expect(titulo.classList.contains('sr-only')).toBe(true);
	});

	it('CA-251: «Ver el corto» muestra los controles del vídeo y quita el botón', async () => {
		await render(PruebasCorto);

		await page.getByRole('button', { name: textos.corto.ver, exact: true }).click();
		const reproductor = page.getByLabelText(textos.corto.portadaAlt).element();
		if (!(reproductor instanceof HTMLVideoElement)) throw new Error('No hay vídeo');
		await expect.poll(() => reproductor.controls).toBe(true);
		await expect.element(page.getByRole('button', { name: textos.corto.ver, exact: true })).not.toBeInTheDocument();
	});

	it('CA-265: «Leer la transcripción» abre una hoja con el texto y se cierra sin cerrar el corto', async () => {
		await render(PruebasCorto);

		await expect.element(page.getByText('Buenos días, señora cafetera. Lo de siempre.')).not.toBeInTheDocument();
		await page.getByRole('button', { name: textos.corto.transcripcion, exact: true }).click();
		await expect.element(page.getByText('Buenos días, señora cafetera. Lo de siempre.')).toBeVisible();
		await page.getByRole('button', { name: textos.corto.cerrarTranscripcion, exact: true }).click();
		await expect.element(page.getByText('Buenos días, señora cafetera. Lo de siempre.')).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: textos.corto.ver, exact: true })).toBeVisible();
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
