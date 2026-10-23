import { cerrarSesionesPorBaja, exigirAdministrador, exigirReautenticacion, type Actor } from '#lib/server/auth';
import { anotarAuditoria, buscarUsuarioPorId, marcarBaja } from '#lib/server/usuarios';
import { registrarAviso, retirarPersona } from '#lib/server/notificaciones';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import {
	enTransaccion,
	ErrorDeNegocio,
	nuevoId,
	RecursoNoEncontrado,
	registrar,
	type Ambiente,
	type Ejecutor,
	type Tx,
} from '#lib/server/plataforma';
import { avisoEconomia } from './esquema';
import { anotarMovimientos, saldoHucha, saldoPersona } from './libro';
import { escribirAportacion } from './aportaciones';
import { personasActivas, repartirEnPersonas } from './control';

// Baja de una persona con liquidación (RF-135, RF-136, CA-135, CA-136, Clarifications 14 y 15).
// El saldo debe quedar en 0. Según el signo, la liquidación es un pago (deuda), un incobrable (deuda repartida entre
// los demás) o una devolución (saldo a favor, que sale de la hucha). Con saldo 0 no hay movimientos.

export type ModoBaja = 'ninguna' | 'pago' | 'devolucion' | 'incobrable';

const RUTA = 'admin/usuarios/baja';

/** Modos que ofrece el asistente según el saldo: ninguno con saldo 0, pago o incobrable con deuda, devolución con crédito. */
export function modosPosibles(saldo: number): ModoBaja[] {
	if (saldo === 0) return ['ninguna'];
	return saldo < 0 ? ['pago', 'incobrable'] : ['devolucion'];
}

export function leerLiquidacion(db: Ejecutor, actor: Actor, usuarioId: string) {
	exigirAdministrador(actor, RUTA);
	const persona = buscarUsuarioPorId(db, usuarioId);
	if (!persona) throw new RecursoNoEncontrado();
	const saldo = saldoPersona(db, usuarioId);
	return {
		usuarioId,
		nombre: persona.nombre,
		estado: persona.estado,
		saldo,
		saldoHucha: saldoHucha(db),
		modos: modosPosibles(saldo),
	};
}

export type PrevisionBaja = {
	modo: ModoBaja;
	saldo: number;
	huchaActual: number;
	huchaDespues: number;
	importeReparto: number;
	personasReparto: number;
	huchaNegativa: boolean;
};

/** Efecto de un modo de baja antes de confirmarlo (RF-135, CA-135). No escribe nada. */
export function previsualizarBaja(db: Ejecutor, actor: Actor, usuarioId: string, modo: ModoBaja): PrevisionBaja {
	exigirAdministrador(actor, RUTA);
	if (!buscarUsuarioPorId(db, usuarioId)) throw new RecursoNoEncontrado();
	const saldo = saldoPersona(db, usuarioId);
	if (!modosPosibles(saldo).includes(modo)) throw new ErrorDeNegocio('VALIDACION');
	const huchaActual = saldoHucha(db);
	const importe = Math.abs(saldo);
	const huchaDespues = modo === 'pago' ? huchaActual + importe : modo === 'devolucion' ? huchaActual - importe : huchaActual;
	const reparte = modo === 'incobrable';
	return {
		modo,
		saldo,
		huchaActual,
		huchaDespues,
		importeReparto: reparte ? importe : 0,
		personasReparto: reparte ? personasActivas(db).filter((persona) => persona.id !== usuarioId).length : 0,
		huchaNegativa: huchaDespues < 0,
	};
}

export async function darDeBaja(
	ambiente: Ambiente,
	actor: Actor,
	entrada: {
		usuarioId: string;
		modo: ModoBaja;
		saldoPrevisto: number;
		confirmoHuchaNegativa: boolean;
		contrasenaActual: string | undefined;
	},
): Promise<void> {
	exigirAdministrador(actor, RUTA);
	const instante = ambiente.reloj.ahora();
	await exigirReautenticacion(ambiente.db, { actor, contrasenaActual: entrada.contrasenaActual, instante });

	enTransaccion(ambiente.db, (tx) => {
		const persona = buscarUsuarioPorId(tx, entrada.usuarioId);
		if (!persona) throw new RecursoNoEncontrado();
		const saldo = saldoPersona(tx, entrada.usuarioId);
		if (saldo !== entrada.saldoPrevisto) throw new ErrorDeNegocio('CAMBIO_CONCURRENTE');
		if (!modosPosibles(saldo).includes(entrada.modo)) throw new ErrorDeNegocio('VALIDACION');

		marcarBaja(tx, { usuarioId: entrada.usuarioId, instante });
		retirarPersona(tx, entrada.usuarioId);
		cerrarSesionesPorBaja(tx, entrada.usuarioId, instante);
		aplicarModo(tx, { ...entrada, saldo, actorId: actor.usuarioId, instante, azar: ambiente.azar });

		if (saldoPersona(tx, entrada.usuarioId) !== 0) {
			registrar('invariante.violada', { tipo: 'saldo_baja', id: entrada.usuarioId });
			throw new Error('El saldo de la persona no queda en 0 tras la baja');
		}
		anotarAuditoria(tx, {
			actorId: actor.usuarioId,
			accion: 'usuario.baja',
			objetoId: entrada.usuarioId,
			detalle: { modo: entrada.modo },
			instante,
		});
	});
	registrar('usuario.baja', { usuarioId: entrada.usuarioId, modo: entrada.modo });
	registrar('liquidacion.aplicada', { usuarioId: entrada.usuarioId, modo: entrada.modo });
}

function aplicarModo(
	tx: Tx,
	entrada: {
		usuarioId: string;
		modo: ModoBaja;
		saldo: number;
		confirmoHuchaNegativa: boolean;
		actorId: string;
		instante: string;
		azar: Ambiente['azar'];
	},
): void {
	const { usuarioId, modo, saldo, instante } = entrada;
	if (modo === 'ninguna') return;

	if (modo === 'pago') {
		// La persona paga su deuda como una aportación de la baja (origen `baja`), registrada por quien liquida.
		escribirAportacion(tx, { importe: -saldo, usuarioId, registradaPor: entrada.actorId, origen: 'baja', instante });
		return;
	}

	if (modo === 'incobrable') {
		// La deuda se da por perdida: la persona queda a cero y las demás personas activas reparten la pérdida.
		anotarMovimientos(tx, [
			{
				cuenta: 'persona',
				usuarioId,
				tipo: 'abono_incobrable',
				importe: -saldo,
				origenTipo: 'baja',
				origenId: usuarioId,
				creadoEn: instante,
			},
		]);
		repartirEnPersonas(tx, {
			importe: saldo,
			origenTipo: 'baja',
			origenId: usuarioId,
			tipo: 'reparto_incobrable',
			instante,
			azar: entrada.azar,
		});
		return;
	}

	// Devolución: el saldo a favor sale de la hucha. Si la deja en negativo, hace falta confirmación (RN-019).
	const huchaTrasDevolver = saldoHucha(tx) - saldo;
	if (huchaTrasDevolver < 0 && !entrada.confirmoHuchaNegativa) throw new ErrorDeNegocio('CONFIRMACION_REQUERIDA');
	anotarMovimientos(tx, [
		{ cuenta: 'persona', usuarioId, tipo: 'devolucion_baja', importe: -saldo, origenTipo: 'baja', origenId: usuarioId, creadoEn: instante },
		{
			cuenta: 'hucha',
			usuarioId: null,
			tipo: 'hucha_devolucion_baja',
			importe: -saldo,
			origenTipo: 'baja',
			origenId: usuarioId,
			creadoEn: instante,
		},
	]);
	if (huchaTrasDevolver < 0) {
		tx.insert(avisoEconomia)
			.values({ id: nuevoId(), tipo: 'hucha_negativa', origenTipo: 'baja', origenId: usuarioId, registradoEn: instante })
			.run();
		registrarAviso(tx, {
			tipo: 'hucha_negativa',
			datos: { saldoHucha: saldoHucha(tx) },
			origenId: usuarioId,
			instante: esquemaInstanteUtc.parse(instante),
		});
		registrar('hucha.negativa_registrada', { origenTipo: 'baja', origenId: usuarioId });
	}
}
