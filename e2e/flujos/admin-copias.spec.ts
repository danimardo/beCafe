import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// Anotar una prueba de restauración (CA-143): la prueba aparece en la lista y el formulario confirma.
test('CA-143: un administrador anota una prueba de restauración', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	const ayer = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
	await page.getByLabel('Fecha de la prueba', { exact: true }).fill(ayer);
	await page.getByLabel('Correcta', { exact: true }).check();
	await page.getByRole('button', { name: 'Anotar prueba', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'Prueba de restauración anotada.' }).first()).toBeVisible();
});

// Una fecha futura no se guarda (Clarifications 3). El navegador ya la bloquea con `max`; se quita para comprobar que el servidor también la rechaza.
test('CA-143: el servidor rechaza una fecha futura aunque el navegador no la compruebe', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	const fecha = page.getByLabel('Fecha de la prueba', { exact: true });
	await fecha.evaluate((campo) => campo.removeAttribute('max'));
	const manana = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
	await fecha.fill(manana);
	await page.getByRole('button', { name: 'Anotar prueba', exact: true }).click();

	await expect(page.getByRole('alert').filter({ hasText: 'Revisa los datos marcados.' }).first()).toBeVisible();
});

// RF-253, RF-257: sin bucket, la sección de restauración lo explica y no ofrece restaurar; la sección de pruebas aclara que no restaura nada.
test('CA-253, CA-257: sin S3 se explica la restauración, la prueba aclara su sentido y el enlace vuelve a Administración', async ({
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	await expect(page.getByText('Para restaurar copias hace falta configurar el bucket S3 en el servidor.', { exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: /^Restaurar/ })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Anotar una prueba de restauración', exact: true })).toBeVisible();
	await expect(page.getByText('No restaura nada.', { exact: false })).toBeVisible();
	await page.getByRole('link', { name: '← Volver a Administración', exact: true }).click();
	await expect(page).toHaveURL(`${servidor.url}/admin`);
});

// RF-254: sin bucket, la pantalla de restaurar una copia no existe: responde la página de «no encontrado» y no hay formulario.
test('CA-253: la pantalla de restaurar sin S3 no ofrece el formulario', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const respuesta = await page.goto(`${servidor.url}/admin/copias/restaurar/becafe/2026/10/becafe-prueba.tar.gz`);

	expect(respuesta?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: 'No encontramos esa página', exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Restaurar esta copia', exact: true })).toHaveCount(0);
});
