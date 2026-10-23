import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// CA-106: la ayuda explica la instalación en Android y en iPhone o iPad, y se llega a ella desde el perfil.
test('CA-106: /ayuda explica la instalación en Android y en iPhone o iPad', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/perfil`);

	await page.getByRole('link', { name: 'Ayuda de avisos', exact: true }).click();

	await expect(page).toHaveURL(`${servidor.url}/ayuda`);
	await expect(page.getByRole('heading', { name: 'Ayuda de avisos', exact: true })).toBeVisible();
	await expect(page.getByText('Instalar aplicación', { exact: false })).toBeVisible();
	await expect(page.getByText('iOS 16.4', { exact: false })).toBeVisible();
});
