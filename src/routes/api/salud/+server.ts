import type { RequestHandler } from './$types';
import { baseDatosResponde, registrar } from '#lib/server/plataforma';

// Salud (contracts/api.md): sin sesión y sin datos sensibles. No pasa por la puerta de privacidad.
export const GET: RequestHandler = ({ locals }) => {
	registrar('app.salud', {});
	if (!baseDatosResponde(locals.ambiente.db)) {
		return Response.json({ estado: 'error' }, { status: 503 });
	}
	return Response.json({ estado: 'ok', version: __APP_VERSION__ });
};
