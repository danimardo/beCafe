import { z } from 'zod';
import { formatMoney } from '#lib/shared/dinero';
import { esquemaUlid } from '#lib/shared/contratos/comunes';
import { textos } from '#lib/shared/textos';
import type { TipoDesactivable, TipoNotificacion } from './esquema';

// Catálogo de avisos (plan F6 D1, RF-101). Constante congelada: los tipos y sus destinatarios no cambian en ejecución.
// Los importes llegan en céntimos (constitución IV) y se formatean solo al construir el texto.

export type Destinatarios = 'todos' | 'persona' | 'administradores';

export type MensajeAviso = { titulo: string; texto: string; enlace: string };

const esquemaNombre = z.string().min(1).max(80);

export const ESQUEMAS_DATOS = Object.freeze({
	stock_bajo: z.strictObject({ tipoCapsulaId: esquemaUlid, nombreTipo: esquemaNombre, stock: z.int() }),
	stock_negativo: z.strictObject({ tipoCapsulaId: esquemaUlid, nombreTipo: esquemaNombre, stock: z.int() }),
	hucha_negativa: z.strictObject({ saldoHucha: z.int() }),
	deuda: z.strictObject({ saldo: z.int(), limite: z.int() }),
	resumen_mensual: z.strictObject({
		mes: z.string().regex(/^\d{4}-\d{2}$/),
		cafes: z.int().nonnegative(),
		invitados: z.int().nonnegative(),
		saldo: z.int(),
	}),
	fallo_copia: z.strictObject({ copiaId: esquemaUlid }),
} satisfies Record<TipoNotificacion, z.ZodType>);

export const CATALOGO: Readonly<Record<TipoNotificacion, { destinatarios: Destinatarios; desactivable: boolean }>> = Object.freeze({
	stock_bajo: { destinatarios: 'todos', desactivable: true },
	stock_negativo: { destinatarios: 'administradores', desactivable: true },
	hucha_negativa: { destinatarios: 'administradores', desactivable: true },
	deuda: { destinatarios: 'persona', desactivable: false },
	resumen_mensual: { destinatarios: 'persona', desactivable: true },
	fallo_copia: { destinatarios: 'administradores', desactivable: true },
});

/** Estrecha el tipo a los desactivables: `deuda` no lo es (RF-102). */
export function esDesactivable(tipo: TipoNotificacion): tipo is TipoDesactivable {
	return CATALOGO[tipo].desactivable;
}

/** Valida los datos de un tipo con su esquema. Lanza `ZodError` si no los cumplen; el mensaje de error no incluye el valor. */
export function validarDatos(tipo: TipoNotificacion, datos: unknown): unknown {
	return ESQUEMAS_DATOS[tipo].parse(datos);
}

/** Construye título, texto y enlace de un aviso. El texto se construye al mostrar o al enviar; no se guarda. */
export function construirMensaje(tipo: TipoNotificacion, datos: unknown): MensajeAviso {
	switch (tipo) {
		case 'stock_bajo': {
			const d = ESQUEMAS_DATOS.stock_bajo.parse(datos);
			return {
				titulo: textos.notificaciones.stockBajo.titulo(d.nombreTipo),
				texto: textos.notificaciones.stockBajo.texto(d.stock),
				enlace: '/',
			};
		}
		case 'stock_negativo': {
			const d = ESQUEMAS_DATOS.stock_negativo.parse(datos);
			return {
				titulo: textos.notificaciones.stockNegativo.titulo(d.nombreTipo),
				texto: textos.notificaciones.stockNegativo.texto(d.stock),
				enlace: `/admin/capsulas/${d.tipoCapsulaId}`,
			};
		}
		case 'hucha_negativa': {
			const d = ESQUEMAS_DATOS.hucha_negativa.parse(datos);
			return {
				titulo: textos.notificaciones.huchaNegativa.titulo,
				texto: textos.notificaciones.huchaNegativa.texto(formatMoney(d.saldoHucha)),
				enlace: '/admin/control',
			};
		}
		case 'deuda': {
			const d = ESQUEMAS_DATOS.deuda.parse(datos);
			return {
				titulo: textos.notificaciones.deuda.titulo,
				texto: textos.notificaciones.deuda.texto(formatMoney(d.saldo), formatMoney(d.limite)),
				enlace: '/saldos',
			};
		}
		case 'resumen_mensual': {
			const d = ESQUEMAS_DATOS.resumen_mensual.parse(datos);
			return {
				titulo: textos.notificaciones.resumenMensual.titulo(d.mes),
				texto: textos.notificaciones.resumenMensual.texto(d.cafes, d.invitados, formatMoney(d.saldo)),
				enlace: '/estadisticas',
			};
		}
		case 'fallo_copia': {
			ESQUEMAS_DATOS.fallo_copia.parse(datos);
			return {
				titulo: textos.notificaciones.falloCopia.titulo,
				texto: textos.notificaciones.falloCopia.texto,
				enlace: '/admin',
			};
		}
	}
}
