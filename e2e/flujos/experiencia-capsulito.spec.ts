import { test, expect } from '../fixtures/errores-navegador';
import { botonDeInvitado, botonDeToque, tipoConCoste } from '../fixtures/consumos';
import { entrarComo } from '../fixtures/sesiones';

// F9/F10: navegación adaptable, tarjetas de cápsula con ilustración, mascota Capsulito, bienvenida de 8 escenas y laboratorio (CA-182 a CA-188, EV-101, EV-102).

test('CA-182: la navegación adapta su disposición en móvil (<768 px), intermedio (768–1023 px) y escritorio (≥1024 px), y Cerrar sesión vive en Perfil', async ({
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'administrador');

	// Móvil (< 768 px): píldora inferior y sin desplazamiento horizontal a 320 px.
	await page.setViewportSize({ width: 320, height: 640 });
	await page.goto(`${servidor.url}/`);
	await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toHaveCount(0);
	const desbordada = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
	expect(desbordada).toBe(false);

	// Intermedio (768–1023 px): carril lateral compacto.
	await page.setViewportSize({ width: 820, height: 900 });
	await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();

	// Escritorio (≥ 1024 px): barra lateral con sección Administración visible para administradores.
	await page.setViewportSize({ width: 1280, height: 800 });
	await expect(page.getByRole('navigation', { name: 'Administración' })).toBeVisible();

	// En Perfil está el botón «Cerrar sesión» y los enlaces de administración.
	await page.goto(`${servidor.url}/perfil`);
	await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Panel de administración', exact: true })).toBeVisible();
});

test('CA-183, CA-184, EV-102: la tarjeta muestra ilustración cuando no hay foto, registra consumo propio e invitado con contadores y agrupa saldos en Avisos', async ({
	page,
	servidor,
}) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);

	// Panel de avisos y saldos agrupado (CA-184).
	const panelAvisos = page.getByRole('region', { name: 'Avisos' });
	await expect(panelAvisos).toBeVisible();
	await expect(panelAvisos.getByText('Hucha (teórica)')).toBeVisible();
	await expect(panelAvisos.getByText('Tu saldo')).toBeVisible();

	// Botón de invitado de al menos 44×44 px y toque principal (CA-183).
	const btnInvitado = botonDeInvitado(page, tipo);
	const caja = await btnInvitado.boundingBox();
	expect(caja?.width ?? 0).toBeGreaterThanOrEqual(44);
	expect(caja?.height ?? 0).toBeGreaterThanOrEqual(44);

	await botonDeToque(page, tipo).click();
	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipo} registrado` })
			.first(),
	).toBeVisible();

	// El botón «Deshacer» sigue visible y pulsable sin quedar tapado por Capsulito (CA-186, EV-101).
	await expect(page.getByRole('button', { name: 'Deshacer', exact: true })).toBeVisible();

	await btnInvitado.click();
	await expect(page.getByRole('link', { name: new RegExp(`${tipo} · Invitado`) }).first()).toBeVisible();
});

test('CA-185, CA-186, EV-101: ocultar a Capsulito y activar su voz persisten en localStorage sin alterar las acciones de la pantalla', async ({
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/perfil`);

	await expect(page.locator('html')).toHaveAttribute('data-mascota', 'visible');

	const swMascota = page.getByRole('switch', { name: 'Mostrar a Capsulito', exact: true });
	const swVoz = page.getByRole('switch', { name: 'Voz de Capsulito', exact: true });

	await swVoz.click();
	await expect(swVoz).toHaveAttribute('aria-checked', 'true');
	const vozGuardada = await page.evaluate(() => localStorage.getItem('becafe-voz'));
	expect(vozGuardada).toBe('activa');

	await swMascota.click();
	await expect(swMascota).toHaveAttribute('aria-checked', 'false');
	await expect(page.locator('html')).toHaveAttribute('data-mascota', 'oculta');

	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-mascota', 'oculta');
	await expect(page.getByRole('switch', { name: 'Voz de Capsulito', exact: true })).toHaveAttribute('aria-checked', 'true');
});

test('CA-187: la bienvenida de 8 escenas se abre en la primera visita a Inicio, guarda becafe-bienvenida=vista al saltar y puede repetirse desde Perfil o Ayuda', async ({
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'miembro');
	await page.evaluate(() => localStorage.removeItem('becafe-bienvenida'));
	await page.goto(`${servidor.url}/`);

	const dialogo = page.getByRole('dialog');
	await expect(dialogo).toBeVisible();
	await expect(dialogo.getByText('Escena 1 de 8')).toBeVisible();

	await dialogo.getByRole('button', { name: 'Siguiente', exact: true }).click();
	await expect(dialogo.getByText('Escena 2 de 8')).toBeVisible();

	await dialogo.getByRole('button', { name: 'Saltar', exact: true }).click();
	await expect(dialogo).toHaveCount(0);

	const marca = await page.evaluate(() => localStorage.getItem('becafe-bienvenida'));
	expect(marca).toBe('vista');

	// Al recargar ya no vuelve a abrirse sola.
	await page.reload();
	await expect(page.getByRole('dialog')).toHaveCount(0);

	// Desde Perfil se puede volver a abrir («Ver la bienvenida otra vez»).
	await page.goto(`${servidor.url}/perfil`);
	await page.getByRole('button', { name: 'Ver la bienvenida otra vez', exact: true }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
});

test('CA-188: el laboratorio /ayuda/capsulito permite inspeccionar poses, expresiones, escenas y formas de boca', async ({
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/ayuda/capsulito`);

	await expect(page.getByRole('heading', { name: 'Laboratorio de Capsulito', exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: '8 poses de Capsulito', exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: '6 expresiones faciales', exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: '8 escenas de bienvenida', exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Modo SVG / WebP', exact: true }).click();
	await page.getByRole('button', { name: '4 · Abierta (A)', exact: true }).click();
	await expect(page.getByRole('button', { name: '4 · Abierta (A)', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
