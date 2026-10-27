import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// F16 US1 (RF-278 a RF-281): el estado de instalación de una persona llega al servidor y lo ve un administrador en su ficha.

function esperarEnvio(page: Page) {
	return page.waitForResponse((respuesta) => respuesta.request().method() === 'POST' && respuesta.url().includes('registrarInstalacion'));
}

async function fichaDe(page: Page, servidor: Parameters<typeof entrarComo>[1], nombre: RegExp) {
	await page.context().clearCookies();
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/usuarios`);
	await page.getByRole('link', { name: nombre }).first().click();
	await page.waitForLoadState('load');
}

test('CA-279, CA-281: rechazar el diálogo y luego instalar se ve en la ficha; quien nunca lo ha hecho figura sin datos', async ({
	page,
	servidor,
}) => {
	// Chrome lanza el aviso en cada carga; el diálogo del sistema se simula cancelado.
	await page.addInitScript(() => {
		window.addEventListener('load', () => {
			const aviso = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
				prompt: () => Promise.resolve(),
				userChoice: Promise.resolve({ outcome: 'dismissed' }),
			});
			window.dispatchEvent(aviso);
		});
	});

	// 1. Luis cancela el diálogo del sistema.
	await entrarComo(page, servidor, 'miembro');
	await page.waitForLoadState('load');
	await page.getByRole('link', { name: 'Perfil', exact: true }).first().click();
	await page
		.getByRole('link', { name: /^Ajustes/ })
		.first()
		.click();
	const rechazo = esperarEnvio(page);
	await page.getByRole('button', { name: 'Instalar', exact: true }).click();
	expect((await rechazo).status()).toBeLessThan(400);

	await fichaDe(page, servidor, /Luis/);
	await expect(page.getByText(/^Rechazó instalar la aplicación el /)).toBeVisible();

	// 2. Luis instala después: el navegador avisa con `appinstalled`.
	await page.context().clearCookies();
	await entrarComo(page, servidor, 'miembro');
	await page.waitForLoadState('load');
	const instalacion = esperarEnvio(page);
	await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
	expect((await instalacion).status()).toBeLessThan(400);

	await fichaDe(page, servidor, /Luis/);
	await expect(page.getByText(/^Aplicación instalada desde el /)).toBeVisible();

	// 3. Marta no ha hecho nada.
	await page.goto(`${servidor.url}/admin/usuarios`);
	await page.getByRole('link', { name: /Marta/ }).first().click();
	await expect(page.getByText('Aplicación: sin datos de instalación')).toBeVisible();
});

test('CA-281: un miembro no puede abrir la ficha de otra persona', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	const respuesta = await page.goto(`${servidor.url}/admin/usuarios`);

	expect(respuesta?.status()).toBe(403);
});
