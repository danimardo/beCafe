import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { buscarFrase } from '#lib/shared/mascota/frases';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearAzarFijo, crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { darDeAltaCapsula, registrarAportacion, registrarCompra } from '#lib/server/economia';
import { z } from 'zod';

const esquemaConsumoRegistrado = z.object({ consumo: z.object({ id: z.string(), fraseId: z.string().nullable().optional() }) });
const esquemaSaludo = z.object({ saludo: z.object({ fraseId: z.string().nullable() }) });
const esquemaRellenoRegistrado = z.object({ rellenoId: z.string() });

/** Extrae el identificador del relleno que devuelve la acción `rellenar`; otro resultado falla la prueba. */
function idDelRelleno(resultado: unknown): string {
	return esquemaRellenoRegistrado.parse(resultado).rellenoId;
}

/** Extrae el identificador del consumo que devuelve la acción `consumir`; otro resultado falla la prueba. */
function idDelConsumo(resultado: unknown): string {
	const datos = esquemaConsumoRegistrado.safeParse(resultado);
	if (!datos.success) throw new Error('La acción debía devolver el consumo registrado');
	return datos.data.consumo.id;
}

// Acciones de la pantalla principal con evento falso: el toque (`consumir`) y «Deshacer» (`deshacer`) (CA-010, CA-013,
// RF-013, RF-016). Los datos llegan como formulario, igual que los envía el navegador.
const INSTANTE = '2026-10-22T10:00:00.000Z';

describe('acciones de la pantalla principal', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		// Azar fijo: siempre la primera frase disponible del ciclo, así no hay dos iguales seguidas.
		entorno = crearEntornoPrueba(INSTANTE, crearAzarFijo(Array.from({ length: 20 }, () => 0)));
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

	async function tipoConCoste(cantidad = 100): Promise<string> {
		const admin = sesionDe('administrador', 'Admin');
		const miembro = sesionDe('miembro', 'Ana');
		registrarAportacion(entorno.ambiente, miembro, { clienteId: nuevoId(), importe: 5000 });
		const { id } = await darDeAltaCapsula(entorno.ambiente, admin, {
			nombre: 'Ristretto',
			marca: 'Marca de prueba',
			intensidad: 9,
			color: 'cap-ristretto',
			umbralMinimo: 0,
		});
		await registrarCompra(entorno.ambiente, admin, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: id, cantidad, importe: 3483 }],
			confirmoHuchaNegativa: true,
		});
		return id;
	}

	function consumir(actor: Actor | undefined, datos: Record<string, string>) {
		return actions.consumir(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)',
				params: {},
				cuerpo: new URLSearchParams(datos),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	function deshacer(actor: Actor | undefined, consumoId: string) {
		return actions.deshacer(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)',
				params: {},
				cuerpo: new URLSearchParams({ consumoId }),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('CA-010: consumir con un tipo con coste registra el consumo y devuelve su precio', async () => {
		const tipoCapsulaId = await tipoConCoste();
		const ana = sesionDe('miembro', 'Marta');

		const resultado = await consumir(ana, { tipoCapsulaId, clienteId: nuevoId(), invitado: '0' });

		expect(resultado).toMatchObject({ consumo: { tipoCapsulaId, precio: 35 } });
	});

	it('RF-016: el mismo clienteId por segunda vez devuelve el mismo consumo', async () => {
		const tipoCapsulaId = await tipoConCoste();
		const ana = sesionDe('miembro', 'Marta');
		const clienteId = nuevoId();

		const primera = await consumir(ana, { tipoCapsulaId, clienteId, invitado: '0' });
		const reenvio = await consumir(ana, { tipoCapsulaId, clienteId, invitado: '0' });

		expect(idDelConsumo(reenvio)).toBe(idDelConsumo(primera));
	});

	it('TIPO_SIN_COSTE: un tipo sin coste medio se rechaza con 409 y no revela el identificador del tipo', async () => {
		const admin = sesionDe('administrador', 'Admin');
		const { id: sinCoste } = await darDeAltaCapsula(entorno.ambiente, admin, {
			nombre: 'Sin coste',
			marca: 'Marca de prueba',
			intensidad: 3,
			color: 'cap-lungo',
			umbralMinimo: 0,
		});
		const ana = sesionDe('miembro', 'Marta');

		const { estado, datos } = desenvolverFallo(await consumir(ana, { tipoCapsulaId: sinCoste, clienteId: nuevoId(), invitado: '0' }));

		expect(estado).toBe(409);
		expect(datos).toHaveProperty('errores.general.codigo', 'TIPO_SIN_COSTE');
		expect(JSON.stringify(datos)).not.toContain(sinCoste);
	});

	it('CA-217: con stock 0 y la tarjeta «Sin stock», la acción devuelve 409 con lo necesario para el paso de confirmación', async () => {
		const tipoCapsulaId = await tipoConCoste(1);
		const ana = sesionDe('miembro', 'Marta');
		await consumir(ana, { tipoCapsulaId, clienteId: nuevoId(), invitado: '0' });
		const clienteId = nuevoId();

		const { estado, datos } = desenvolverFallo(await consumir(ana, { tipoCapsulaId, clienteId, invitado: '1', sinStock: '1' }));

		expect(estado).toBe(409);
		expect(datos).toEqual({ confirmarSinStock: { tipoCapsulaId, nombre: 'Ristretto', clienteId, invitado: '1' } });
	});

	it('CA-217: con «confirmarSinStock=si» el consumo se registra con stock −1', async () => {
		const tipoCapsulaId = await tipoConCoste(1);
		const ana = sesionDe('miembro', 'Marta');
		await consumir(ana, { tipoCapsulaId, clienteId: nuevoId(), invitado: '0' });

		const resultado = await consumir(ana, { tipoCapsulaId, clienteId: nuevoId(), invitado: '0', sinStock: '1', confirmarSinStock: 'si' });

		expect(esquemaConsumoRegistrado.safeParse(resultado).success).toBe(true);
		expect(resultado).toMatchObject({ consumo: { descuadre: true } });
	});

	function saludo(actor: Actor | undefined) {
		return actions.saludo(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)',
				params: {},
				cuerpo: new URLSearchParams({}),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('CA-213: con «mascota=si», un consumo propio y uno de invitado devuelven una frase de registro del anexo', async () => {
		const tipoCapsulaId = await tipoConCoste();
		const ana = sesionDe('miembro', 'Marta');

		const propio = esquemaConsumoRegistrado.parse(await consumir(ana, { tipoCapsulaId, clienteId: nuevoId(), invitado: '0', mascota: 'si' }));
		const invitado = esquemaConsumoRegistrado.parse(await consumir(ana, { tipoCapsulaId, clienteId: nuevoId(), invitado: '1', mascota: 'si' }));

		for (const { consumo } of [propio, invitado]) {
			expect(consumo.fraseId).toMatch(/^registro_\d{2}$/);
			expect(buscarFrase(consumo.fraseId ?? '')).toBeDefined();
		}
		expect(propio.consumo.fraseId).not.toBe(invitado.consumo.fraseId);
	});

	it('CA-213: sin «mascota=si» no se entrega ninguna frase ni se gasta una del ciclo', async () => {
		const tipoCapsulaId = await tipoConCoste();
		const ana = sesionDe('miembro', 'Marta');

		const resultado = esquemaConsumoRegistrado.parse(await consumir(ana, { tipoCapsulaId, clienteId: nuevoId(), invitado: '0' }));

		expect(resultado.consumo.fraseId ?? null).toBeNull();
	});

	it('CA-213: un reenvío del mismo consumo (duplicado) no entrega otra frase', async () => {
		const tipoCapsulaId = await tipoConCoste();
		const ana = sesionDe('miembro', 'Marta');
		const clienteId = nuevoId();

		await consumir(ana, { tipoCapsulaId, clienteId, invitado: '0', mascota: 'si' });
		const reenvio = esquemaConsumoRegistrado.parse(await consumir(ana, { tipoCapsulaId, clienteId, invitado: '0', mascota: 'si' }));

		expect(reenvio.consumo.fraseId ?? null).toBeNull();
	});

	it('CA-214: «?/saludo» entrega un saludo del anexo y una segunda llamada seguida devuelve null', async () => {
		const ana = sesionDe('miembro', 'Marta');

		const primero = esquemaSaludo.parse(await saludo(ana));
		const segundo = esquemaSaludo.parse(await saludo(ana));

		expect(primero.saludo.fraseId).toMatch(/^saludo_\d{2}$/);
		expect(segundo.saludo.fraseId).toBeNull();
	});

	it('CA-013: deshacer el propio consumo dentro del plazo devuelve la confirmación', async () => {
		const tipoCapsulaId = await tipoConCoste();
		const ana = sesionDe('miembro', 'Marta');
		const consumoId = idDelConsumo(await consumir(ana, { tipoCapsulaId, clienteId: nuevoId(), invitado: '0' }));

		await expect(deshacer(ana, consumoId)).resolves.toMatchObject({ deshecho: true });
	});

	it('Clarifications 5: deshacer a los 16 minutos devuelve FUERA_DE_PLAZO', async () => {
		const tipoCapsulaId = await tipoConCoste();
		const ana = sesionDe('miembro', 'Marta');
		const consumoId = idDelConsumo(await consumir(ana, { tipoCapsulaId, clienteId: nuevoId(), invitado: '0' }));
		entorno.reloj.avanzar(16 * 60_000);

		const { estado, datos } = desenvolverFallo(await deshacer(ana, consumoId));

		expect(estado).toBe(409);
		expect(datos).toHaveProperty('errores.general.codigo', 'FUERA_DE_PLAZO');
	});

	it('sin sesión, consumir devuelve SIN_SESION sin registrar nada', async () => {
		const tipoCapsulaId = await tipoConCoste();

		const { estado } = desenvolverFallo(await consumir(undefined, { tipoCapsulaId, clienteId: nuevoId(), invitado: '0' }));

		expect(estado).toBe(401);
	});

	function rellenar(actor: Actor | undefined, clienteId: string) {
		return actions.rellenar(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)',
				params: {},
				cuerpo: new URLSearchParams({ clienteId }),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('RF-170: rellenar registra el relleno y devuelve su identificador para «Deshacer»', async () => {
		const ana = sesionDe('miembro', 'Marta');

		const resultado = await rellenar(ana, nuevoId());

		expect(resultado).toMatchObject({ registrado: true });
		expect(idDelRelleno(resultado)).not.toBe('');
	});

	it('CA-172: un relleno dentro del intervalo devuelve 409 con el autor, su hora y si es propio', async () => {
		const marta = sesionDe('miembro', 'Marta');
		const luis = sesionDe('miembro', 'Luis');
		await rellenar(marta, nuevoId());
		entorno.reloj.avanzar(20 * 60_000);

		const { estado, datos } = desenvolverFallo(await rellenar(luis, nuevoId()));

		expect(estado).toBe(409);
		expect(datos).toMatchObject({ codigo: 'RELLENO_RECIENTE', autor: 'Marta', esPropio: false, hace: 'hace 20 min' });
	});

	it('RF-170: rellenar con el mismo clienteId no registra dos veces', async () => {
		const ana = sesionDe('miembro', 'Marta');
		const clienteId = nuevoId();

		const primera = await rellenar(ana, clienteId);
		const reenvio = await rellenar(ana, clienteId);

		expect(idDelRelleno(reenvio)).toBe(idDelRelleno(primera));
	});

	it('CA-171: deshacer el propio relleno dentro del plazo lo anula', async () => {
		const ana = sesionDe('miembro', 'Marta');
		const rellenoId = idDelRelleno(await rellenar(ana, nuevoId()));

		await expect(
			actions.deshacerRelleno(
				crearEventoAccion({
					locals: { ambiente: entorno.ambiente, actor: ana },
					ruta: '/(app)',
					params: {},
					cuerpo: new URLSearchParams({ rellenoId }),
					cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
				}),
			),
		).resolves.toMatchObject({ deshechoRelleno: true });
	});
});
