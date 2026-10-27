import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import '../../app.css';
import CopiaBucketFila from './CopiaBucketFila.svelte';

// F17 US1, US2 y US3 (RF-284, RF-287, RF-289): la fila de una copia del bucket muestra su tipo y su origen con texto y ofrece descargarla.
describe('CopiaBucketFila', () => {
	const base = { fecha: '27-10-2026 11:00', tamano: '12 KB', origen: 'Origen: becafe.mardomingo.com', descargarTexto: 'Descargar' };

	it('CA-284: ofrece un enlace «Descargar» con el nombre accesible de su copia y apunta al destino recibido', async () => {
		await render(CopiaBucketFila, {
			...base,
			descargarHref: '/admin/copias/descargar/becafe/copia.tar.gz',
			descargarNombre: 'Descargar la copia del 27-10-2026 11:00',
		});

		const enlace = page.getByRole('link', { name: 'Descargar la copia del 27-10-2026 11:00' });
		await expect.element(enlace).toBeVisible();
		await expect.element(enlace).toHaveAttribute('href', '/admin/copias/descargar/becafe/copia.tar.gz');
	});

	it('CA-284: sin destino no hay enlace de descarga', async () => {
		await render(CopiaBucketFila, { ...base, descargarNombre: 'Descargar' });

		await expect.element(page.getByRole('link')).not.toBeInTheDocument();
	});

	it('CA-287: la etiqueta «Manual» se ve como texto, no solo como color', async () => {
		await render(CopiaBucketFila, { ...base, etiquetas: ['Manual'], descargarNombre: 'Descargar' });

		await expect.element(page.getByText('Manual', { exact: true })).toBeVisible();
	});

	it('CA-289: muestra el origen de la copia', async () => {
		await render(CopiaBucketFila, { ...base, origen: 'Origen: Local', descargarNombre: 'Descargar' });

		await expect.element(page.getByText('Origen: Local', { exact: true })).toBeVisible();
	});
});
