import { test, expect } from '../fixtures/errores-navegador';
import { tipoConCoste } from '../fixtures/consumos';
import { cerrarSesion } from '../fixtures/economia';
import { entrarComo } from '../fixtures/sesiones';
import { crearEnlaceVisitante, entrarComoVisitante } from '../fixtures/visitantes';
import { nombreUnico } from '../fixtures/capsulas';

// Visitantes (F10): enlace de 24 h, café pendiente sin cuenta y aprobación por un administrador (CA-189 a CA-194, CA-210).

test('CA-189 a CA-193: un visitante registra un café pendiente y un administrador lo aprueba', async ({ page, browser, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	const enlace = await crearEnlaceVisitante(page, servidor);
	const nombre = nombreUnico('Marta');

	const visitante = await entrarComoVisitante(browser, servidor, enlace, nombre);
	await visitante.getByRole('button', { name: `Registrar ${tipo}`, exact: true }).click();
	await expect(visitante.getByRole('status').filter({ hasText: 'Café anotado. Queda pendiente de aprobación.' }).first()).toBeVisible();
	await expect(visitante.getByText('Pendiente de aprobación', { exact: true }).first()).toBeVisible();

	// CA-194: con la cookie de visitante, las pantallas de miembro siguen cerradas.
	await visitante.goto(`${servidor.url}/saldos`);
	await expect(visitante).toHaveURL(`${servidor.url}/login`);
	await visitante.context().close();

	await cerrarSesion(page, servidor);
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/visitantes`);
	await expect(page.getByText(nombre, { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Aprobar', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'aprobado' }).first()).toBeVisible();

	await page.goto(`${servidor.url}/admin/visitantes?vista=revisados`);
	await expect(page.getByText(nombre, { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Aprobado', { exact: true }).first()).toBeVisible();
});

test('CA-189: revocar un enlace impide entrar con él', async ({ page, browser, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	const enlace = await crearEnlaceVisitante(page, servidor);
	await page.getByRole('button', { name: 'Revocar', exact: true }).first().click();
	await expect(page.getByRole('status').filter({ hasText: 'Enlace revocado.' }).first()).toBeVisible();

	const contexto = await browser.newContext();
	const visitante = await contexto.newPage();
	await visitante.goto(enlace);
	await expect(visitante.getByRole('heading', { level: 1, name: 'Este enlace ya no sirve' })).toBeVisible();
	await contexto.close();
});

test('CA-194: una visita nueva sin enlace válido no da acceso a /visita', async ({ page, servidor }) => {
	await page.goto(`${servidor.url}/visita`);
	await expect(page).toHaveURL(`${servidor.url}/login`);
});
