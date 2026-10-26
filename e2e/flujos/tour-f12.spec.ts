import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// RF-240, CA-240: en el tour habla (mueve la boca) el Capsulito de la tarjeta del paso; el de arriba de Inicio queda quieto.
// Las formas de boca que ve cada grupo se guardan en `window.__bocas`, declarada aquí para no usar aserciones de tipo.
declare global {
	interface Window {
		__bocas?: { tarjeta: string[]; inicio: string[] };
	}
}

test('CA-240: durante el tour mueve la boca el Capsulito de la tarjeta y el de Inicio se queda quieto', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	// Cada documento nuevo (también el de `/?tour=si`) arranca con la voz activa y un observador de las formas de boca.
	await page.addInitScript(() => {
		localStorage.setItem('becafe-voz', 'activa');
		localStorage.setItem('becafe-mascota', 'visible');
		const bocas: { tarjeta: string[]; inicio: string[] } = { tarjeta: [], inicio: [] };
		window.__bocas = bocas;
		addEventListener('DOMContentLoaded', () => {
			const observador = new MutationObserver(() => {
				for (const envoltorio of document.querySelectorAll('[data-boca]')) {
					const dentro = envoltorio.closest('[role="dialog"]') !== null;
					bocas[dentro ? 'tarjeta' : 'inicio'].push(envoltorio.getAttribute('data-boca') ?? '');
				}
			});
			observador.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-boca'] });
		});
	});
	await page.goto(`${servidor.url}/?tour=si`);
	await expect(page.getByRole('dialog')).toBeVisible();
	// El saludo de Inicio puede hablar antes de que aparezca el tour: se mide solo desde que la tarjeta está a la vista.
	await page.evaluate(() => {
		const bocas = window.__bocas;
		if (bocas) {
			bocas.tarjeta.length = 0;
			bocas.inicio.length = 0;
		}
	});

	await expect
		.poll(async () => page.evaluate(() => (window.__bocas?.tarjeta ?? []).some((boca) => boca !== '0')), {
			timeout: 15_000,
		})
		.toBe(true);
	const inicio = await page.evaluate(() => window.__bocas?.inicio ?? []);
	expect(inicio.filter((boca) => boca !== '0')).toEqual([]);
});
