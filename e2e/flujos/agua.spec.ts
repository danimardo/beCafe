import { test, expect } from '../fixtures/errores-navegador';
import { tipoConCoste } from '../fixtures/consumos';

// Agua de la cafetera (F8): registrar, «Deshacer», el rechazo por intervalo y la tarjeta sin conexión (CA-170 a CA-173, RF-170 a RF-172).
// La base es compartida por worker: cada prueba deshace su relleno para no dejar el intervalo ocupado (RN-083).

test('CA-170, RF-171: «He rellenado el agua» confirma el registro y «Deshacer» lo anula', async ({ page, servidor }) => {
	await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);

	const rellenar = page.getByRole('button', { name: 'He rellenado el agua' });
	await expect(rellenar).toBeVisible();
	await rellenar.click();
	await expect(page.getByRole('status').filter({ hasText: 'Relleno registrado' }).first()).toBeVisible();

	await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Relleno anulado' }).first()).toBeVisible();
});

test('CA-172: un segundo relleno dentro del intervalo se rechaza y dice que lo rellenó una misma', async ({ page, servidor }) => {
	await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);

	await page.getByRole('button', { name: 'He rellenado el agua' }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Relleno registrado' }).first()).toBeVisible();
	await page.getByRole('button', { name: 'He rellenado el agua' }).click();

	await expect(page.getByRole('alert').filter({ hasText: 'Tú la rellenaste' })).toBeVisible();
	await page.getByRole('button', { name: 'Deshacer', exact: true }).first().click();
	await expect(page.getByRole('status').filter({ hasText: 'Relleno anulado' }).first()).toBeVisible();
});

test('CA-173: sin conexión, el botón de agua está desactivado y explica que necesita conexión', async ({ page, servidor }) => {
	await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.context().setOffline(true);

	await expect(page.getByRole('button', { name: 'He rellenado el agua' })).toBeDisabled();
	await expect(page.getByText('Necesitas conexión para registrar el relleno')).toBeVisible();

	await page.context().setOffline(false);
	await expect(page.getByRole('button', { name: 'He rellenado el agua' })).toBeEnabled();
});

test('RN-085, CA-174: el ranking cuenta el relleno y anularlo desde su detalle deja libre el intervalo', async ({ page, servidor }) => {
	await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.getByRole('button', { name: 'He rellenado el agua' }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Relleno registrado' }).first()).toBeVisible();

	await page.goto(`${servidor.url}/estadisticas?periodo=ultimos12`);
	await expect(page.getByRole('heading', { name: 'Rellenos de agua' })).toBeVisible();

	await page.goto(`${servidor.url}/historial?tipo=rellenos`);
	await page
		.getByRole('link', { name: /Rellenos de agua/ })
		.first()
		.click();
	await page.getByRole('textbox', { name: 'Motivo de la anulación', exact: true }).fill('Registrado sin querer');
	await page.getByRole('button', { name: 'Anular relleno', exact: true }).click();

	await expect(page.getByText('Anulado', { exact: true }).first()).toBeVisible();
});
