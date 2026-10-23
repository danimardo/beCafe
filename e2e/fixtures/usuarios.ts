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
