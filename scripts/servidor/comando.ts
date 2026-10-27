import { join } from 'node:path';
import pkg from '../../package.json' with { type: 'json' };
import { esquemasEntorno } from '../../src/env';
import { recuperarAcceso } from '#lib/server/auth';
import { origenDeSistema } from '#lib/server/copias';
import {
	abrirBaseDatos,
	aplicarMigraciones,
	azarReal,
	crearLimitador,
	crearRegistroPino,
	esErrorDeNegocio,
	registrar,
	registrarEnlaceSoloSalida,
	registrarRechazo,
	relojReal,
	usarRegistro,
	type Ambiente,
} from '#lib/server/plataforma';
import { esquemaCorreo, esquemaNombre } from '#lib/shared/contratos/comunes';

// Comando de recuperación de administrador (RF-139b, contracts/api.md). La lógica no toca el proceso: `recuperar-admin.ts`
// valida el entorno y abre la base; las pruebas llaman a estas funciones con un ambiente de prueba.

export const SALIDA = { ok: 0, entorno: 1, uso: 2, estado: 3 } as const;

export type Entorno = { origen: string; directorioDatos: string; nivelLog: string };
export type ResultadoEntorno = { ok: true; entorno: Entorno } | { ok: false; variables: string[] };

/** Valida solo lo que el comando usa. Devuelve los nombres de las variables no válidas, nunca sus valores. */
export function validarEntorno(variables: Readonly<Record<string, string | undefined>>): ResultadoEntorno {
	const origen = esquemasEntorno.ORIGIN.safeParse(variables.ORIGIN);
	const directorio = esquemasEntorno.DIRECTORIO_DATOS.safeParse(variables.DIRECTORIO_DATOS);
	const nivel = esquemasEntorno.LOG_LEVEL.safeParse(variables.LOG_LEVEL);
	if (!origen.success || !directorio.success || !nivel.success) {
		return {
			ok: false,
			variables: [
				...(origen.success ? [] : ['ORIGIN']),
				...(directorio.success ? [] : ['DIRECTORIO_DATOS']),
				...(nivel.success ? [] : ['LOG_LEVEL']),
			],
		};
	}
	return { ok: true, entorno: { origen: origen.data, directorioDatos: directorio.data, nivelLog: nivel.data } };
}

/** Lee `--correo` y `--nombre`. Devuelve undefined si falta el correo o si un valor no supera su esquema. */
export function leerArgumentos(argv: readonly string[]): { correo: string; nombre: string | undefined } | undefined {
	const correo = esquemaCorreo.safeParse(valorDe(argv, '--correo'));
	if (!correo.success) return undefined;
	const nombreBruto = valorDe(argv, '--nombre');
	const nombre = nombreBruto === undefined ? undefined : esquemaNombre.safeParse(nombreBruto);
	if (nombre !== undefined && !nombre.success) return undefined;
	return { correo: correo.data, nombre: nombre?.success ? nombre.data : undefined };
}

function valorDe(argv: readonly string[], bandera: string): string | undefined {
	const posicion = argv.indexOf(bandera);
	const valor = posicion === -1 ? undefined : argv[posicion + 1];
	return valor === undefined || valor.startsWith('--') ? undefined : valor;
}

/** Registrador de archivo y salida estándar, base abierta y migrada. El llamador cierra la base con `cerrar`. */
export function abrirAmbienteComando(entorno: Entorno, carpetaMigraciones: string): { ambiente: Ambiente; cerrar: () => void } {
	usarRegistro(
		crearRegistroPino({
			nivel: entorno.nivelLog,
			version: pkg.version,
			commit: 'comando',
			directorioLogs: join(entorno.directorioDatos, 'logs'),
			desarrollo: false,
		}),
	);
	const conexion = abrirBaseDatos(join(entorno.directorioDatos, 'becafe.db'));
	aplicarMigraciones(conexion.db, carpetaMigraciones);
	return {
		ambiente: {
			db: conexion.db,
			reloj: relojReal,
			origen: entorno.origen,
			directorioFotos: join(entorno.directorioDatos, 'fotos'),
			limitadorRegistro: crearLimitador({ maximo: 30, ventanaMs: 60_000 }),
			limitadorAvisos: crearLimitador({ maximo: 1, ventanaMs: 60_000 }),
			limitadorVisitantes: crearLimitador({ maximo: 10, ventanaMs: 60_000 }),
			azar: azarReal,
			// Los comandos no programan copias ni restauran: la lectura del panel no las necesita.
			copias: { directorioDatos: entorno.directorioDatos, carpetaMigraciones, s3: undefined, origen: origenDeSistema(entorno.origen) },
			mantenimiento: { restaurando: false },
			reiniciar: () => undefined,
		},
		cerrar: () => conexion.cerrar(),
	};
}

/** Ejecuta RF-139b y devuelve el código de salida. El enlace va solo a la salida estándar. */
export function recuperarDesdeComando(ambiente: Ambiente, argv: readonly string[]): number {
	const argumentos = leerArgumentos(argv);
	if (!argumentos) {
		registrar('operacion.rechazada', { codigo: 'VALIDACION' });
		return SALIDA.uso;
	}
	try {
		const resultado = recuperarAcceso(ambiente.db, {
			correo: argumentos.correo,
			nombre: argumentos.nombre,
			instante: ambiente.reloj.ahora(),
			origen: 'comando',
		});
		registrarEnlaceSoloSalida(`${ambiente.origen}/acceso/${resultado.token}`);
		return SALIDA.ok;
	} catch (error) {
		if (!esErrorDeNegocio(error)) throw error;
		registrarRechazo(error);
		if (error.codigo === 'VALIDACION') return SALIDA.uso;
		if (error.codigo === 'ESTADO_INCORRECTO') return SALIDA.estado;
		throw error;
	}
}
