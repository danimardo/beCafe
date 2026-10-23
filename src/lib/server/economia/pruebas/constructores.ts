import { crearUsuario } from '#lib/server/usuarios';
import { enTransaccion, nuevoId, type Ambiente, type Db } from '#lib/server/plataforma';
import { aportacion, consumo, movimiento } from '../esquema';
import { darDeAltaCapsula } from '../capsulas';
import { fijarStock, leerExistenciaTx } from '../existencias';

// Constructores de datos para las pruebas de `economia`. Usan la API pública de cada módulo (`usuarios`, y
// `darDeAltaCapsula` para los tipos) y escriben solo en tablas de `economia`.

const INSTANTE = '2026-10-21T09:00:00.000Z';
const ADMIN_PRUEBA = '01ADMIN0000000000000000000';

export function prepararMiembros(db: Db, cantidad: number): string[] {
	return Array.from({ length: cantidad }, (_, indice) => {
		const id = nuevoId();
		crearUsuario(db, {
			id,
			nombre: `Miembro ${indice + 1}`,
			correo: `miembro${indice + 1}-${id}@example.test`,
			rol: 'miembro',
			instante: INSTANTE,
		});
		return id;
	});
}

/** Un tipo activo sin stock ni compras: la existencia nace con stock 0 y sin coste (RN-006). */
export async function prepararTipo(ambiente: Ambiente): Promise<string> {
	const actor = { usuarioId: ADMIN_PRUEBA, rol: 'administrador' as const, autenticadoEn: INSTANTE, sesionIdHash: 'hash-prueba' };
	const { id } = await darDeAltaCapsula(ambiente, actor, {
		nombre: `Tipo ${nuevoId()}`,
		marca: 'Marca de prueba',
		intensidad: 5,
		color: 'cap-ristretto',
		umbralMinimo: 0,
	});
	return id;
}

export function prepararConsumo(
	db: Db,
	datos: { usuarioId: string; tipoCapsulaId: string; precioAplicado: number; costeMedioAplicado: number; horaRegistro: string },
): string {
	const id = nuevoId();
	db.insert(consumo)
		.values({
			id,
			clienteId: nuevoId(),
			usuarioId: datos.usuarioId,
			tipoCapsulaId: datos.tipoCapsulaId,
			invitado: false,
			precioAplicado: datos.precioAplicado,
			costeMedioAplicado: datos.costeMedioAplicado,
			horaGesto: datos.horaRegistro,
			horaRegistro: datos.horaRegistro,
		})
		.run();
	enTransaccion(db, (tx) => {
		const existencia0 = leerExistenciaTx(tx, datos.tipoCapsulaId);
		fijarStock(tx, datos.tipoCapsulaId, existencia0.stock - 1, datos.horaRegistro);
	});
	// Un consumo a precio 0 no genera movimiento: el libro no admite importes 0 (RN-010).
	if (datos.precioAplicado > 0) {
		db.insert(movimiento)
			.values({
				id: nuevoId(),
				cuenta: 'persona',
				usuarioId: datos.usuarioId,
				tipo: 'cargo_consumo',
				importe: -datos.precioAplicado,
				origenTipo: 'consumo',
				origenId: id,
				creadoEn: datos.horaRegistro,
			})
			.run();
	}
	return id;
}

export function prepararAportacion(db: Db, datos: { usuarioId: string; importe: number; instante: string }): string {
	const id = nuevoId();
	db.insert(aportacion)
		.values({
			id,
			clienteId: nuevoId(),
			usuarioId: datos.usuarioId,
			registradaPor: datos.usuarioId,
			importe: datos.importe,
			origen: 'directa',
			registradaEn: datos.instante,
		})
		.run();
	db.insert(movimiento)
		.values([
			{
				id: nuevoId(),
				cuenta: 'persona',
				usuarioId: datos.usuarioId,
				tipo: 'abono_aportacion',
				importe: datos.importe,
				origenTipo: 'aportacion',
				origenId: id,
				creadoEn: datos.instante,
			},
			{
				id: nuevoId(),
				cuenta: 'hucha',
				usuarioId: null,
				tipo: 'hucha_aportacion',
				importe: datos.importe,
				origenTipo: 'aportacion',
				origenId: id,
				creadoEn: datos.instante,
			},
		])
		.run();
	return id;
}
