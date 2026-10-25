import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { cerrarSesion } from '../fixtures/economia';
import { nombreUnico } from '../fixtures/capsulas';
import { activarPersona, darDeAltaYLeerEnlace } from '../fixtures/usuarios';

// Ayuda de Capsulito (F10): «?» en cada pantalla y tour de Inicio una vez por cuenta (CA-203, CA-204, CA-205).

for (const [ruta, titulo] of [
	['/saldos', 'Ayuda: Saldos'],
	['/compras', 'Ayuda: Compras'],
	['/estadisticas', 'Ayuda: Estadísticas'],
	['/perfil', 'Ayuda: Perfil'],
] as const) {
	test(`CA-203: «?» abre la ayuda de ${ruta} y Esc la cierra`, async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}${ruta}`);
		await page.waitForLoadState('load');
		await page.getByRole('button', { name: 'Ayuda de esta pantalla', exact: true }).click();

		const panel = page.getByRole('dialog', { name: titulo });
		await expect(panel).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(panel).toBeHidden();
	});
}

test('CA-205: Arqueos y recuentos explica sus campos técnicos bajo el campo', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	await page.goto(`${servidor.url}/admin/control`);
	const campo = page.getByRole('textbox', { name: 'Dinero contado en la hucha', exact: true });
	await expect(campo).toHaveAttribute('aria-describedby', /.+/);
});

test('CA-204: una cuenta nueva ve el tour de Inicio una sola vez y lo puede repetir desde la ayuda', async ({
	browser,
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'administrador');
	const enlace = await darDeAltaYLeerEnlace(page, servidor, nombreUnico('Tour'));
	await cerrarSesion(page, servidor);

	const contexto = await browser.newContext();
	await contexto.addInitScript(() => {
		try {
			localStorage.setItem('becafe-voz', 'silenciada');
		} catch {
			// Sin almacenamiento disponible.
		}
	});
	const persona = await contexto.newPage();
	await activarPersona(persona, servidor, enlace, true);

	await expect(persona.getByRole('dialog', { name: 'Un toque, un café' })).toBeVisible();
	await persona.getByRole('button', { name: 'Siguiente', exact: true }).click();
	await expect(persona.getByRole('dialog', { name: 'Si invitas a alguien' })).toBeVisible();
	await persona.getByRole('button', { name: 'Saltar', exact: true }).click();
	await expect(persona.getByRole('dialog', { name: 'Si invitas a alguien' })).toBeHidden();

	// Saltar lo marca en la cuenta: al volver a Inicio ya no aparece.
	await persona.goto(`${servidor.url}/saldos`);
	await persona.goto(`${servidor.url}/`);
	await persona.waitForLoadState('load');
	await expect(persona.getByRole('dialog', { name: 'Un toque, un café' })).toBeHidden();

	await persona.getByRole('button', { name: 'Ayuda de esta pantalla', exact: true }).click();
	await persona.getByRole('button', { name: 'Repetir el tour', exact: true }).click();
	await expect(persona.getByRole('dialog', { name: 'Un toque, un café' })).toBeVisible();
	await contexto.close();
});
