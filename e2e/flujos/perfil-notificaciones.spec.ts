import { test, expect } from '../fixtures/errores-navegador';
import { cerrarSesion } from '../fixtures/economia';
import { entrarComo } from '../fixtures/sesiones';

// Preferencias de avisos en el perfil (RF-102, CA-102): el aviso de deuda no se puede desactivar y los demás sí.
test('CA-102: el aviso de deuda aparece siempre activado y «Stock bajo» se puede desactivar', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/perfil`);

	await expect(page.getByText('Siempre activado')).toBeVisible();
	const stockBajo = page.getByRole('switch', { name: 'Stock bajo', exact: true });
	await expect(stockBajo).toHaveAttribute('aria-checked', 'true');

	await stockBajo.click();

	await expect(page.getByRole('switch', { name: 'Stock bajo', exact: true })).toHaveAttribute('aria-checked', 'false');
	await expect(page.getByText('Preferencia guardada.')).toBeVisible();
});

// Avisos de administración solo para administradores (RF-102).
test('un administrador ve los avisos de administración y un miembro no', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/perfil`);
	await expect(page.getByRole('switch', { name: 'Stock negativo', exact: true })).toBeVisible();

	await cerrarSesion(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/perfil`);
	await expect(page.getByRole('switch', { name: 'Stock negativo', exact: true })).toHaveCount(0);
});
