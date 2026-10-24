import { contarConsumos, saldoPersona } from '#lib/server/economia';
import { leerAguador } from '#lib/server/rellenos';
import { registrarAviso } from '#lib/server/notificaciones';
import { enTransaccion, marcarEjecucion, type Db, type Reloj } from '#lib/server/plataforma';
import { listarUsuarios } from '#lib/server/usuarios';
import { esquemaInstanteUtc, type Mes } from '#lib/shared/fechas/tipos';
import { limitesDeMes, mesDeInstante } from '#lib/shared/fechas/meses';

// Resumen mensual de cada miembro activo (plan F6 D8, RF-104, CA-104). Se envía el día 1 a las 09:00 de Madrid
// y resume el mes natural anterior. El periodo es ese mes: una ejecución por mes, aunque el servidor se haya parado.

export const TAREA_RESUMEN_MENSUAL = 'resumen_mensual';

/** Mes natural anterior al instante del disparo. El disparo cae el día 1 a las 09:00 de Madrid. */
export function mesAnteriorDe(instante: Date): Mes {
	const inicioDelMes = limitesDeMes(mesDeInstante(esquemaInstanteUtc.parse(instante.toISOString()))).desde;
	return mesDeInstante(esquemaInstanteUtc.parse(new Date(Date.parse(inicioDelMes) - 1).toISOString()));
}

/** Registra el resumen de `periodo` para cada miembro activo. Devuelve cuántos avisos registró. */
export function enviarResumenMensual({ db, reloj, periodo }: { db: Db; reloj: Reloj; periodo: Mes }): number {
	const instante = reloj.ahora();
	const { desde, hasta } = limitesDeMes(periodo);
	return enTransaccion(db, (tx) => {
		if (!marcarEjecucion(tx, TAREA_RESUMEN_MENSUAL, periodo, instante)) return 0;
		let registrados = 0;
		// El aguador lo fija una tarea anterior del mismo día 1 (plan F8 D5): el resumen lo incluye si ya existe.
		const aguadores = leerAguador(tx, periodo).map((fila) => fila.nombre);
		for (const persona of listarUsuarios(tx)) {
			if (persona.estado !== 'activo') continue;
			const consumos = contarConsumos(tx, { desde, hasta, usuarioId: persona.id });
			registrarAviso(tx, {
				tipo: 'resumen_mensual',
				destinatario: persona.id,
				datos: {
					mes: periodo,
					cafes: consumos.filter((consumo) => !consumo.invitado).length,
					invitados: consumos.filter((consumo) => consumo.invitado).length,
					saldo: saldoPersona(tx, persona.id),
					...(aguadores.length > 0 ? { aguadores } : {}),
				},
				instante,
			});
			registrados += 1;
		}
		return registrados;
	});
}
