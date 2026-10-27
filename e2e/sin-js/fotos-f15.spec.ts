import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { darDeAltaCapsula, fotoDePrueba, nombreUnico } from '../fixtures/capsulas';

// Sin JavaScript, «Quitar foto» de una cápsula funciona (RF-272, constitución XVII).
test('CA-272: sin JavaScript, quitar la foto de una cápsula la deja sin foto', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Sin JS quitar');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3', foto: await fotoDePrueba() });
	await page.getByRole('link', { name: new RegExp(nombre) }).first().click();

	await page.getByRole('button', { name: 'Quitar foto', exact: true }).click();

	await expect(page.getByText('Foto quitada.')).toBeVisible();
	await expect(page.getByRole('img', { name: 'Foto actual' })).toHaveCount(0);
});
