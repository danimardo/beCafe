import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import type { RequestHandler } from './$types';
import { rutaFoto } from '#lib/server/plataforma';
import { leerFotoUsuario } from '#lib/server/usuarios';
import { textos } from '#lib/shared/textos';

// Foto de una persona (RF-208, constitución V): se sirve por la aplicación y solo a un miembro con sesión. No es un formulario.
// La dirección lleva `?v=<foto>`, así que un cambio de foto renueva la caché del navegador.
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.actor) error(401, textos.errores.SIN_SESION);
	const nombre = leerFotoUsuario(locals.ambiente.db, params.usuarioId);
	if (!nombre) error(404, textos.fotoPersona.noEncontrada);
	const contenido = await readFile(rutaFoto(locals.ambiente.directorioFotos, nombre));
	return new Response(new Uint8Array(contenido), {
		headers: { 'content-type': 'image/webp', 'cache-control': 'private, max-age=300' },
	});
};
