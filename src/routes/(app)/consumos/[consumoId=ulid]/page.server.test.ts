import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { darDeAltaCapsula, leerConsumo, registrarAportacion, registrarCompra, registrarConsumo } from '#lib/server/economia';

// Anulación de un consumo desde su detalle (CA-060, CA-061, CA-062, RF-060 a RF-062) con evento falso.
const INSTANTE = '2026-10-22T10:00:00.000Z';

describe('acción anular de /consumos/[consumoId]', () => {
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

	async function consumoDeMarta() {
		const marta = sesionDe('miembro', 'Marta');
		const admin = sesionDe('administrador', 'Admin');
		registrarAportacion(entorno.ambiente, marta, { clienteId: nuevoId(), importe: 5000 });
		const { id: tipoCapsulaId } = await darDeAltaCapsula(entorno.ambiente, admin, {
			nombre: 'Ristretto',
			marca: 'Marca de prueba',
			intensidad: 9,
			color: 'cap-ristretto',
			umbralMinimo: 0,
		});
		await registrarCompra(entorno.ambiente, admin, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId, cantidad: 10, importe: 3483 }],
			confirmoHuchaNegativa: true,
		});
		const { id } = registrarConsumo(entorno.ambiente, marta, {
			clienteId: nuevoId(),
			tipoCapsulaId,
			invitado: false,
			horaGesto: INSTANTE,
			via: 'directo',
		});
		return { marta, admin, id };
	}

	function anular(actor: Actor | undefined, consumoId: string, motivo: string) {
		return actions.anular(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/consumos/[consumoId=ulid]',
				params: { consumoId },
				cuerpo: new URLSearchParams({ motivo }),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('CA-060: el autor anula su consumo con motivo y el consumo queda anulado', async () => {
		const { marta, id } = await consumoDeMarta();
		entorno.reloj.avanzar(10 * 60_000);

		await expect(anular(marta, id, 'Tomado por error')).resolves.toMatchObject({ anulado: true });
		expect(leerConsumo(entorno.ambiente.db, marta, id)).toMatchObject({ estado: 'anulado', motivoAnulacion: 'Tomado por error' });
	});

	it('CA-061: un administrador anula el consumo de otra persona a los 3 días', async () => {
		const { admin, id } = await consumoDeMarta();
		entorno.reloj.avanzar(3 * 24 * 60 * 60_000);

		await expect(anular(admin, id, 'Registro duplicado')).resolves.toMatchObject({ anulado: true });
	});

	it('CA-062: el autor a los 20 minutos recibe FUERA_DE_PLAZO', async () => {
		const { marta, id } = await consumoDeMarta();
		entorno.reloj.avanzar(20 * 60_000);

		const { estado, datos } = desenvolverFallo(await anular(marta, id, 'Tardío'));

		expect(estado).toBe(409);
		expect(datos).toHaveProperty('errores.general.codigo', 'FUERA_DE_PLAZO');
		expect(leerConsumo(entorno.ambiente.db, marta, id)).toMatchObject({ estado: 'vigente' });
	});

	it('CA-062: otro miembro recibe SIN_PERMISO', async () => {
		const { id } = await consumoDeMarta();
		const luis = sesionDe('miembro', 'Luis');

		const { datos } = desenvolverFallo(await anular(luis, id, 'Mío'));

		expect(datos).toHaveProperty('errores.general.codigo', 'SIN_PERMISO');
	});

	it('un motivo vacío se rechaza con error de campo y el consumo sigue vigente', async () => {
		const { marta, id } = await consumoDeMarta();

		const { estado, datos } = desenvolverFallo(await anular(marta, id, ''));

		expect(estado).toBe(400);
		expect(datos).toHaveProperty('errores.motivo');
		expect(leerConsumo(entorno.ambiente.db, marta, id)).toMatchObject({ estado: 'vigente' });
	});
});
