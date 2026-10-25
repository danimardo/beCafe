import { test, expect } from '../fixtures/errores-navegador';
import { botonDeToque, tipoConCoste } from '../fixtures/consumos';
import { entrarComo } from '../fixtures/sesiones';
import { registrarCompra, tipoDeCompra } from '../fixtures/economia';

// F11 US6: maquetación de escritorio, saldos y estadísticas (RF-228 a RF-232, CA-230 a CA-232) a 390 y 1440 px.

test('CA-230: la ficha de cápsula va en dos columnas en escritorio y en una en móvil', async ({ page, servidor }) => {
	const tipo = await tipoDeCompra(page, servidor);
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/capsulas`);
	await page
		.getByRole('link', { name: new RegExp(tipo) })
		.first()
		.click();
	await expect(page).toHaveURL(/\/admin\/capsulas\/[0-9A-Z]{26}$/);

	const nombre = page.getByRole('textbox', { name: 'Nombre', exact: true });
	const marca = page.getByRole('textbox', { name: 'Marca', exact: true });

	await page.setViewportSize({ width: 1440, height: 900 });
	const nombreEscritorio = await nombre.boundingBox();
	const marcaEscritorio = await marca.boundingBox();
	expect(marcaEscritorio?.x ?? 0).toBeGreaterThan((nombreEscritorio?.x ?? 0) + 200);
	expect(Math.abs((marcaEscritorio?.y ?? 0) - (nombreEscritorio?.y ?? 0))).toBeLessThan(8);

	await page.setViewportSize({ width: 390, height: 844 });
	const nombreMovil = await nombre.boundingBox();
	const marcaMovil = await marca.boundingBox();
	expect(marcaMovil?.y ?? 0).toBeGreaterThan((nombreMovil?.y ?? 0) + 40);
	expect(Math.abs((marcaMovil?.x ?? 0) - (nombreMovil?.x ?? 0))).toBeLessThan(2);
});

test('CA-230: en el detalle de una compra, el motivo y el botón de anular no ocupan todo el ancho en escritorio', async ({
	page,
	servidor,
}) => {
	const tipo = await tipoDeCompra(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await registrarCompra(page, servidor, tipo, '9,00', true);
	await page.setViewportSize({ width: 1440, height: 900 });

	const motivo = await page.getByRole('textbox', { name: 'Motivo de la anulación' }).boundingBox();
	const boton = await page.getByRole('button', { name: 'Anular compra', exact: true }).boundingBox();
	expect(motivo?.width ?? 9999).toBeLessThanOrEqual(448);
	expect(boton?.width ?? 9999).toBeLessThan(300);
});

test('CA-231: en Saldos, los importes de las personas se alinean a la derecha y la columna derecha va sobre un panel con borde', async ({
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'miembro');
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${servidor.url}/saldos`);
	await page.waitForLoadState('load');

	const enlaces = await page.getByRole('link', { name: /€/ }).all();
	expect(enlaces.length).toBeGreaterThan(1);
	const bordes = new Set<number>();
	for (const enlace of enlaces) {
		const caja = await enlace.locator(':scope > :last-child').boundingBox();
		if (caja && caja.x > 900) continue;
		if (caja) bordes.add(Math.round(caja.x + caja.width));
	}
	expect(bordes.size).toBeLessThanOrEqual(2);

	const panel = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Tu saldo' }) });
	await expect(panel).toHaveCSS('border-top-width', '1px');
});

test('CA-232: los «Ver datos» de Estadísticas salen abiertos y sus tablas se ven', async ({ page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	await botonDeToque(page, tipo).click();
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipo} registrado` })
			.first(),
	).toBeVisible();
	await page.goto(`${servidor.url}/estadisticas?periodo=ultimos12`);

	const detalles = page.locator('details');
	expect(await detalles.count()).toBeGreaterThan(0);
	for (const detalle of await detalles.all()) await expect(detalle).toHaveAttribute('open', '');
	await expect(page.getByRole('table').first()).toBeVisible();
});
