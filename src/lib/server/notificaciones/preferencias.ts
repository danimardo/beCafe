import { and, eq } from 'drizzle-orm';
import { enTransaccion, ErrorDeNegocio, type Ambiente, type Ejecutor } from '#lib/server/plataforma';
import { esDesactivable } from './catalogo';
import { preferenciaNotificacion, TIPOS_NOTIFICACION, type TipoNotificacion } from './esquema';

// Preferencias de avisos de una persona (plan F6 D2, RF-102, CA-102). Sin fila, el tipo está activado (Clarifications 5).
// La persona llega como parámetro: este módulo no importa `auth` (ARCHITECTURE.md §4).

/** Tipos que solo ve y cambia un administrador. */
const TIPOS_ADMINISTRACION: readonly TipoNotificacion[] = ['stock_negativo', 'hucha_negativa', 'fallo_copia'];

export type PersonaPreferencias = { usuarioId: string; rol: 'miembro' | 'administrador' };

export type PreferenciaVisible = {
	tipo: TipoNotificacion;
	activada: boolean;
	/** `false` para `deuda`: se muestra siempre activada y no se puede cambiar (RF-102). */
	editable: boolean;
	/** `true` si el tipo es de administración: solo se muestra a administradores. */
	administracion: boolean;
};

/** Tipos que la persona puede ver, con su estado. Un miembro no ve los avisos de administración. */
export function leerPreferencias(db: Ejecutor, persona: PersonaPreferencias): PreferenciaVisible[] {
	const filas = db
		.select({ tipo: preferenciaNotificacion.tipo, activada: preferenciaNotificacion.activada })
		.from(preferenciaNotificacion)
		.where(eq(preferenciaNotificacion.usuarioId, persona.usuarioId))
		.all();
	const activadaPorTipo = new Map(filas.map((fila) => [fila.tipo, fila.activada]));
	return TIPOS_NOTIFICACION.filter((tipo) => persona.rol === 'administrador' || !TIPOS_ADMINISTRACION.includes(tipo)).map((tipo) => {
		const editable = esDesactivable(tipo);
		return {
			tipo,
			activada: editable ? (activadaPorTipo.get(tipo) ?? true) : true,
			editable,
			administracion: TIPOS_ADMINISTRACION.includes(tipo),
		};
	});
}

/** Cambia si un tipo llega a la persona. `deuda` no se desactiva; un miembro no cambia avisos de administración. */
export function cambiarPreferencia(
	ambiente: Ambiente,
	persona: PersonaPreferencias,
	entrada: { tipo: TipoNotificacion; activada: boolean },
): void {
	const tipo = entrada.tipo;
	if (!esDesactivable(tipo)) throw new ErrorDeNegocio('VALIDACION');
	if (TIPOS_ADMINISTRACION.includes(tipo) && persona.rol !== 'administrador') throw new ErrorDeNegocio('SIN_PERMISO');
	enTransaccion(ambiente.db, (tx) => {
		const clave = and(eq(preferenciaNotificacion.usuarioId, persona.usuarioId), eq(preferenciaNotificacion.tipo, tipo));
		const existente = tx.select({ tipo: preferenciaNotificacion.tipo }).from(preferenciaNotificacion).where(clave).get();
		if (existente) {
			tx.update(preferenciaNotificacion).set({ activada: entrada.activada }).where(clave).run();
		} else {
			tx.insert(preferenciaNotificacion).values({ usuarioId: persona.usuarioId, tipo, activada: entrada.activada }).run();
		}
	});
}
