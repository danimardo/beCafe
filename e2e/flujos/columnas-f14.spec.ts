import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures/errores-navegador';
import { expectSinInfracciones } from '../a11y/axe';
import { darDeAltaCapsula, nombreUnico } from '../fixtures/capsulas';
import { tipoConCoste } from '../fixtures/consumos';
import { cerrarSesion, recontar } from '../fixtures/economia';
import type { ServidorDePrueba } from '../fixtures/servidor';
import { entrarComo } from '../fixtures/sesiones';

// F14 US6 y US7 (RF-261 a RF-263, CA-261 a CA-263): dos columnas en escritorio, avisos resaltados y stock en Compras.

async function caja(localizador: Locator) {
	const caja = await localizador.boundingBox();
	if (!caja) throw new Error('El elemento no está en pantalla');
	return caja;
}

/** Escritorio: `accion` queda entera a la izquierda de `listado`. Móvil: queda encima, en la misma columna. */
async function colocadosEnColumnas(accion: Locator, listado: Locator, enEscritorio: boolean) {
	const [a, b] = [await caja(accion), await caja(listado)];
	if (enEscritorio) {
		expect(a.x + a.width).toBeLessThanOrEqual(b.x);
	} else {
		expect(a.y + a.height).toBeLessThanOrEqual(b.y);
		expect(Math.abs(a.x - b.x)).toBeLessThan(32);
	}
}

/** Un aviso para la persona miembro: un recuento con faltante (RF-246). Deja su sesión abierta en Inicio. */
async function conAvisoPendiente(page: Page, servidor: ServidorDePrueba): Promise<string> {
	const tipo = await tipoConCoste(page, servidor);
	await cerrarSesion(page, servidor);
	await entrarComo(page, servidor, 'administrador');
	await recontar(page, servidor, tipo, '0');
	await cerrarSesion(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');
	return tipo;
}

const ANCHOS = [
	{ nombre: '1280 px', viewport: { width: 1280, height: 900 }, escritorio: true },
	{ nombre: '390 px', viewport: { width: 390, height: 844 }, escritorio: false },
] as const;

const TEMAS = ['light', 'dark'] as const;

for (const { nombre, viewport, escritorio } of ANCHOS) {
	test.describe(`CA-261: ${nombre}`, () => {
		test.use({ viewport });

		test('Compras: registrar a un lado y el listado al otro; con el stock bajo de cada tipo (CA-263)', async ({ page, servidor }) => {
			// Una compra de una unidad con umbral 3: queda 1 (stock bajo).
			const tipo = await tipoConCoste(page, servidor);
			await page.goto(`${servidor.url}/compras`);
			await page.waitForLoadState('load');

			await colocadosEnColumnas(
				page.getByRole('button', { name: 'Registrar compra', exact: true }),
				page.getByRole('link', { name: /Administrador|Miembro|\d{4}-\d{2}-\d{2}/ }).first(),
				escritorio,
			);
			const fila = page.getByRole('listitem').filter({ hasText: tipo });
			await expect(fila.getByText('Quedan pocas', { exact: true })).toBeVisible();
			await expect(fila.getByText('Quedan 1', { exact: true })).toBeVisible();
		});

		test('Usuarios, Control y Cápsulas: acciones a un lado y listado al otro', async ({ page, servidor }) => {
			await entrarComo(page, servidor, 'administrador');
			await darDeAltaCapsula(page, servidor, { nombre: nombreUnico('Col'), umbral: '1' });

			await page.goto(`${servidor.url}/admin/usuarios`);
			await colocadosEnColumnas(
				page.getByRole('button', { name: 'Dar de alta', exact: true }),
				page.getByRole('link').filter({ hasText: '@' }).first(),
				escritorio,
			);

			await page.goto(`${servidor.url}/admin/control`);
			await colocadosEnColumnas(
				page.getByRole('button', { name: 'Ver efecto', exact: true }).first(),
				page.getByText('Todavía no hay arqueos'),
				escritorio,
			);

			await page.goto(`${servidor.url}/admin/capsulas`);
			await colocadosEnColumnas(
				page.getByRole('link', { name: 'Nuevo tipo', exact: true }),
				page.getByRole('link').filter({ hasText: 'Marca de prueba' }).first(),
				escritorio,
			);
		});
	});
}

// Los avisos necesitan tres inicios de sesión: un solo test comprueba los dos anchos y los dos temas con los mismos datos.
test('Avisos: pendientes resaltados con «Nuevo» a un lado y vistos al otro, en los dos anchos y temas (CA-261, CA-262)', async ({
	page,
	servidor,
	browserName,
}) => {
	// Inicio carga ahí el .riv del recordatorio y WebKit lo rechaza a ratos («access control checks», docs/pruebas.md §12.3);
	// recuento-aviso-f12 tiene el mismo problema. Chromium cubre la maquetación.
	test.skip(browserName === 'webkit', 'Intermitencia conocida de WebKit con el .riv de Inicio');
	await page.setViewportSize(ANCHOS[0].viewport);
	await conAvisoPendiente(page, servidor);
	await page.getByRole('button', { name: /^(Avisos|\d+ avisos? nuevos?)$/ }).click();
	await expect(page).toHaveURL(/\/avisos\?nuevos=[1-9]/);

	const pendientes = page.getByRole('listitem').filter({ hasText: 'Nuevo' });
	await expect(pendientes.first().getByText('Nuevo', { exact: true })).toBeVisible();
	for (const { viewport, escritorio } of ANCHOS) {
		await page.setViewportSize(viewport);
		await colocadosEnColumnas(pendientes.first(), page.getByRole('heading', { name: 'Anteriores', exact: true }), escritorio);
	}
	await page.setViewportSize(ANCHOS[0].viewport);
	for (const esquema of TEMAS) {
		await page.emulateMedia({ colorScheme: esquema });
		await expectSinInfracciones(page);
	}
});
