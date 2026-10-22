import { test, expect } from '../fixtures/errores-navegador';

test('la aplicación responde y muestra contenido, no una página en blanco', async ({ page, servidor }) => {
	await page.goto(`${servidor.url}/no-existe`);

	await expect(page.getByRole('heading', { level: 1, name: 'No encontramos esa página' })).toBeVisible();
});
