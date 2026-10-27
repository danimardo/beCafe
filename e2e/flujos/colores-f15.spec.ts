import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { nombreUnico } from '../fixtures/capsulas';

// F15 US2 (RF-269, RF-270): siete colores fijos, sin rosa, y «Otro color» con selector libre.

test('CA-269: el alta ofrece siete colores y «Otro color», sin rosa', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/capsulas/nueva`);

	const grupo = page.getByRole('group', { name: 'Color' });
	await expect(grupo.getByRole('radio')).toHaveCount(8);
	await expect(grupo.getByRole('radio', { name: 'Otro color' })).toBeVisible();
	await expect(grupo.getByRole('radio', { name: /Rosa/ })).toHaveCount(0);
});

test('CA-269: un color propio se guarda y vuelve como «Otro color» con su valor', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Propio');
	await page.goto(`${servidor.url}/admin/capsulas/nueva`);
	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(nombre);
	await page.getByRole('textbox', { name: 'Marca', exact: true }).fill('Marca de prueba');
	await page.getByLabel('Elegir el color con el selector').fill('#336699');
	await page.getByRole('spinbutton', { name: 'Umbral mínimo (unidades)', exact: true }).fill('3');
	await page.mouse.move(0, 0);
	await page.getByRole('button', { name: 'Dar de alta', exact: true }).press('Enter');
	await expect(page).toHaveURL(/\/admin\/capsulas\?alta=ok$/);

	await page
		.getByRole('link', { name: new RegExp(nombre) })
		.first()
		.click();
	await expect(page.getByRole('radio', { name: 'Otro color' })).toBeChecked();
	await expect(page.getByLabel('Elegir el color con el selector')).toHaveValue('#336699');
});
