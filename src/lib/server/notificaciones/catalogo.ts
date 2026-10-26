import { z } from 'zod';
import { formatMoney, formatMoneyPlain } from '#lib/shared/dinero';
import { esquemaUlid } from '#lib/shared/contratos/comunes';
import { esquemaFechaMadrid } from '#lib/shared/fechas/tipos';
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
		/** Nombres de los aguadores del mes (plan F8 D5). Se guardan al enviar el resumen; sin ellos no hay franja. */
		aguadores: z.array(z.string().max(200)).max(50).optional(),
	}),
	fallo_copia: z.strictObject({ copiaId: esquemaUlid }),
	/** Sin el nombre del visitante: la pantalla de revisión lo lee al mostrarse (plan F10, data-model). */
	cafe_visitante_pendiente: z.strictObject({ cafeId: esquemaUlid, pendientes: z.int().positive() }),
	aportacion_en_tu_nombre: z.strictObject({ aportacionId: esquemaUlid, importe: z.int().positive() }),
	/** Sin nombres de personas (constitución XVI): solo tipos, cantidades e importes del reparto (plan F12, data-model). */
	recuento: z.strictObject({
		recuentoId: esquemaUlid,
		accion: z.enum(['registrado', 'anulado']),
		fecha: esquemaFechaMadrid,
		lineas: z
			.array(z.strictObject({ nombreTipo: esquemaNombre, diferencia: z.int().refine((n) => n !== 0) }))
			.min(1)
			.max(50),
		importe: z.int().nonnegative(),
		personas: z.int().nonnegative(),
		minimo: z.int().nonnegative(),
		maximo: z.int().nonnegative(),
	}),
} satisfies Record<TipoNotificacion, z.ZodType>);

export const CATALOGO: Readonly<Record<TipoNotificacion, { destinatarios: Destinatarios; desactivable: boolean }>> = Object.freeze({
	stock_bajo: { destinatarios: 'todos', desactivable: true },
	stock_negativo: { destinatarios: 'administradores', desactivable: true },
	hucha_negativa: { destinatarios: 'administradores', desactivable: true },
	deuda: { destinatarios: 'persona', desactivable: false },
	resumen_mensual: { destinatarios: 'persona', desactivable: true },
	fallo_copia: { destinatarios: 'administradores', desactivable: true },
	cafe_visitante_pendiente: { destinatarios: 'administradores', desactivable: true },
	aportacion_en_tu_nombre: { destinatarios: 'persona', desactivable: true },
	recuento: { destinatarios: 'todos', desactivable: true },
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
				texto: [
					textos.notificaciones.resumenMensual.texto(d.cafes, d.invitados, formatMoney(d.saldo)),
					d.aguadores?.length ? textos.notificaciones.resumenMensual.aguador(d.aguadores.join(' y ')) : undefined,
				]
					.filter(Boolean)
					.join(' '),
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
		case 'cafe_visitante_pendiente': {
			const d = ESQUEMAS_DATOS.cafe_visitante_pendiente.parse(datos);
			return {
				titulo: textos.notificaciones.cafeVisitantePendiente.titulo,
				texto: textos.notificaciones.cafeVisitantePendiente.texto(d.pendientes),
				enlace: '/admin/visitantes',
			};
		}
		case 'aportacion_en_tu_nombre': {
			const d = ESQUEMAS_DATOS.aportacion_en_tu_nombre.parse(datos);
			return {
				titulo: textos.notificaciones.aportacionEnTuNombre.titulo,
				texto: textos.notificaciones.aportacionEnTuNombre.texto(formatMoney(d.importe)),
				enlace: '/saldos',
			};
		}
		case 'recuento': {
			const d = ESQUEMAS_DATOS.recuento.parse(datos);
			return { titulo: textos.notificaciones.recuento.titulo(diaYMes(d.fecha)), texto: textoRecuento(d), enlace: '/saldos' };
		}
	}
}

/** `2026-10-26` → `26/10`. */
function diaYMes(fecha: string): string {
	const [, mes, dia] = fecha.split('-');
	return `${dia}/${mes}`;
}

function textoRecuento(d: z.infer<typeof ESQUEMAS_DATOS.recuento>): string {
	const t = textos.notificaciones.recuento;
	const cantidades = (lineas: typeof d.lineas) => lineas.map((linea) => `${Math.abs(linea.diferencia)} ${linea.nombreTipo}`).join(', ');
	if (d.accion === 'anulado') return t.anulado(d.lineas.map((linea) => linea.nombreTipo).join(', '), diaYMes(d.fecha));
	const faltan = d.lineas.filter((linea) => linea.diferencia < 0);
	const sobran = d.lineas.filter((linea) => linea.diferencia > 0);
	const hayCargos = d.importe > 0 && d.personas > 0;
	const reparto = hayCargos
		? d.minimo === d.maximo
			? t.reparto(formatMoney(d.importe), d.personas, formatMoney(d.minimo))
			: t.repartoVariable(formatMoney(d.importe), d.personas, formatMoneyPlain(d.minimo), formatMoney(d.maximo))
		: t.sinCargos;
	const partes: string[] = [];
	if (faltan.length > 0) partes.push(`${t.faltaban(cantidades(faltan))}; ${reparto}`);
	// «sin cargos» solo se dice una vez: si ya se dijo en los faltantes, o si hay cargos de otro tipo, no se repite.
	if (sobran.length > 0)
		partes.push(faltan.length > 0 ? t.sobraban(cantidades(sobran)) : `${t.sobraban(cantidades(sobran))}; ${t.sinCargos}`);
	return partes.join('. ');
}
