import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import type { RequestHandler } from './$types';
import { leerFotoCapsula } from '#lib/server/catalogo';
import { rutaFoto } from '#lib/server/plataforma';
import { textos } from '#lib/shared/textos';

// Foto de un tipo de cápsula (constitución V): se sirve por la aplicación y solo con sesión. No es un formulario.
export const GET: RequestHandler = async ({ locals, params }) => {
	const actor = locals.actor;
	if (!actor) error(401, textos.errores.SIN_SESION);
	const nombre = leerFotoCapsula(locals.ambiente.db, actor, params.capsulaId);
	if (!nombre) error(404, textos.capsulas.noEncontrado);
	const contenido = await readFile(rutaFoto(locals.ambiente.directorioFotos, nombre));
	return new Response(new Uint8Array(contenido), {
		headers: { 'content-type': 'image/webp', 'cache-control': 'private, max-age=3600' },
	});
};
