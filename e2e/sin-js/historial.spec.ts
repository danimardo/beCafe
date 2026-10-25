import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// Sin JavaScript, los filtros de `/historial` y de `/estadisticas` se aplican con «Aplicar» y conservan la consulta (plan F5 D6).
test('sin JavaScript, «Míos» en el historial se aplica con «Aplicar»', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/historial`);

	await page.getByRole('combobox', { name: 'Ver', exact: true }).selectOption('mios');
	await page.getByRole('button', { name: 'Aplicar', exact: true }).click();

	await expect(page).toHaveURL(/quien=mios/);
	await expect(page.getByRole('combobox', { name: 'Ver', exact: true })).toHaveValue('mios');
});

test('CA-202: sin JavaScript, el periodo de las estadísticas se aplica con «Aplicar»', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/estadisticas`);

	await page.getByRole('combobox', { name: 'Periodo', exact: true }).selectOption('ultimos3');
	await page.getByRole('button', { name: 'Aplicar', exact: true }).click();

	await expect(page).toHaveURL(/periodo=ultimos3/);
	await expect(page.getByRole('combobox', { name: 'Periodo', exact: true })).toHaveValue('ultimos3');
});
