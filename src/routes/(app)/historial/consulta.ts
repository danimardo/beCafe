import { esquemaConsultaHistorial, type ConsultaHistorial } from '#lib/shared/contratos/estadisticas';
import type { FiltrosGenerales } from '#lib/server/estadisticas';

// Normaliza los parámetros de `/historial` (plan F5 D6; contracts/rutas.md). Una consulta inválida no es un error:
// se usan los valores por defecto y la página lo avisa (T013).

export type ConsultaNormalizada = { filtros: FiltrosGenerales; consultaValida: boolean; consulta: ConsultaHistorial };

export function normalizarConsulta(parametros: Record<string, string>): ConsultaNormalizada {
	const resultado = esquemaConsultaHistorial.safeParse(parametros);
	const consulta = resultado.success ? resultado.data : esquemaConsultaHistorial.parse({});
	return {
		consulta,
		consultaValida: resultado.success,
		filtros: {
			quien: consulta.quien,
			tipo: consulta.tipo,
			anulados: consulta.anulados === 'on',
			pagina: consulta.pagina,
		},
	};
}
