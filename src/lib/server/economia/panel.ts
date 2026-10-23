import { existencia } from './esquema';
import { estimarDias, type EstimacionDias } from './dominio/stock';
import { listarTipos, type FilaTipoCapsula } from '#lib/server/catalogo';
import { listarUsuarios } from '#lib/server/usuarios';
import { leerConfiguracion } from '#lib/server/configuracion';
import { saldoPersona } from './libro';
import { exigirAdministrador, exigirSesion, type Actor } from '#lib/server/auth';
import { RecursoNoEncontrado, type Db, type Ejecutor } from '#lib/server/plataforma';

// Lecturas de stock para las pantallas (RF-021, RF-022). Sin escrituras.

export type FilaEstado = {
	id: string;
	nombre: string;
	marca: string;
	intensidad: number | null;
	color: string;
	fotoRuta: string | null;
	estado: FilaTipoCapsula['estado'];
	stock: number;
	umbralMinimo: number;
	costeMedio: number | null;
	enStockBajo: boolean;
	estimacion: EstimacionDias;
};

/**
 * Estado de todos los tipos. Los consumos de los últimos 30 días llegan con F3: hasta entonces la estimación
 * usa 0 consumos, es decir, «sin datos» o 0 días si el stock no es positivo.
 */
function construirEstados(db: Ejecutor): FilaEstado[] {
	const existencias = new Map(
		db
			.select()
			.from(existencia)
			.all()
			.map((fila) => [fila.tipoCapsulaId, fila]),
	);
	const consumosUltimos30 = 0;
	return listarTipos(db).flatMap((tipo) => {
		const fila = existencias.get(tipo.id);
		if (!fila) return [];
		return [
			{
				id: tipo.id,
				nombre: tipo.nombre,
				marca: tipo.marca,
				intensidad: tipo.intensidad,
				color: tipo.color,
				fotoRuta: tipo.fotoRuta,
				estado: tipo.estado,
				stock: fila.stock,
				umbralMinimo: fila.umbralMinimo,
				costeMedio: fila.costeMedio,
				enStockBajo: fila.enStockBajo,
				estimacion: estimarDias(fila.stock, consumosUltimos30),
			},
		];
	});
}

/** Estado de los tipos para cualquier miembro: solo los activos se ofrecen para registrar (RF-004). */
export function leerEstadoTipos(db: Ejecutor, actor: Actor | undefined): FilaEstado[] {
	exigirSesion(actor);
	return construirEstados(db);
}

/** Avisos de stock bajo: solo tipos activos (Clarifications, punto 4). */
export function leerAvisosStock(db: Ejecutor, actor: Actor | undefined): FilaEstado[] {
	return leerEstadoTipos(db, actor).filter((fila) => fila.estado === 'activo' && fila.enStockBajo);
}

/** Catálogo completo para la administración, con los retirados (RF-004). */
export function leerCatalogoAdmin(db: Ejecutor, actor: Actor): FilaEstado[] {
	exigirAdministrador(actor, 'admin/capsulas');
	return construirEstados(db);
}

export function leerCapsulaAdmin(db: Ejecutor, actor: Actor, id: string): FilaEstado {
	exigirAdministrador(actor, 'admin/capsulas');
	const fila = construirEstados(db).find((candidata) => candidata.id === id);
	if (!fila) throw new RecursoNoEncontrado();
	return fila;
}

// Personas por debajo del límite de deuda (RF-021, CA-021). Lo ve cualquier miembro: el panel de avisos es común.
export type PersonaBajoLimite = { usuarioId: string; nombre: string; saldo: number };

export function leerPersonasBajoLimite(db: Db, actor: Actor | undefined): PersonaBajoLimite[] {
	exigirSesion(actor);
	const { limiteDeudaCentimos } = leerConfiguracion(db);
	return listarUsuarios(db)
		.filter((persona) => persona.estado === 'activo')
		.map((persona) => ({ usuarioId: persona.id, nombre: persona.nombre, saldo: saldoPersona(db, persona.id) }))
		.filter((persona) => persona.saldo < limiteDeudaCentimos)
		.sort((a, b) => a.saldo - b.saldo);
}
