import { join } from 'node:path';
import { crearPrimerAdministrador, hayUsuarios } from '#lib/server/auth';
import { enviarResumenMensual, mesAnteriorDe, TAREA_RESUMEN_MENSUAL } from '#lib/server/estadisticas';
import { recordarDeudas, TAREA_RECORDATORIO_DEUDA } from '#lib/server/economia';
import { borrarAvisosAntiguos, clavePublicaDesde, crearEnvioWebPush, entregarPendientes } from '#lib/server/notificaciones';
import { fechaDeMadrid } from '#lib/shared/fechas/meses';
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
	planificador.registrar({
		nombre: TAREA_RECORDATORIO_DEUDA,
		cron: '0 9 * * *',
		periodo: (instante) => fechaDeMadrid(esquemaInstanteUtc.parse(instante.toISOString())),
		ejecutar: () => {
			recordarDeudas({ db: ambiente.db, reloj: ambiente.reloj });
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
