import { join } from 'node:path';
import { crearPrimerAdministrador, hayUsuarios } from '#lib/server/auth';
import {
	abrirBaseDatos,
	aplicarMigraciones,
	crearLimitador,
	crearRegistroPino,
	registrar,
	registrarEnlaceSoloSalida,
	relojReal,
	usarRegistro,
	type Ambiente,
} from '#lib/server/plataforma';

// Raíz de composición (research R13, ARCHITECTURE.md §5). Único lugar que une los módulos con la infraestructura.
// Los módulos no leen el entorno: reciben esta configuración desde `hooks.server.ts` y desde los comandos.

export type ConfiguracionArranque = {
	origen: string;
	directorioDatos: string;
	nivelLog: string;
	adminInicialEmail: string | undefined;
	adminInicialNombre: string | undefined;
	version: string;
	commit: string;
	desarrollo: boolean;
	carpetaMigraciones: string;
};

/** Monta la base de datos, aplica las migraciones y crea el primer administrador si no hay personas. Puro salvo por la base. */
export function prepararAmbiente(configuracion: ConfiguracionArranque): Ambiente {
	const db = abrirBaseDatos(join(configuracion.directorioDatos, 'becafe.db')).db;
	const aplicadas = aplicarMigraciones(db, configuracion.carpetaMigraciones);
	registrar('app.arranque', {
		version: configuracion.version,
		commit: configuracion.commit,
		node: process.version,
		nivelLog: configuracion.nivelLog,
	});
	registrar('app.migraciones_aplicadas', { aplicadas });

	if (!hayUsuarios(db)) {
		const faltan = [
			...(configuracion.adminInicialEmail ? [] : ['ADMIN_INICIAL_EMAIL']),
			...(configuracion.adminInicialNombre ? [] : ['ADMIN_INICIAL_NOMBRE']),
		];
		if (faltan.length > 0) {
			registrar('app.entorno_invalido', { variables: faltan });
			throw new Error('ENTORNO_NO_VALIDO');
		}
		const primero = crearPrimerAdministrador(db, {
			nombre: configuracion.adminInicialNombre ?? '',
			correo: configuracion.adminInicialEmail ?? '',
			instante: relojReal.ahora(),
		});
		registrarEnlaceSoloSalida(`${configuracion.origen}/acceso/${primero.token}`);
	}

	return {
		db,
		reloj: relojReal,
		origen: configuracion.origen,
		limitadorRegistro: crearLimitador({ maximo: 30, ventanaMs: 60_000 }),
		limitadorAvisos: crearLimitador({ maximo: 1, ventanaMs: 60_000 }),
	};
}

let instancia: Ambiente | undefined;

/** Arranque del proceso: una sola vez. Instala el registro de producción y devuelve el ambiente compartido. */
export function arrancar(configuracion: ConfiguracionArranque): Ambiente {
	if (instancia) return instancia;
	const registrador = crearRegistroPino({
		nivel: configuracion.nivelLog,
		version: configuracion.version,
		commit: configuracion.commit,
		directorioLogs: join(configuracion.directorioDatos, 'logs'),
		desarrollo: configuracion.desarrollo,
	});
	usarRegistro(registrador);
	instancia = prepararAmbiente(configuracion);
	return instancia;
}
