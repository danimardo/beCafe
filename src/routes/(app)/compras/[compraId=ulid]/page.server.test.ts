import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { darDeAltaCapsula, leerCompra, registrarAportacion, registrarCompra } from '#lib/server/economia';

// Anulación de una compra desde su detalle (CA-043, RF-046) con evento falso.
const INSTANTE = '2026-10-21T09:00:00.000Z';

describe('acción anular de /compras/[compraId]', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function sesionDe(rol: 'miembro' | 'administrador', nombre: string): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre, correo: `${nombre.toLowerCase()}-${usuarioId}@ejemplo.es`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	async function compraDeMarta() {
		const marta = sesionDe('miembro', 'Marta');
		const admin = sesionDe('administrador', 'Admin');
		registrarAportacion(entorno.ambiente, marta, { clienteId: nuevoId(), importe: 5000 });
		const { id: tipoCapsulaId } = await darDeAltaCapsula(entorno.ambiente, admin, {
			nombre: 'Tipo de prueba',
			marca: 'Marca de prueba',
			intensidad: 5,
			color: 'cap-ristretto',
			umbralMinimo: 0,
		});
		const { id } = await registrarCompra(entorno.ambiente, marta, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId, cantidad: 2, importe: 2400 }],
			confirmoHuchaNegativa: false,
		});
		return { marta, id };
	}

	function anular(actor: Actor | undefined, compraId: string, motivo: string) {
		return actions.anular(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/compras/[compraId=ulid]',
				params: { compraId },
				cuerpo: new URLSearchParams({ motivo }),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('CA-043: anular una compra vigente la deja anulada y devuelve su confirmación', async () => {
		const { marta, id } = await compraDeMarta();

		await expect(anular(marta, id, 'Ticket duplicado')).resolves.toMatchObject({ anulada: true, resumen: [] });
		expect(leerCompra(entorno.ambiente.db, marta, id)).toMatchObject({ estado: 'anulado' });
	});

	it('un motivo vacío se rechaza con error de campo y la compra sigue vigente', async () => {
		const { marta, id } = await compraDeMarta();

		const { estado, datos } = desenvolverFallo(await anular(marta, id, ''));

		expect(estado).toBe(400);
		expect(datos).toHaveProperty('errores.motivo');
		expect(leerCompra(entorno.ambiente.db, marta, id)).toMatchObject({ estado: 'vigente' });
	});
});
