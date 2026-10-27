import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// F17 (RF-286, RF-288): con un bucket ficticio, la pantalla ofrece «Hacer copia ahora» con confirmación y explica el fallo en español.
test.use({ conS3: true });

test('CA-286: «Hacer copia ahora» pide confirmación y, si el bucket no responde, lo explica y la copia queda como manual fallida', async ({
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	await page.getByText('Hacer copia ahora', { exact: true }).click();
	await expect(
		page.getByText('Se subirá al bucket una copia completa con todos los datos de la aplicación.', { exact: false }),
	).toBeVisible();
	await page.getByRole('button', { name: 'Sí, hacer la copia', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'No se pudo hacer la copia: Sin conexión con S3.' }).first()).toBeVisible();
	await expect(page.getByText('Fallida · Sin conexión con S3', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Manual', { exact: true }).first()).toBeVisible();
	// Una copia fallida no existe en el bucket: no ofrece «Descargar» ni «Restaurar» (CA-253).
	await expect(page.getByRole('link', { name: /^(Descargar|Restaurar)/ })).toHaveCount(0);
});

test('CA-288: sin lista del bucket no se ofrece «Descargar», pero sí la copia manual', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	await expect(page.getByText('Hacer copia ahora', { exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: /^Descargar/ })).toHaveCount(0);
});
