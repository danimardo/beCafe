import { test, expect } from '../fixtures/errores-navegador';
import { tipoConCoste } from '../fixtures/consumos';
import { cerrarSesion, recontar } from '../fixtures/economia';
import { entrarComo } from '../fixtures/sesiones';

// F12 US4 (RF-246): un recuento con diferencia lo ve toda la plantilla en Inicio y en el panel de avisos.

test('CA-246: un faltante avisa a otra persona en Inicio y en el panel; «Entendido» lo quita de Inicio y sigue en el panel', async ({
	page,
	servidor,
}) => {
	const tipo = await tipoConCoste(page, servidor);
	await cerrarSesion(page, servidor);
	await entrarComo(page, servidor, 'administrador');
	await recontar(page, servidor, tipo, '0');
	await cerrarSesion(page, servidor);

	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	const aviso = page.getByText(`Faltaban 1 ${tipo}; 3,48`, { exact: false });
	await expect(aviso).toBeVisible();
	await expect(page.getByText(/^Recuento del \d{2}\/\d{2}$/).first()).toBeVisible();

	await page.getByRole('button', { name: 'Entendido', exact: true }).click();
	await expect(aviso).toBeHidden();
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	await expect(aviso).toBeHidden();

	await page.goto(`${servidor.url}/avisos`);
	await expect(page.getByText(`Faltaban 1 ${tipo}; 3,48`, { exact: false })).toBeVisible();
});
