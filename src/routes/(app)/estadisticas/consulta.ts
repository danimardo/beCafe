import { esquemaConsultaEstadisticas, type ConsultaEstadisticas } from '#lib/shared/contratos/estadisticas';

// Un campo vacío del formulario (p. ej. «anio» sin rellenar) equivale a no enviarlo. Sin esto, un mes o un año vacíos
// invalidarían toda la consulta y el periodo volvería al valor por defecto.
export function normalizarConsultaEstadisticas(parametros: URLSearchParams): {
	consulta: ConsultaEstadisticas;
	consultaValida: boolean;
} {
	const utiles = Object.fromEntries([...parametros].filter(([, valor]) => valor !== ''));
	const resultado = esquemaConsultaEstadisticas.safeParse(utiles);
	return {
		consulta: resultado.success ? resultado.data : esquemaConsultaEstadisticas.parse({}),
		consultaValida: resultado.success,
	};
}
