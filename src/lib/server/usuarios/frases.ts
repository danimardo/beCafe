import { and, desc, eq, lt, max } from 'drizzle-orm';
import { fraseEntregada } from './esquema';
import { siguienteFrase } from './dominio/ciclo-frases';
import { enTransaccion, registrar, type Ambiente, type Ejecutor } from '#lib/server/plataforma';
import { idsDeLista, type ListaFrases } from '#lib/shared/mascota/frases';

// Frases de Capsulito por persona (F11, RF-213 a RF-215, RN-088, RN-089). El servidor elige y anota en la misma
// transacción: dos dispositivos de la misma persona nunca reciben la misma frase del ciclo (EV-108).

/** Intervalo mínimo entre dos saludos de la misma persona (RN-089). */
export const INTERVALO_SALUDO_MS = 2 * 60 * 60 * 1000;

function ultimoSaludo(db: Ejecutor, usuarioId: string): string | null {
	const fila = db
		.select({ entregadaEn: fraseEntregada.entregadaEn })
		.from(fraseEntregada)
		.where(and(eq(fraseEntregada.usuarioId, usuarioId), eq(fraseEntregada.lista, 'saludo')))
		.orderBy(desc(fraseEntregada.entregadaEn))
		.limit(1)
		.get();
	return fila?.entregadaEn ?? null;
}

function saludoPermitido(ultimo: string | null, ahora: string): boolean {
	return ultimo === null || Date.parse(ahora) - Date.parse(ultimo) >= INTERVALO_SALUDO_MS;
}

/** Elige, anota y devuelve la siguiente frase de la lista. Borra los ciclos anteriores al previo para acotar la tabla. */
function entregarEnTx(ambiente: Ambiente, tx: Ejecutor, usuarioId: string, lista: ListaFrases): { fraseId: string } {
	const delUsuario = and(eq(fraseEntregada.usuarioId, usuarioId), eq(fraseEntregada.lista, lista));
	const cicloActual =
		tx
			.select({ ciclo: max(fraseEntregada.ciclo) })
			.from(fraseEntregada)
			.where(delUsuario)
			.get()?.ciclo ?? 1;
	const entregadas = new Set(
		tx
			.select({ fraseId: fraseEntregada.fraseId })
			.from(fraseEntregada)
			.where(and(delUsuario, eq(fraseEntregada.ciclo, cicloActual)))
			.all()
			.map((fila) => fila.fraseId),
	);
	const { fraseId, ciclo } = siguienteFrase(idsDeLista(lista), entregadas, cicloActual, ambiente.azar);
	tx.insert(fraseEntregada).values({ usuarioId, lista, ciclo, fraseId, entregadaEn: ambiente.reloj.ahora() }).run();
	if (ciclo !== cicloActual) {
		tx.delete(fraseEntregada)
			.where(and(delUsuario, lt(fraseEntregada.ciclo, ciclo - 1)))
			.run();
		registrar('frase.ciclo_reiniciado', { usuarioId, lista, ciclo });
	}
	registrar('frase.entregada', { usuarioId, lista, fraseId, ciclo });
	return { fraseId };
}

/** Frase de registro tras un café confirmado (RF-213). */
export function entregarFrase(ambiente: Ambiente, usuarioId: string, lista: ListaFrases): { fraseId: string } {
	return enTransaccion(ambiente.db, (tx) => entregarEnTx(ambiente, tx, usuarioId, lista));
}

/** Si la persona puede recibir un saludo al abrir Inicio (RN-089). Solo lee. */
export function leerSaludoDisponible(db: Ejecutor, usuarioId: string, ahora: string): boolean {
	return saludoPermitido(ultimoSaludo(db, usuarioId), ahora);
}

/** Saludo al abrir Inicio (RF-214). `null` si no han pasado 2 horas: dos pestañas no reciben dos saludos. */
export function entregarSaludo(ambiente: Ambiente, usuarioId: string): { fraseId: string } | null {
	return enTransaccion(ambiente.db, (tx) =>
		saludoPermitido(ultimoSaludo(tx, usuarioId), ambiente.reloj.ahora()) ? entregarEnTx(ambiente, tx, usuarioId, 'saludo') : null,
	);
}
