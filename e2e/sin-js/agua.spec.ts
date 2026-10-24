import { test, expect } from '../fixtures/errores-navegador';
import { tipoConCoste } from '../fixtures/consumos';

// Sin JavaScript, «He rellenado el agua» registra con el formulario del servidor y «Deshacer» sigue disponible (constitución XVII, CA-171).

test('sin JavaScript, el relleno muestra el aviso con «Deshacer» y «Deshacer» lo anula', async ({ page, servidor }) => {
	await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);

	await page.getByRole('button', { name: 'He rellenado el agua' }).click();
	await expect(page.getByText('Relleno registrado — Gracias por ocuparte del agua', { exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
	await expect(page.getByText('Relleno anulado. Ya no cuenta para el ranking.', { exact: true })).toBeVisible();
});
