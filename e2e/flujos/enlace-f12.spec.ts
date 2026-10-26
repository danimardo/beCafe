import { test, expect } from '../fixtures/errores-navegador';
import type { Locator, Page } from '@playwright/test';
import { entrarComo } from '../fixtures/sesiones';
import { darDeAltaPersona } from '../fixtures/usuarios';
import { nombreUnico } from '../fixtures/capsulas';
import type { ServidorDePrueba } from '../fixtures/servidor';

// RF-239, CA-239: el enlace que genera el alta, «Generar enlace» o «Reactivar» sale justo debajo del botón que lo generó.

/** Mide los dos rectángulos en el mismo fotograma: con el desplazamiento suave, dos lecturas seguidas darían posiciones distintas. */
async function estaDebajo(boton: Locator, campo: Locator): Promise<void> {
	const [elementoBoton, elementoCampo] = [await boton.elementHandle(), await campo.elementHandle()];
	const hueco = await boton
		.page()
		.evaluate(
			([a, b]) => (a instanceof Element && b instanceof Element ? b.getBoundingClientRect().top - a.getBoundingClientRect().bottom : NaN),
			[elementoBoton, elementoCampo],
		);
	expect(hueco).toBeGreaterThanOrEqual(-1);
	expect(hueco).toBeLessThan(200);
}

async function abrirFicha(page: Page, servidor: ServidorDePrueba, nombre: string): Promise<void> {
	await darDeAltaPersona(page, servidor, nombre);
	await page.goto(`${servidor.url}/admin/usuarios`);
	await page.getByRole('link', { name: nombre }).first().click();
	await page.waitForLoadState('load');
}

test('CA-239: el alta muestra el enlace bajo «Dar de alta», lo anuncia y lo deja a la vista', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/usuarios`);
	const nombre = nombreUnico('Enlace');
	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(nombre);
	await page
		.getByRole('textbox', { name: 'Correo electrónico', exact: true })
		.fill(`${nombre.replace(/\W/g, '').toLowerCase()}@ejemplo.test`);
	const boton = page.getByRole('button', { name: 'Dar de alta', exact: true });
	await boton.click();

	const campo = page.getByRole('textbox', { name: 'Enlace de acceso', exact: true });
	await expect(campo).toHaveValue(new RegExp(`${servidor.url}/acceso/`));
	await estaDebajo(boton, campo);
	await expect(campo).toBeInViewport();
	await expect(page.getByRole('status').filter({ hasText: 'Enlace listo para copiar' })).toHaveCount(1);
});

test('CA-239: «Generar enlace» muestra el enlace bajo su botón y no arriba de la ficha', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await abrirFicha(page, servidor, nombreUnico('Generar'));
	const boton = page.getByRole('button', { name: 'Generar enlace', exact: true });
	await boton.click();

	const campo = page.getByRole('textbox', { name: 'Enlace de acceso', exact: true });
	await expect(campo).toHaveValue(new RegExp(`${servidor.url}/acceso/`));
	await estaDebajo(boton, campo);
	await expect(campo).toBeInViewport();
	await expect(page.getByRole('status').filter({ hasText: 'Enlace listo para copiar' })).toHaveCount(1);
});

test('CA-239: «Reactivar» muestra el enlace bajo su botón', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await abrirFicha(page, servidor, nombreUnico('Reactivar'));
	await page.getByRole('link', { name: 'Dar de baja', exact: true }).click();
	await page.getByRole('button', { name: 'Ver efecto', exact: true }).click();
	await page.getByLabel('Contraseña actual', { exact: true }).fill(servidor.siembra.contrasena);
	await page.getByRole('button', { name: 'Confirmar la baja', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Baja registrada' }).first()).toBeVisible();

	await page.getByRole('button', { name: 'Reactivar', exact: true }).click();

	// Al reactivar, la persona pasa a activa y «Reactivar» deja su sitio a «Generar enlace»: el enlace sale bajo esa sección.
	const campo = page.getByRole('textbox', { name: 'Enlace de acceso', exact: true });
	await expect(campo).toHaveValue(new RegExp(`${servidor.url}/acceso/`));
	await estaDebajo(page.getByRole('button', { name: 'Generar enlace', exact: true }), campo);
	await expect(campo).toBeInViewport();
});
