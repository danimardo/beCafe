import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { RUTAS_DE_ADMINISTRACION, RUTAS_PROTEGIDAS } from './rutas';

// EV-050: sin sesión, cada ruta protegida lleva a la entrada; un miembro no entra en la administración.
for (const ruta of RUTAS_PROTEGIDAS) {
	test(`EV-050: sin sesión, ${ruta} lleva a la entrada`, async ({ page, servidor }) => {
		await page.goto(`${servidor.url}${ruta}`);
		await expect(page).toHaveURL(`${servidor.url}/login`);
	});
}

for (const ruta of RUTAS_DE_ADMINISTRACION) {
	test(`EV-050: un miembro no puede ver ${ruta}`, async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}${ruta}`);
		await expect(page.getByText('No tienes permiso para hacer esto.')).toBeVisible();
	});
}
