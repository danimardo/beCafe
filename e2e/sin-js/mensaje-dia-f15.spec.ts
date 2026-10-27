import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { MENSAJES_DIA } from '#lib/shared/mascota/mensajes-dia';

// F15 US1, sin JavaScript (constitución XVII): el servidor pinta el mensaje del día en el primer renderizado (RF-266).

test('CA-266: sin JavaScript, el bocadillo de Inicio muestra un mensaje del día', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/`);
	const contenido = await page.locator('[role="group"][aria-label="Capsulito"]').innerText();
	const fragmentos = MENSAJES_DIA.map((mensaje) => mensaje.texto.split('{nombre}').at(-1)?.trim() ?? '');
	expect(fragmentos.some((fragmento) => fragmento.length > 0 && contenido.includes(fragmento))).toBe(true);
});
