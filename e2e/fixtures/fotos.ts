import { expect, type Page } from '@playwright/test';

/**
 * Elige una foto en `PhotoField` y espera a que aparezca su vista previa. Si el `change` llega antes de que la página
 * se hidrate, el navegador lo descarta: se vuelve a elegir hasta que la página lo recibe (esperar a la hidratación, no ocultar un fallo).
 */
export async function elegirFoto(page: Page, buffer: Buffer, nombre = 'foto.jpg'): Promise<void> {
	await expect(async () => {
		await page.getByLabel('Hacer o elegir foto').setInputFiles({ name: nombre, mimeType: 'image/jpeg', buffer });
		await expect(page.getByRole('img', { name: 'Vista previa de la foto elegida' })).toBeVisible({ timeout: 1000 });
	}).toPass({ timeout: 15_000 });
}
