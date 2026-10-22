import { expect, type Page } from '@playwright/test';
import type { ServidorDePrueba } from './servidor';

// Personas sembradas por `sembrar-e2e.ts` (T057). `pendiente` tiene el texto de privacidad sin aceptar.
export type Persona = keyof ServidorDePrueba['siembra']['correos'];

/**
 * Entra por el formulario de `/login` (RF-131). Se usa la entrada real en vez de una cookie precargada:
 * así también se prueba el camino que sigue cualquier persona. Espera a salir de `/login`: con JavaScript el envío es asíncrono.
 */
export async function entrarComo(page: Page, servidor: ServidorDePrueba, persona: Persona): Promise<void> {
	await page.goto(`${servidor.url}/login`);
	await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(servidor.siembra.correos[persona]);
	await page.getByRole('textbox', { name: 'Contraseña', exact: true }).fill(servidor.siembra.contrasena);
	await page.getByRole('button', { name: 'Entrar', exact: true }).click();
	await expect(page).not.toHaveURL(`${servidor.url}/login`);
}
