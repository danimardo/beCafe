import { join } from 'node:path';
import { crearRegistroSoloSalida, registrar, usarRegistro } from '#lib/server/plataforma';
import { abrirAmbienteComando, recuperarDesdeComando, SALIDA, validarEntorno } from './comando';

// Punto de entrada del comando (`npm run admin:recuperar -- --correo <correo> [--nombre <nombre>]`). Solo compone:
// la lógica está en `comando.ts`.
const validacion = validarEntorno(process.env);
if (!validacion.ok) {
	usarRegistro(crearRegistroSoloSalida());
	registrar('app.entorno_invalido', { variables: validacion.variables });
	process.exitCode = SALIDA.entorno;
} else {
	const { ambiente, cerrar } = abrirAmbienteComando(validacion.entorno, join(process.cwd(), 'drizzle'));
	process.exitCode = recuperarDesdeComando(ambiente, process.argv.slice(2));
	cerrar();
}
