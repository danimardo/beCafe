import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// F11 US8 (RF-233 a RF-236, EV-110): con movimiento reducido ninguna microinteracción anima nada y todo sigue visible.
test.use({ reducedMotion: 'reduce' });

/** Nombres de las animaciones y transiciones en curso. */
async function enCurso(page: Page): Promise<string[]> {
	return page.evaluate(() =>
		document
			.getAnimations()
			.filter((animacion) => animacion.playState === 'running')
			.map((animacion) =>
				animacion instanceof CSSAnimation
					? animacion.animationName
					: animacion instanceof CSSTransition
						? `transición ${animacion.transitionProperty}`
						: 'animación',
			),
	);
}

test('EV-110: la pantalla de entrada no anima nada con movimiento reducido', async ({ page, servidor }) => {
	await page.goto(`${servidor.url}/login`);
	await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
	await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(servidor.siembra.correos.miembro);
	await page.getByRole('textbox', { name: 'Contraseña', exact: true }).fill('una contraseña que no es correcta');
	await page.getByRole('button', { name: 'Entrar', exact: true }).click();
	await expect(page.getByRole('alert').first()).toBeVisible();
	expect(await enCurso(page)).toEqual([]);
});

test('EV-110: Inicio, Compras y Ajustes no animan nada y la selección, el foco y el error siguen visibles', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	for (const ruta of ['/', '/compras', '/ajustes']) {
		await page.goto(`${servidor.url}${ruta}`);
		await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
		expect(await enCurso(page), `animaciones en ${ruta}`).toEqual([]);
	}

	// Selección: el tema elegido queda marcado y con su indicador, sin transición.
	const oscuro = page.getByRole('radio', { name: 'Oscuro' });
	await oscuro.click();
	await expect(oscuro).toBeChecked();
	await expect(page.getByRole('radiogroup', { name: 'Apariencia' })).toHaveAttribute('data-indicador-listo', '');
	expect(await enCurso(page)).toEqual([]);

	// Foco y error: el campo muestra el foco y el mensaje de error aparece sin sacudida ni entrada.
	await page.goto(`${servidor.url}/perfil`);
	const actual = page.getByLabel('Contraseña actual', { exact: true });
	await actual.focus();
	await expect(actual).toBeFocused();
	await actual.fill('una contraseña que no es correcta');
	await page.getByLabel('Contraseña nueva', { exact: true }).fill('otra contraseña larga de prueba');
	await page.getByLabel('Repite la contraseña', { exact: true }).fill('otra contraseña larga de prueba');
	await page.getByRole('button', { name: 'Cambiar contraseña', exact: true }).click();
	await expect(actual).toHaveAttribute('aria-invalid', 'true');
	expect(await enCurso(page)).toEqual([]);
});
