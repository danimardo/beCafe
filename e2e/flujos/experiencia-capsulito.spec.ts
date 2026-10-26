import { test, expect } from '../fixtures/errores-navegador';
import { botonDeInvitado, botonDeToque, tipoConCoste } from '../fixtures/consumos';
import { entrarComo } from '../fixtures/sesiones';
import { cerrarSesion } from '../fixtures/economia';
import { nombreUnico } from '../fixtures/capsulas';
import { crearEnlaceVisitante } from '../fixtures/visitantes';
import { activarPersona, darDeAltaYLeerEnlace } from '../fixtures/usuarios';

// F9/F10: navegación adaptable, tarjetas de cápsula con ilustración, mascota Capsulito, bienvenida de 9 escenas y laboratorio (CA-182 a CA-188, EV-101, EV-102).

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

	// El primer toque dejó el tipo en 0: el de invitado pide confirmación antes de registrar (RF-217).
	await btnInvitado.click();
	await page
		.getByRole('alertdialog', { name: 'El sistema dice que no quedan' })
		.getByRole('button', { name: 'Sí, registrar', exact: true })
		.click();
	await expect(page.getByRole('link', { name: new RegExp(`${tipo} · Invitado`) }).first()).toBeVisible();
});

test('CA-185, CA-186, EV-101: ocultar a Capsulito y activar su voz persisten en localStorage sin alterar las acciones de la pantalla', async ({
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/ajustes`);

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

test('CA-187: la bienvenida de 9 escenas se abre en la primera visita a Inicio, guarda becafe-bienvenida=vista al saltar y puede repetirse desde Perfil o Ayuda', async ({
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'miembro');
	await page.evaluate(() => localStorage.removeItem('becafe-bienvenida'));
	await page.goto(`${servidor.url}/`);

	const dialogo = page.getByRole('dialog');
	await expect(dialogo).toBeVisible();
	await expect(dialogo.getByText('Escena 1 de 9')).toBeVisible();

	await dialogo.getByRole('button', { name: 'Siguiente', exact: true }).click();
	await expect(dialogo.getByText('Escena 2 de 9')).toBeVisible();

	await dialogo.getByRole('button', { name: 'Saltar', exact: true }).click();
	await expect(dialogo).toHaveCount(0);

	const marca = await page.evaluate(() => localStorage.getItem('becafe-bienvenida'));
	expect(marca).toBe('vista');

	// Al recargar ya no vuelve a abrirse sola.
	await page.reload();
	await expect(page.getByRole('dialog')).toHaveCount(0);

	// Desde Ajustes se puede volver a abrir («Ver la bienvenida otra vez»).
	await page.goto(`${servidor.url}/ajustes`);
	await page.getByRole('button', { name: 'Ver la bienvenida otra vez', exact: true }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
});

test('CA-247: la quinta escena de la bienvenida explica cómo va el dinero, entre las compras y la hucha común', async ({
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'miembro');
	await page.evaluate(() => localStorage.removeItem('becafe-bienvenida'));
	await page.goto(`${servidor.url}/`);

	const dialogo = page.getByRole('dialog');
	for (let escena = 2; escena <= 4; escena++) await dialogo.getByRole('button', { name: 'Siguiente', exact: true }).click();
	await expect(dialogo.getByRole('heading', { name: 'Compras que suman' })).toBeVisible();

	await dialogo.getByRole('button', { name: 'Siguiente', exact: true }).click();
	await expect(dialogo.getByText('Escena 5 de 9')).toBeVisible();
	await expect(dialogo.getByText('La hucha común paga las cápsulas.', { exact: false }).first()).toBeVisible();

	await dialogo.getByRole('button', { name: 'Siguiente', exact: true }).click();
	await expect(dialogo.getByRole('heading', { name: 'La hucha común' })).toBeVisible();
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
	await expect(page.getByRole('heading', { name: '9 escenas de bienvenida', exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Modo SVG / WebP', exact: true }).click();
	await page.getByRole('button', { name: '4 · Abierta (A)', exact: true }).click();
	await expect(page.getByRole('button', { name: '4 · Abierta (A)', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('CA-195: en un dispositivo limpio, /login muestra primero la bienvenida con «Empezar» y no vuelve a mostrarla', async ({
	browser,
	servidor,
}) => {
	const contexto = await browser.newContext();
	const pagina = await contexto.newPage();
	await pagina.goto(`${servidor.url}/login`);
	// F13 (RF-249): antes de la bienvenida va el corto.
	await pagina
		.getByRole('dialog', { name: 'El misterio de la última cápsula' })
		.getByRole('button', { name: 'Saltar', exact: true })
		.click();

	const dialogo = pagina.getByRole('dialog');
	await expect(dialogo.getByRole('heading', { name: 'Conoce a Capsulito' })).toBeVisible();
	await dialogo.getByRole('button', { name: 'Empezar', exact: true }).click();
	await expect(dialogo.getByText('Escena 1 de 9')).toBeVisible();
	for (let escena = 2; escena <= 9; escena++) await dialogo.getByRole('button', { name: 'Siguiente', exact: true }).click();
	await expect(dialogo.getByRole('link', { name: 'Entrar', exact: true })).toHaveCount(0);
	await dialogo.getByRole('button', { name: 'Entrar', exact: true }).click();
	await expect(dialogo).toHaveCount(0);
	await expect(pagina.getByRole('textbox', { name: 'Correo electrónico', exact: true })).toBeVisible();

	await pagina.reload();
	await expect(pagina.getByRole('dialog')).toHaveCount(0);
	await contexto.close();
});

test('CA-195: con un enlace de visitante la bienvenida termina con «Soy visitante» y un enlace «Entrar»', async ({
	browser,
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'miembro');
	const enlace = await crearEnlaceVisitante(page, servidor);

	const contexto = await browser.newContext();
	const visitante = await contexto.newPage();
	await visitante.goto(enlace);
	// F13 (RF-249): antes de la bienvenida va el corto.
	await visitante
		.getByRole('dialog', { name: 'El misterio de la última cápsula' })
		.getByRole('button', { name: 'Saltar', exact: true })
		.click();
	const dialogo = visitante.getByRole('dialog');
	await dialogo.getByRole('button', { name: 'Empezar', exact: true }).click();
	for (let escena = 2; escena <= 9; escena++) await dialogo.getByRole('button', { name: 'Siguiente', exact: true }).click();
	await expect(dialogo.getByRole('link', { name: 'Entrar', exact: true })).toHaveAttribute('href', '/login');
	await dialogo.getByRole('button', { name: 'Soy visitante', exact: true }).click();
	await expect(visitante.getByRole('textbox', { name: 'Tu nombre', exact: true })).toBeVisible();
	await contexto.close();
});

test('CA-206, CA-207: una cuenta nueva ve la oferta de avisos y la tarjeta de instalación una sola vez, y Perfil conserva la instalación', async ({
	browser,
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'administrador');
	const enlace = await darDeAltaYLeerEnlace(page, servidor, nombreUnico('Primer'));
	await cerrarSesion(page, servidor);

	const contexto = await browser.newContext();
	await contexto.addInitScript(() => {
		try {
			localStorage.setItem('becafe-voz', 'silenciada');
		} catch {
			// Sin almacenamiento disponible.
		}
		// Chromium sin interfaz informa el permiso de avisos como «denied»: se fija «default» para que la oferta sea posible.
		if ('Notification' in window) Object.defineProperty(Notification, 'permission', { get: () => 'default' });
		// Chromium solo lanza `beforeinstallprompt` con una PWA instalable; se simula repitiéndolo hasta que la aplicación escucha.
		const lanzar = setInterval(() => {
			const peticion = new Event('beforeinstallprompt', { cancelable: true });
			Object.assign(peticion, { prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) });
			window.dispatchEvent(peticion);
		}, 200);
		setTimeout(() => clearInterval(lanzar), 15_000);
	});
	const persona = await contexto.newPage();
	await activarPersona(persona, servidor, enlace, true);

	await persona.getByRole('button', { name: 'Saltar', exact: true }).click();
	const oferta = persona.getByRole('heading', { name: '¿Te aviso de las novedades?' });
	const tarjeta = persona.getByRole('heading', { name: 'Instalar beCafé' });
	// El WebKit de Playwright no tiene `PushManager` ni `Notification`: sin ellos la oferta de avisos no se muestra.
	const hayAvisos = await persona.evaluate(() => 'PushManager' in window && 'Notification' in window);
	if (hayAvisos) await expect(oferta).toBeVisible();
	else await expect(oferta).toHaveCount(0);
	await expect(tarjeta).toBeVisible();

	for (let descartes = hayAvisos ? 2 : 1; descartes > 0; descartes--) {
		await persona.getByRole('button', { name: 'Ahora no', exact: true }).first().click();
	}
	await expect(oferta).toBeHidden();
	await expect(tarjeta).toBeHidden();

	// Las dos decisiones se guardan en la cuenta: no vuelven a aparecer.
	await persona.goto(`${servidor.url}/saldos`);
	await persona.goto(`${servidor.url}/`);
	await persona.waitForLoadState('load');
	await expect(oferta).toBeHidden();
	await expect(tarjeta).toBeHidden();

	// CA-206: Ajustes conserva la opción de instalar aunque se haya descartado la tarjeta.
	await persona.goto(`${servidor.url}/ajustes`);
	await expect(persona.getByRole('heading', { name: 'Instalar la aplicación' })).toBeVisible();
	await expect(persona.getByRole('button', { name: 'Instalar', exact: true })).toBeVisible();
	await contexto.close();
});
