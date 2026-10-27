import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// F17 (RF-286, principio XVII): sin JavaScript, la confirmación se abre con el propio desplegable y el formulario hace la copia.
test.use({ conS3: true });

test('CA-286: sin JavaScript, «Hacer copia ahora» se confirma y el fallo se explica al recargar la pantalla', async ({
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	await page.getByText('Hacer copia ahora', { exact: true }).click();
	await page.getByRole('button', { name: 'Sí, hacer la copia', exact: true }).click();

	await expect(page.getByRole('status').filter({ hasText: 'No se pudo hacer la copia: Sin conexión con S3.' }).first()).toBeVisible();
});
