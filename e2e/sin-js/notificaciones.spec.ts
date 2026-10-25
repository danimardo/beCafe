import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// Sin JavaScript (constitución XVII): el interruptor de un aviso es un botón de envío y la campana abre `/avisos`.
test('sin JavaScript, cambiar una preferencia la guarda y la campana abre /avisos', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/ajustes`);

	await page.getByRole('switch', { name: 'Stock bajo', exact: true }).click();
	await expect(page.getByRole('switch', { name: 'Stock bajo', exact: true })).toHaveAttribute('aria-checked', 'false');

	await page.getByRole('button', { name: 'Avisos', exact: true }).click();
	await expect(page).toHaveURL(/\/avisos\?nuevos=\d+$/);
});
