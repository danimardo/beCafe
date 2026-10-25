import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Falla si la pantalla tiene infracciones de axe (constitución XI: sin infracciones en las pruebas E2E). */
export async function expectSinInfracciones(page: Page): Promise<void> {
	// Axe mide el contraste sobre el color compuesto: con una animación de entrada a medias (opacidad) da un falso positivo.
	// Las animaciones infinitas (mascota) no terminan nunca y se descartan.
	await page.evaluate(() =>
		Promise.all(
			document
				.getAnimations()
				.filter((animacion) => animacion.effect?.getComputedTiming().iterations !== Infinity)
				.map((animacion) => animacion.finished),
		),
	);
	const resultado = await new AxeBuilder({ page }).analyze();
	// El selector de cada nodo localiza la infracción sin abrir el informe completo.
	expect(
		resultado.violations.map(
			(infraccion) => `${infraccion.id}: ${infraccion.help} → ${infraccion.nodes.map((nodo) => nodo.target.join(' ')).join(', ')}`,
		),
	).toEqual([]);
}
