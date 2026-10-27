import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// F12 US8 (RF-248, CA-248, SC-006): en Inicio, Capsulito en reposo hace sus gestos en orden de impaciencia creciente
// y con movimiento reducido se queda quieta. El reloj es el de la página (`page.clock`): no hay esperas reales.
const GESTOS_EN_ORDEN = ['mirarLados', 'pie', 'bostezoMano', 'tocarReloj', 'bostezo'];

test('CA-259: en Inicio, Capsulito en reposo hace sus cinco gestos (mirar, pie, bostezo con la mano, reloj y bostezo), en ese orden', async ({
	page,
	servidor,
}) => {
	await page.clock.install();
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/`);
	const capsulito = page.locator('[data-reposo]').first();
	await expect(capsulito).toHaveAttribute('data-reposo', 'quieto');

	const vistos: string[] = [];
	// Cada segundo basta: el gesto más corto dura 1,2 s, así que ninguno cae entre dos muestras.
	for (let segundo = 0; segundo < 36; segundo += 1) {
		await page.clock.runFor(1000);
		const gesto = await capsulito.getAttribute('data-reposo');
		if (gesto && gesto !== 'quieto' && vistos.at(-1) !== gesto) vistos.push(gesto);
	}
	expect(vistos.slice(0, 5)).toEqual(GESTOS_EN_ORDEN);
	// El lienzo de reposo se monta (y su archivo se descarga sin errores) en cuanto lleva 3 s quieta.
	await expect(page.getByTestId('capsulito-reposo').first()).toBeAttached();
});

test.describe('con movimiento reducido', () => {
	test.use({ reducedMotion: 'reduce' });

	test('CA-248: Capsulito sigue quieta durante 60 s simulados', async ({ page, servidor }) => {
		await page.clock.install();
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/`);
		const capsulito = page.locator('[data-reposo]').first();
		await expect(capsulito).toHaveAttribute('data-reposo', 'quieto');

		for (let segundo = 0; segundo < 60; segundo += 1) {
			await page.clock.runFor(1000);
			await expect(capsulito).toHaveAttribute('data-reposo', 'quieto');
		}
		await expect(page.getByTestId('capsulito-reposo')).toHaveCount(0);
	});
});
