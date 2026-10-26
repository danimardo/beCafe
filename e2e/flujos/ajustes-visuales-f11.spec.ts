import { test, expect } from '../fixtures/errores-navegador';
import { botonDeToque, tipoConCoste } from '../fixtures/consumos';
import { entrarComo } from '../fixtures/sesiones';

// Pulido posterior a F11 (25-10-2026): intro a pantalla completa en móvil, «Me pongo esta», Aportar alineado y Perfil más ancho.

test('la introducción «Conoce a Capsulito» ocupa la pantalla en móvil y su contenido queda centrado en vertical', async ({
	browser,
	servidor,
}) => {
	const contexto = await browser.newContext({ viewport: { width: 390, height: 844 } });
	const pagina = await contexto.newPage();
	await pagina.goto(`${servidor.url}/login`);
	// F13 (RF-249): antes de la introducción va el corto.
	await pagina
		.getByRole('dialog', { name: 'El misterio de la última cápsula' })
		.getByRole('button', { name: 'Saltar', exact: true })
		.click();
	const dialogo = pagina.getByRole('dialog');
	await expect(pagina.getByRole('heading', { name: 'Conoce a Capsulito' })).toBeVisible();

	const hoja = await dialogo.boundingBox();
	expect(hoja?.y ?? 99).toBeLessThan(2);
	expect(hoja?.height ?? 0).toBeGreaterThan(830);

	const titulo = await pagina.getByRole('heading', { name: 'Conoce a Capsulito' }).boundingBox();
	const centro = (titulo?.y ?? 0) + (titulo?.height ?? 0) / 2;
	expect(centro).toBeGreaterThan(844 * 0.4);
	expect(centro).toBeLessThan(844 * 0.7);
	await contexto.close();
});

test('el botón de cada cápsula dice «Me pongo esta» y su nombre accesible sigue siendo «Registrar <tipo>»', async ({ page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	const boton = botonDeToque(page, tipo);
	await expect(boton).toBeVisible();
	await expect(boton).toContainText('Me pongo esta');
	await expect(boton).not.toContainText('+1');
});

test('Aportar: «Para», «Importe» y el botón comparten línea y alto en escritorio', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${servidor.url}/saldos`);

	const para = await page.getByRole('combobox', { name: 'Para' }).boundingBox();
	const importe = await page.getByRole('textbox', { name: 'Importe' }).boundingBox();
	const boton = await page.getByRole('button', { name: 'Aportar', exact: true }).boundingBox();
	expect(Math.abs((importe?.y ?? 0) - (para?.y ?? 99))).toBeLessThan(2);
	expect(Math.abs((boton?.y ?? 0) - (para?.y ?? 99))).toBeLessThan(2);
	expect(Math.abs((boton?.height ?? 0) - (para?.height ?? 99))).toBeLessThan(2);
});

test('Perfil: en escritorio las dos columnas miden más de 440 px', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${servidor.url}/perfil`);

	const campo = await page.getByLabel('Contraseña actual', { exact: true }).boundingBox();
	const foto = await page.getByRole('button', { name: /Guardar foto/ }).boundingBox();
	expect(campo?.width ?? 0).toBeGreaterThan(400);
	expect(foto?.width ?? 0).toBeGreaterThan(400);
});
