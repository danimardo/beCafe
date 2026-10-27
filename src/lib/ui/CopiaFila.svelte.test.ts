import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import '../../app.css';
import CopiaFila from './CopiaFila.svelte';

// F17 US1, US2 y US3 (RF-284, RF-287, RF-289): la fila de una copia del bucket muestra su tipo y su origen con texto y ofrece descargarla.
describe('CopiaFila', () => {
	const base = {
		fecha: '27-10-2026 11:00',
		tamano: '12 KB',
		origen: 'Origen: becafe.mardomingo.com',
		descargarTexto: 'Descargar',
		restaurarTexto: 'Restaurar',
	};

	it('CA-284: ofrece un enlace «Descargar» con el nombre accesible de su copia y apunta al destino recibido', async () => {
		await render(CopiaFila, {
			...base,
			descargarHref: '/admin/copias/descargar/becafe/copia.tar.gz',
			descargarNombre: 'Descargar la copia del 27-10-2026 11:00',
			restaurarNombre: 'Restaurar',
		});

		const enlace = page.getByRole('link', { name: 'Descargar la copia del 27-10-2026 11:00' });
		await expect.element(enlace).toBeVisible();
		await expect.element(enlace).toHaveAttribute('href', '/admin/copias/descargar/becafe/copia.tar.gz');
	});

	it('CA-284: sin destino no hay enlace de descarga', async () => {
		await render(CopiaFila, { ...base, descargarNombre: 'Descargar', restaurarNombre: 'Restaurar' });

		await expect.element(page.getByRole('link')).not.toBeInTheDocument();
	});

	it('CA-287: la etiqueta «Manual» se ve como texto, no solo como color', async () => {
		await render(CopiaFila, { ...base, etiquetas: ['Manual'], descargarNombre: 'Descargar', restaurarNombre: 'Restaurar' });

		await expect.element(page.getByText('Manual', { exact: true })).toBeVisible();
	});

	it('CA-253: «Descargar» y «Restaurar» salen juntos en la misma fila y apuntan a su destino', async () => {
		await render(CopiaFila, {
			...base,
			descargarHref: '/admin/copias/descargar/becafe/copia.tar.gz',
			descargarNombre: 'Descargar la copia del 27-10-2026 11:00',
			restaurarHref: '/admin/copias/restaurar/becafe/copia.tar.gz',
			restaurarNombre: 'Restaurar la copia del 27-10-2026 11:00',
		});

		const restaurar = page.getByRole('link', { name: 'Restaurar la copia del 27-10-2026 11:00' });
		await expect.element(restaurar).toHaveAttribute('href', '/admin/copias/restaurar/becafe/copia.tar.gz');
		await expect.element(page.getByRole('link', { name: 'Descargar la copia del 27-10-2026 11:00' })).toBeVisible();
	});

	it('CA-253: una copia fallida muestra su motivo con texto y no ofrece botones', async () => {
		await render(CopiaFila, {
			...base,
			fallida: 'Fallida · Sin conexión con S3',
			descargarNombre: 'Descargar',
			restaurarNombre: 'Restaurar',
		});

		await expect.element(page.getByText('Fallida · Sin conexión con S3')).toBeVisible();
		await expect.element(page.getByRole('link')).not.toBeInTheDocument();
	});

	it('CA-289: muestra el origen de la copia', async () => {
		await render(CopiaFila, { ...base, origen: 'Origen: Local', descargarNombre: 'Descargar', restaurarNombre: 'Restaurar' });

		await expect.element(page.getByText('Origen: Local', { exact: true })).toBeVisible();
	});
});
