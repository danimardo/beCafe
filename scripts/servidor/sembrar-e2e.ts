import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { definirContrasenaConEnlace, generarEnlace } from '#lib/server/auth';
import { enTransaccion, nuevoId, type Ambiente } from '#lib/server/plataforma';
import { aceptarPrivacidadPersona, crearUsuario, marcarCuenta } from '#lib/server/usuarios';
import { VERSION_PRIVACIDAD } from '#lib/shared/privacidad';
import { abrirAmbienteComando, validarEntorno } from './comando';

// Siembra de datos de prueba para E2E (T057). Solo para la base temporal de un worker: nunca contra datos reales.
// Usa funciones públicas de `usuarios` y `auth`. Escribe sus datos en un fichero del directorio de datos, no en la consola.
// Empaquetado en `build-scripts/sembrar-e2e.js` (`npm run build:comandos`).

const CONTRASENA_PRUEBA = 'contraseña de prueba e2e';
const CORREO_ANA = 'ana.prueba@ejemplo.es';
const CORREO_LUIS = 'luis.prueba@ejemplo.es';
const CORREO_PEDRO = 'pedro.prueba@ejemplo.es';
const CORREO_MARTA = 'marta.prueba@ejemplo.es';

/** Alta directa de una persona de prueba. Sin contraseña: la define después su enlace. */
function alta(ambiente: Ambiente, correo: string, nombre: string, rol: 'miembro' | 'administrador'): string {
	const id = nuevoId();
	enTransaccion(ambiente.db, (tx) => crearUsuario(tx, { id, nombre, correo, rol, instante: ambiente.reloj.ahora() }));
	return id;
}

/** Enlace de invitación de 24 horas (CA-131). */
function tokenDe(ambiente: Ambiente, usuarioId: string): string {
	const { token } = enTransaccion(ambiente.db, (tx) =>
		generarEnlace(tx, { usuarioId, tipo: 'invitacion', origen: 'aplicacion', creadoPor: null, instante: ambiente.reloj.ahora() }),
	);
	return token;
}

async function sembrar(): Promise<number> {
	const validacion = validarEntorno(process.env);
	if (!validacion.ok) return 1;

	const { ambiente, cerrar } = abrirAmbienteComando(validacion.entorno, join(process.cwd(), 'drizzle'));
	try {
		const ana = alta(ambiente, CORREO_ANA, 'Ana', 'administrador');
		const luis = alta(ambiente, CORREO_LUIS, 'Luis', 'miembro');
		const pedro = alta(ambiente, CORREO_PEDRO, 'Pedro', 'miembro');
		// Marta entra con contraseña pero sin aceptar el texto: prueba la pantalla de aceptación sin depender de otros flujos.
		const marta = alta(ambiente, CORREO_MARTA, 'Marta', 'miembro');
		await definirContrasenaConEnlace(ambiente.db, {
			token: tokenDe(ambiente, marta),
			contrasena: CONTRASENA_PRUEBA,
			instante: ambiente.reloj.ahora(),
		});

		// Ana y Luis entran con contraseña, por el mismo flujo de enlace que usa la aplicación (RF-132).
		for (const usuarioId of [ana, luis]) {
			await definirContrasenaConEnlace(ambiente.db, {
				token: tokenDe(ambiente, usuarioId),
				contrasena: CONTRASENA_PRUEBA,
				instante: ambiente.reloj.ahora(),
			});
			// Entran con el texto ya aceptado; Pedro lo acepta en su flujo de invitación (T076).
			aceptarPrivacidadPersona(ambiente.db, { usuarioId, version: VERSION_PRIVACIDAD, instante: ambiente.reloj.ahora() });
		}

		// El tour, la tarjeta de instalación y la oferta de avisos (RF-204, RF-206, RF-207) se prueban con una cuenta nueva:
		// las sembradas ya los han visto y no tapan sus pruebas.
		for (const usuarioId of [ana, luis, pedro, marta]) {
			for (const clave of ['tour_inicio_visto', 'instalacion_descartada', 'oferta_avisos_vista'] as const)
				marcarCuenta(ambiente, usuarioId, clave);
		}

		const siembra = {
			correos: { administrador: CORREO_ANA, miembro: CORREO_LUIS, invitada: CORREO_PEDRO, pendiente: CORREO_MARTA },
			contrasena: CONTRASENA_PRUEBA,
			enlacePedro: `${ambiente.origen}/acceso/${tokenDe(ambiente, pedro)}`,
		};
		writeFileSync(join(validacion.entorno.directorioDatos, 'siembra-e2e.json'), JSON.stringify(siembra));
		return 0;
	} finally {
		cerrar();
	}
}

process.exitCode = await sembrar();
