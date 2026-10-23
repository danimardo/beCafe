import { and, eq, sql, type SQL } from 'drizzle-orm';
import { exigirSesion, type Actor } from '#lib/server/auth';
import { RecursoNoEncontrado, type Ejecutor } from '#lib/server/plataforma';
import { usuario } from '#lib/server/usuarios';
import { arqueo, lineaRecuento, movimiento, recuento, reparto } from './esquema';

// Historial económico (plan F5 D2; RF-043, RF-045). Una consulta `UNION ALL` reúne los orígenes de movimientos con
// columnas comunes. Sin efectos: solo lee. Los registros anulados se ocultan salvo que se pidan (RN-062).

export const TAMANO_PAGINA = 20;

export type TipoEntradaHistorial = 'aportacion' | 'compra' | 'arqueo' | 'recuento' | 'reparto' | 'regularizacion' | 'consumo';

export type FiltrosHistorial = {
	quien: 'todo' | 'mios';
	tipo: 'todos' | 'consumos' | 'aportaciones' | 'compras' | 'control';
	anulados: boolean;
	pagina: number;
};

export type FilaHistorial = {
	tipo: TipoEntradaHistorial;
	id: string;
	fecha: string;
	autorId: string | null;
	autorNombre: string | null;
	personaId: string | null;
	importe: number;
	anulado: boolean;
	anuladoEn: string | null;
	motivo: string | null;
};

export type PaginaHistorial = { filas: FilaHistorial[]; total: number; pagina: number };

type FilaSql = {
	tipo: TipoEntradaHistorial;
	id: string;
	fecha: string;
	autor_id: string | null;
	autor_nombre: string | null;
	persona_id: string | null;
	importe: number;
	estado: 'vigente' | 'anulado';
	anulado_en: string | null;
	motivo: string | null;
};

// Cada origen aporta las mismas columnas. `importe` es el valor que muestra el historial (plan F5, data-model.md).
// Un reparto no tiene persona propia: su estado sale de si quedan movimientos vigentes de su reparto.
const ORIGENES = sql`
WITH h AS (
	SELECT 'aportacion' AS tipo, a.id AS id, a.registrada_en AS fecha, a.registrada_por AS autor_id, a.usuario_id AS persona_id,
		a.importe AS importe, a.estado AS estado, a.anulado_en AS anulado_en, a.motivo_anulacion AS motivo
	FROM aportacion a
	UNION ALL
	SELECT 'compra', c.id, c.registrada_en, c.usuario_id, NULL, -c.importe_total, c.estado, c.anulado_en, c.motivo_anulacion
	FROM compra c
	UNION ALL
	SELECT 'arqueo', q.id, q.realizado_en, q.admin_id, NULL, q.diferencia, q.estado, q.anulado_en, q.motivo_anulacion
	FROM arqueo q
	UNION ALL
	SELECT 'recuento', l.id, r.realizado_en, r.admin_id, NULL, CASE WHEN l.diferencia < 0 THEN l.diferencia ELSE 0 END, l.estado, l.anulado_en, l.motivo_anulacion
	FROM linea_recuento l JOIN recuento r ON r.id = l.recuento_id
	UNION ALL
	SELECT 'reparto', p.id, p.creado_en, NULL, NULL, p.importe,
		CASE WHEN EXISTS (SELECT 1 FROM movimiento m WHERE m.origen_tipo = 'reparto' AND m.origen_id = p.id AND m.vigente = 1) THEN 'vigente' ELSE 'anulado' END,
		NULL, NULL
	FROM reparto p
	UNION ALL
	SELECT 'regularizacion', g.id, g.creada_en, NULL, g.usuario_id, g.importe, 'vigente', NULL, NULL
	FROM regularizacion g
	UNION ALL
	SELECT 'consumo', k.id, k.hora_gesto, k.usuario_id, k.usuario_id, -k.precio_aplicado, k.estado, k.anulado_en, k.motivo_anulacion
	FROM consumo k
)`;

function filtroTipo(tipo: FiltrosHistorial['tipo']): SQL {
	switch (tipo) {
		case 'consumos':
			return sql`h.tipo = 'consumo'`;
		case 'aportaciones':
			return sql`h.tipo = 'aportacion'`;
		case 'compras':
			return sql`h.tipo = 'compra'`;
		case 'control':
			return sql`h.tipo IN ('arqueo', 'recuento')`;
		case 'todos':
			return sql`1 = 1`;
	}
}

/**
 * Historial de la página pedida. «Todo»: los consumos solo los ven los administradores y el propio miembro (Clarifications 3).
 * «Míos»: los registros que tienen un movimiento vigente o anulado de la persona consultada.
 * `tipo = consumos` con «Todo» para un miembro equivale a `todos` (la visibilidad ya acota los consumos a los propios).
 */
export function leerHistorial(db: Ejecutor, actor: Actor, filtros: FiltrosHistorial): PaginaHistorial {
	const esAdmin = actor.rol === 'administrador';
	const tipo = filtros.quien === 'todo' && !esAdmin && filtros.tipo === 'consumos' ? 'todos' : filtros.tipo;
	const condiciones = sql.join(
		[
			filtros.anulados ? sql`1 = 1` : sql`h.estado = 'vigente'`,
			filtroTipo(tipo),
			esAdmin || filtros.quien === 'mios' ? sql`1 = 1` : sql`(h.tipo <> 'consumo' OR h.persona_id = ${actor.usuarioId})`,
			filtros.quien === 'mios'
				? sql`EXISTS (SELECT 1 FROM movimiento m WHERE m.cuenta = 'persona' AND m.usuario_id = ${actor.usuarioId} AND m.origen_id = h.id)`
				: sql`1 = 1`,
		],
		sql` AND `,
	);
	const total = db.all<{ n: number }>(sql`${ORIGENES} SELECT COUNT(*) AS n FROM h WHERE ${condiciones}`)[0]?.n ?? 0;
	const filas = db.all<FilaSql>(sql`
		${ORIGENES}
		SELECT h.tipo, h.id, h.fecha, h.autor_id, au.nombre AS autor_nombre, h.persona_id, h.importe, h.estado, h.anulado_en, h.motivo
		FROM h LEFT JOIN usuario au ON au.id = h.autor_id
		WHERE ${condiciones}
		ORDER BY h.fecha DESC, h.id DESC
		LIMIT ${TAMANO_PAGINA} OFFSET ${(filtros.pagina - 1) * TAMANO_PAGINA}
	`);
	return {
		total,
		pagina: filtros.pagina,
		filas: filas.map((fila) => ({
			tipo: fila.tipo,
			id: fila.id,
			fecha: fila.fecha,
			autorId: fila.autor_id,
			autorNombre: fila.autor_nombre,
			personaId: fila.persona_id,
			importe: fila.importe,
			anulado: fila.estado === 'anulado',
			anuladoEn: fila.anulado_en,
			motivo: fila.motivo,
		})),
	};
}

export type RepartoDePersona = { usuarioId: string; nombre: string; importe: number };

export type RegistroDeControl = {
	tipo: 'arqueo' | 'recuento';
	id: string;
	fecha: string;
	autorNombre: string | null;
	diferencia: number;
	anulado: boolean;
	anuladoEn: string | null;
	motivo: string | null;
	repartos: RepartoDePersona[];
};

/**
 * Detalle de solo lectura de un arqueo o de una línea de recuento: su reparto por persona y su anulación (plan F5 D7).
 * Un id que no es ni arqueo ni línea de recuento es «no encontrado».
 */
export function leerRegistroDeControl(db: Ejecutor, actor: Actor | undefined, id: string): RegistroDeControl {
	exigirSesion(actor);
	const cabecera = db
		.select({
			id: arqueo.id,
			fecha: arqueo.realizadoEn,
			autorNombre: usuario.nombre,
			diferencia: arqueo.diferencia,
			estado: arqueo.estado,
			anuladoEn: arqueo.anuladoEn,
			motivo: arqueo.motivoAnulacion,
		})
		.from(arqueo)
		.leftJoin(usuario, eq(usuario.id, arqueo.adminId))
		.where(eq(arqueo.id, id))
		.get();
	const linea = db
		.select({
			id: lineaRecuento.id,
			fecha: recuento.realizadoEn,
			autorNombre: usuario.nombre,
			diferencia: lineaRecuento.diferencia,
			estado: lineaRecuento.estado,
			anuladoEn: lineaRecuento.anuladoEn,
			motivo: lineaRecuento.motivoAnulacion,
		})
		.from(lineaRecuento)
		.innerJoin(recuento, eq(recuento.id, lineaRecuento.recuentoId))
		.leftJoin(usuario, eq(usuario.id, recuento.adminId))
		.where(eq(lineaRecuento.id, id))
		.get();
	const fila = cabecera ? { ...cabecera, tipo: 'arqueo' as const } : linea ? { ...linea, tipo: 'recuento' as const } : undefined;
	if (!fila) throw new RecursoNoEncontrado();
	const repartos = db
		.select({ usuarioId: movimiento.usuarioId, nombre: usuario.nombre, importe: movimiento.importe })
		.from(movimiento)
		.innerJoin(reparto, and(eq(reparto.id, movimiento.origenId), eq(movimiento.origenTipo, 'reparto')))
		.innerJoin(usuario, eq(usuario.id, movimiento.usuarioId))
		.where(eq(reparto.origenId, id))
		.all();
	return {
		tipo: fila.tipo,
		id: fila.id,
		fecha: fila.fecha,
		autorNombre: fila.autorNombre,
		diferencia: fila.diferencia,
		anulado: fila.estado === 'anulado',
		anuladoEn: fila.anuladoEn,
		motivo: fila.motivo,
		repartos: repartos.flatMap((r) => (r.usuarioId === null ? [] : [{ usuarioId: r.usuarioId, nombre: r.nombre, importe: r.importe }])),
	};
}
