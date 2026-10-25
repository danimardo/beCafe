import { test, expect } from '../fixtures/errores-navegador';
import { botonDeToque, tipoConCoste } from '../fixtures/consumos';

// Estadísticas del departamento (F10): cualquier miembro ve a todas las personas, sin elegir persona (CA-201, CA-202).

test('CA-201, CA-202: un miembro ve las cifras, los cafés por persona, la evolución y la hucha, con sus tablas', async ({
	page,
	servidor,
}) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await botonDeToque(page, tipo).click();
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipo} registrado` })
			.first(),
	).toBeVisible();

	await page.goto(`${servidor.url}/estadisticas`);
	await expect(page.getByRole('combobox', { name: 'Persona' })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Cafés por persona' })).toBeVisible();
	await expect(page.getByText('Visitantes', { exact: true }).first()).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Evolución de los últimos 12 meses' })).toBeVisible();
	await expect(page.getByRole('img', { name: /^Saldo de la hucha al cierre de cada mes/ })).toBeVisible();

	// CA-202: cada gráfico tiene su tabla con los mismos datos.
	await page.getByText('Ver datos').first().click();
	await expect(page.getByRole('table').first()).toBeVisible();

	// RF-201: la fila de una persona abre sus estadísticas, sin restricción de administrador.
	await page
		.getByRole('link', { name: /^Ver las estadísticas de / })
		.first()
		.click();
	await expect(page).toHaveURL(/\/estadisticas\/[0-9A-Z]{26}$/);
	await expect(page.getByText('No tienes permiso para hacer esto.')).toHaveCount(0);
});
