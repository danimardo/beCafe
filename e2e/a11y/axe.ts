import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Falla si la pantalla tiene infracciones de axe (constitución XI: sin infracciones en las pruebas E2E). */
export async function expectSinInfracciones(page: Page): Promise<void> {
	const resultado = await new AxeBuilder({ page }).analyze();
	expect(resultado.violations.map((infraccion) => `${infraccion.id}: ${infraccion.help}`)).toEqual([]);
}
