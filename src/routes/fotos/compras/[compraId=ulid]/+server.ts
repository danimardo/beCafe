import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import type { RequestHandler } from './$types';
import { leerFotoTicket } from '#lib/server/economia';
import { textos } from '#lib/shared/textos';

// Foto del ticket de una compra (RF-024). Solo con sesión; la sirve la aplicación (constitución V).
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.actor) error(401, textos.errores.SIN_SESION);
	const ruta = leerFotoTicket(locals.ambiente, locals.actor, params.compraId);
	if (!ruta) error(404, textos.economia.sinFoto);
	const contenido = await readFile(ruta);
	return new Response(new Uint8Array(contenido), {
		headers: { 'content-type': 'image/webp', 'cache-control': 'private, max-age=3600' },
	});
};
