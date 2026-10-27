import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// CAMBIO-030: las pruebas de restauración se retiran; la pantalla solo ofrece copias, descarga y restauración.
test('CA-143: la pantalla de copias no ofrece anotar pruebas de restauración ni avisa de 100 días', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	await expect(page.getByRole('heading', { name: 'Copias de seguridad', exact: true, level: 1 })).toBeVisible();
	await expect(page.getByRole('heading', { name: /prueba/i })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Anotar prueba' })).toHaveCount(0);
	await page.goto(`${servidor.url}/admin`);
	await expect(page.getByText('no se prueba una restauración', { exact: false })).toHaveCount(0);
});

// RF-253: sin bucket, la pantalla lo explica y no ofrece «Descargar» ni «Restaurar»; el enlace de vuelta lleva a Administración.
test('CA-253: sin S3 se explica la configuración, no hay botones por copia y el enlace vuelve a Administración', async ({
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	await expect(page.getByText('Las copias diarias no están configuradas.', { exact: false })).toBeVisible();
	await expect(page.getByRole('link', { name: /^Restaurar/ })).toHaveCount(0);
	await expect(page.getByRole('link', { name: /^Descargar/ })).toHaveCount(0);
	await page.getByRole('link', { name: '← Volver a Administración', exact: true }).click();
	await expect(page).toHaveURL(`${servidor.url}/admin`);
});

// Un número de página que no existe o no es válido no rompe la pantalla (RF-253).
test('CA-253: una página inválida o fuera de rango se acota y la pantalla sigue funcionando', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	for (const consulta of ['pagina=abc', 'pagina=99', 'pagina=-1']) {
		const respuesta = await page.goto(`${servidor.url}/admin/copias?${consulta}`);
		expect(respuesta?.status()).toBe(200);
		await expect(page.getByRole('heading', { name: 'Copias', exact: true, level: 2 })).toBeVisible();
	}
});

// RF-254: sin bucket, la pantalla de restaurar una copia no existe: responde la página de «no encontrado» y no hay formulario.
test('CA-253: la pantalla de restaurar sin S3 no ofrece el formulario', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const respuesta = await page.goto(`${servidor.url}/admin/copias/restaurar/becafe/2026/10/becafe-prueba.tar.gz`);

	expect(respuesta?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: 'No encontramos esa página', exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Restaurar esta copia', exact: true })).toHaveCount(0);
});

// RF-275: «Hacer una copia» y el listado llevan su icono junto al título, y desde 1024 px van en dos columnas.
test('CA-275: las secciones de copias tienen su icono y, en pantalla ancha, van en dos columnas', async ({ page, servidor }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	for (const titulo of ['Hacer una copia', 'Copias']) {
		const encabezado = page.getByRole('heading', { name: titulo, exact: true, level: 2 });
		await expect(encabezado).toBeVisible();
		await expect(encabezado.locator('svg')).toHaveCount(1);
	}
	const izquierda = await page.getByRole('heading', { name: 'Hacer una copia', exact: true }).boundingBox();
	const derecha = await page.getByRole('heading', { name: 'Copias', exact: true, level: 2 }).boundingBox();
	expect(izquierda).not.toBeNull();
	expect(derecha).not.toBeNull();
	expect(derecha?.x ?? 0).toBeGreaterThan((izquierda?.x ?? 0) + 200);
});

// F17 (RF-288): sin S3 no se ofrece hacer copias ni descargarlas, y se explica por qué.
test('CA-288: sin S3 se explica que hace falta configurarlo y no se ofrece hacer copias ni descargar', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/copias`);

	await expect(
		page.getByText('Para hacer o descargar copias hace falta configurar el bucket S3 en el servidor.', { exact: true }),
	).toBeVisible();
	await expect(page.getByText('Hacer copia ahora', { exact: true })).toHaveCount(0);
	await expect(page.getByRole('link', { name: /^Descargar/ })).toHaveCount(0);
});
