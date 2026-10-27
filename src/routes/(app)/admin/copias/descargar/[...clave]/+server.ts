import { error } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { errorDeCarga } from '../../../../fallo';
import { descargarCopia, ErrorCopia, ErrorOperacionCopia, ESTADO_OPERACION_COPIA, esquemaClaveCopia } from '#lib/server/copias';
import { textos } from '#lib/shared/textos';

// Descarga de una copia del bucket (plan F17 D1, RF-284, ADR 0007). Entrega un archivo, no un formulario: solo administradores.
const esquemaConsulta = z.strictObject({ clave: esquemaClaveCopia });

export const GET: RequestHandler = async ({ locals, params }) => {
	// Como las fotos: no es una página, así que sin sesión responde 401 y no redirige a la entrada.
	if (!locals.actor) error(401, textos.errores.SIN_SESION);
	const consulta = esquemaConsulta.safeParse(params);
	if (!consulta.success) error(404, textos.copias.operacion.NO_ENCONTRADA);
	try {
		const copia = await descargarCopia(locals.ambiente, locals.actor, consulta.data.clave);
		return new Response(copia.cuerpo, {
			headers: {
				'content-type': 'application/gzip',
				'content-disposition': `attachment; filename="${copia.nombre}"`,
				...(copia.tamano === null ? {} : { 'content-length': String(copia.tamano) }),
				// La copia lleva todos los datos: ni el navegador ni un intermediario la guardan.
				'cache-control': 'no-store',
			},
		});
	} catch (causa) {
		if (causa instanceof ErrorOperacionCopia) error(ESTADO_OPERACION_COPIA[causa.codigo], textos.copias.operacion[causa.codigo]);
		if (causa instanceof ErrorCopia) error(502, textos.copias.errorBucket);
		return errorDeCarga(causa);
	}
};
