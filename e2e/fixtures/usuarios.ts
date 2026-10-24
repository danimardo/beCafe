import { expect, type Page } from '@playwright/test';
import type { ServidorDePrueba } from './servidor';

// Personas de prueba creadas dentro de cada test, para no alterar a las personas sembradas que usan otros tests.

/** Da de alta una persona miembro como administrador (RF-135). El nombre debe ser único. */
export async function darDeAltaPersona(page: Page, servidor: ServidorDePrueba, nombre: string): Promise<void> {
	await page.goto(`${servidor.url}/admin/usuarios`);
	await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(nombre);
	await page
		.getByRole('textbox', { name: 'Correo electrónico', exact: true })
		.fill(`${nombre.replace(/\W/g, '').toLowerCase()}@ejemplo.test`);
	await page.getByRole('button', { name: 'Dar de alta', exact: true }).click();
	await expect(page.getByText(nombre, { exact: true }).first()).toBeVisible();
}

/** Da de alta una persona y devuelve su enlace de invitación, para que otro contexto la active (CA-131). */
export async function darDeAltaYLeerEnlace(page: Page, servidor: ServidorDePrueba, nombre: string): Promise<string> {
	await darDeAltaPersona(page, servidor, nombre);
	return page.getByRole('textbox', { name: 'Enlace de acceso', exact: true }).inputValue();
}

/** Activa una persona invitada en su propio contexto: define la contraseña y acepta la privacidad (CA-132, CA-160). */
export async function activarPersona(page: Page, servidor: ServidorDePrueba, enlace: string): Promise<void> {
	await page.goto(enlace);
	await page.evaluate(() => {
		try {
			localStorage.setItem('becafe-bienvenida', 'vista');
		} catch {
			// Contextos sin localStorage continúan sin cambio.
		}
	});
	await page.getByRole('textbox', { name: 'Contraseña nueva', exact: true }).fill('contraseña de prueba de activación');
	await page.getByRole('textbox', { name: 'Repite la contraseña', exact: true }).fill('contraseña de prueba de activación');
	await page.getByRole('button', { name: 'Guardar contraseña', exact: true }).click();
	await expect(page).toHaveURL(`${servidor.url}/aceptar-privacidad`);
	await page.getByRole('button', { name: 'He leído el texto y lo acepto', exact: true }).click();
	await expect(page).toHaveURL(`${servidor.url}/?aviso=privacidad-aceptada`);
}
