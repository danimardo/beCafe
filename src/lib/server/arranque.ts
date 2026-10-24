import { join } from 'node:path';
import { crearPrimerAdministrador, hayUsuarios } from '#lib/server/auth';
import { enviarResumenMensual, mesAnteriorDe, TAREA_RESUMEN_MENSUAL } from '#lib/server/estadisticas';
import { determinarAguador, TAREA_AGUADOR } from '#lib/server/rellenos';
import { recordarDeudas, TAREA_RECORDATORIO_DEUDA } from '#lib/server/economia';
import { borrarAvisosAntiguos, clavePublicaDesde, crearEnvioWebPush, entregarPendientes } from '#lib/server/notificaciones';
import { fechaDeMadrid } from '#lib/shared/fechas/meses';
import { crearSubidaS3, hacerCopiaDiaria, prepararArranqueCopias, TAREA_COPIA_DIARIA, type ConfiguracionS3 } from '#lib/server/copias';
import { esquemaInstanteUtc, esquemaMes } from '#lib/shared/fechas/tipos';
import {
	abrirBaseDatos,
	crearPlanificador,
	aplicarMigraciones,
	azarReal,
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
	/** Claves VAPID. Sin ellas, el envío push y su tarea no se registran (plan F6 D6). */
	vapid?: { privada: string; sujeto: string };
	/** Copias en S3 (plan F8 D8). Sin ellas, la copia diaria no se registra. */
	s3?: ConfiguracionS3;
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
		directorioFotos: join(configuracion.directorioDatos, 'fotos'),
		limitadorRegistro: crearLimitador({ maximo: 30, ventanaMs: 60_000 }),
		limitadorAvisos: crearLimitador({ maximo: 1, ventanaMs: 60_000 }),
		azar: azarReal,
		s3Activa: configuracion.s3 !== undefined,
	};
}

const TAREA_ENTREGA_PUSH = 'entregar_pendientes';
const TAREA_LIMPIEZA_AVISOS = 'limpiar_avisos';

let instancia: Ambiente | undefined;

/**
 * Arranque del proceso: una sola vez. Instala el registro de producción, recupera las tareas no ejecutadas tras una caída
 * (antes de programar nada) y arranca el planificador. Las tareas se registran aquí a medida que las fases las añaden.
 */
export async function arrancar(configuracion: ConfiguracionArranque): Promise<Ambiente> {
	if (instancia) return instancia;
	const registrador = crearRegistroPino({
		nivel: configuracion.nivelLog,
		version: configuracion.version,
		commit: configuracion.commit,
		directorioLogs: join(configuracion.directorioDatos, 'logs'),
		desarrollo: configuracion.desarrollo,
	});
	usarRegistro(registrador);
	const ambiente = prepararAmbiente(configuracion);
	instancia = ambiente;
	const planificador = crearPlanificador({ db: ambiente.db, reloj: ambiente.reloj });
	// Una copia interrumpida por una caída queda fallida antes de programar nada (plan F8 D2).
	await prepararArranqueCopias({ db: ambiente.db, reloj: ambiente.reloj, directorioDatos: configuracion.directorioDatos });
	// Sin S3 en producción, el arranque lo dice con los nombres de las variables, nunca con sus valores (plan F8 D8).
	if (!configuracion.desarrollo && !configuracion.s3) {
		registrar('app.s3_no_configurado', { faltan: 'S3_ENDPOINT, S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY' });
	}
	if (configuracion.s3) {
		const s3 = configuracion.s3;
		const subir = crearSubidaS3(s3);
		// Copia a las 03:00 de Madrid (plan F8 D1, D12-5). Es la tarea de copias: no coincide con el resumen (09:00) ni el aguador (00:05).
		planificador.registrar({
			nombre: TAREA_COPIA_DIARIA,
			cron: '0 3 * * *',
			periodo: (instante) => fechaDeMadrid(esquemaInstanteUtc.parse(instante.toISOString())),
			ejecutar: () => hacerCopiaDiaria({ db: ambiente.db, reloj: ambiente.reloj, directorioDatos: configuracion.directorioDatos, subir }),
		});
	}
	planificador.registrar({
		nombre: TAREA_RECORDATORIO_DEUDA,
		cron: '0 9 * * *',
		periodo: (instante) => fechaDeMadrid(esquemaInstanteUtc.parse(instante.toISOString())),
		ejecutar: () => {
			recordarDeudas({ db: ambiente.db, reloj: ambiente.reloj });
		},
	});
	// El aguador va antes que el resumen: el mismo día 1, el resumen de las 09:00 lo incluye (plan F8 D5, Clarifications 5).
	planificador.registrar({
		nombre: TAREA_AGUADOR,
		cron: '5 0 1 * *',
		periodo: mesAnteriorDe,
		ejecutar: ({ periodo }) => {
			if (periodo) determinarAguador({ db: ambiente.db, reloj: ambiente.reloj, mes: esquemaMes.parse(periodo) });
		},
	});
	planificador.registrar({
		nombre: TAREA_RESUMEN_MENSUAL,
		cron: '0 9 1 * *',
		periodo: mesAnteriorDe,
		ejecutar: ({ periodo }) => {
			if (periodo) enviarResumenMensual({ db: ambiente.db, reloj: ambiente.reloj, periodo: esquemaMes.parse(periodo) });
		},
	});
	if (configuracion.vapid) {
		const envio = crearEnvioWebPush({
			publica: clavePublicaDesde(configuracion.vapid.privada),
			privada: configuracion.vapid.privada,
			sujeto: configuracion.vapid.sujeto,
		});
		planificador.registrar({
			nombre: TAREA_ENTREGA_PUSH,
			cron: '* * * * *',
			ejecutar: () => entregarPendientes({ db: ambiente.db, reloj: ambiente.reloj, enviar: envio }),
		});
		planificador.registrar({
			nombre: TAREA_LIMPIEZA_AVISOS,
			cron: '0 4 * * *',
			ejecutar: () => {
				borrarAvisosAntiguos(ambiente.db, ambiente.reloj.ahora());
			},
		});
	}
	await planificador.recuperar();
	planificador.iniciar();
	return ambiente;
}
