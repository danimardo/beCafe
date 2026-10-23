import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { crearEntornoPrueba, enTransaccion, nuevoId, usarRegistro, type Db, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { crearRegistroFalso } from '../plataforma/pruebas/registro-falso';
import { borrarAvisosAntiguos, entregarPendientes } from './entregar';
import { entregaPush, notificacion, suscripcionPush } from './esquema';
import { registrarAviso } from './registrar';
import { crearEnvioFalso, type EnvioFalso } from './pruebas/envio-falso';

// CA-105 y RNF-008 (plan D6, D9; Clarifications 9): reintentos, caducidad y registro sin datos de suscripción.
const INICIO = '2026-10-23T09:00:00.000Z';
const MINUTO = 60_000;
const STOCK = { tipoCapsulaId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', nombreTipo: 'Lungo', stock: 2 };

describe('entrega de avisos por push (CA-105, RNF-008)', () => {
	let entorno: EntornoPrueba;
	let db: Db;
	let registro: ReturnType<typeof crearRegistroFalso>;
	let ana: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INICIO);
		db = entorno.ambiente.db;
		registro = crearRegistroFalso();
		usarRegistro(registro);
		ana = nuevoId();
		crearUsuario(db, { id: ana, nombre: 'Ana', correo: `ana-${ana}@ejemplo.test`, rol: 'miembro', instante: INICIO });
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function dispositivo(): string {
		const id = nuevoId();
		db.insert(suscripcionPush)
			.values({
				id,
				usuarioId: ana,
				endpoint: `https://push.ejemplo.test/${id}`,
				clavePdh: 'p256',
				claveAuth: 'auth',
				creadaEn: INICIO,
				actualizadaEn: INICIO,
			})
			.run();
		return id;
	}

	function avisar(datos: unknown = STOCK): void {
		enTransaccion(db, (tx) => registrarAviso(tx, { tipo: 'stock_bajo', datos, instante: entorno.reloj.ahora() }));
	}

	async function entregar(envio: EnvioFalso): Promise<void> {
		await entregarPendientes({ db, reloj: entorno.reloj, enviar: envio.enviar });
	}

	function entregas() {
		return db.select().from(entregaPush).all();
	}

	it('un 201 marca la entrega como enviada y registra push.enviado', async () => {
		dispositivo();
		avisar();
		const envio = crearEnvioFalso([201]);

		await entregar(envio);

		expect(entregas()[0]?.estado).toBe('enviada');
		expect(envio.envios).toHaveLength(1);
		expect(envio.envios[0]?.mensaje).toContain('"version":1');
		expect(registro.eventos.some((evento) => evento.codigo === 'push.enviado')).toBe(true);
	});

	it('CA-105: un 500 deja la entrega pendiente con un intento y espera de un minuto', async () => {
		dispositivo();
		avisar();

		await entregar(crearEnvioFalso([500]));

		expect(entregas()[0]).toMatchObject({
			estado: 'pendiente',
			intentos: 1,
			ultimoCodigo: 500,
			proximoIntento: '2026-10-23T09:01:00.000Z',
		});
	});

	it('CA-105: no reintenta antes de la espera y lo hace cuando llega', async () => {
		dispositivo();
		avisar();
		const envio = crearEnvioFalso([500, 201]);
		await entregar(envio);

		entorno.reloj.avanzar(30_000);
		await entregar(envio);
		expect(envio.envios).toHaveLength(1);

		entorno.reloj.avanzar(30_000);
		await entregar(envio);
		expect(envio.envios).toHaveLength(2);
		expect(entregas()[0]?.estado).toBe('enviada');
	});

	it('CA-105: tras el quinto fallo la entrega queda agotada y se registra', async () => {
		dispositivo();
		avisar();
		const envio = crearEnvioFalso([500, 500, 500, 500, 500]);
		for (let intento = 0; intento < 5; intento += 1) {
			await entregar(envio);
			entorno.reloj.avanzar(120 * MINUTO); // cubre cualquier espera (≤ 120 min) sin pasar de 24 h
		}

		expect(entregas()[0]).toMatchObject({ estado: 'agotada', intentos: 5 });
		expect(envio.envios).toHaveLength(5);
		expect(registro.eventos.some((evento) => evento.codigo === 'push.reintentos_agotados')).toBe(true);
	});

	it('CA-105: 410 y 404 borran la suscripción y sus entregas, y registran la caducidad', async () => {
		dispositivo();
		avisar();

		await entregar(crearEnvioFalso([410]));

		expect(db.select().from(suscripcionPush).all()).toHaveLength(0);
		expect(entregas()).toHaveLength(0);
		expect(registro.eventos.some((evento) => evento.codigo === 'push.suscripcion_caducada')).toBe(true);
	});

	it('404 también borra la suscripción', async () => {
		dispositivo();
		avisar();

		await entregar(crearEnvioFalso([404]));

		expect(db.select().from(suscripcionPush).all()).toHaveLength(0);
	});

	it('Clarifications 9: una entrega con más de 24 horas se marca caducada sin enviarla', async () => {
		dispositivo();
		avisar();
		entorno.reloj.avanzar(25 * 60 * MINUTO);
		const envio = crearEnvioFalso([201]);

		await entregar(envio);

		expect(envio.envios).toHaveLength(0);
		expect(entregas()[0]?.estado).toBe('caducada');
	});

	it('RNF-008: con el envío siempre caído, el aviso que provocó el stock bajo sigue registrado', async () => {
		dispositivo();
		avisar();

		await entregar(crearEnvioFalso([500, 500, 500, 500, 500, 500]));

		expect(db.select().from(notificacion).all()).toHaveLength(1);
	});

	it('varios dispositivos de la misma persona reciben un envío cada uno', async () => {
		dispositivo();
		dispositivo();
		avisar();
		const envio = crearEnvioFalso([201, 201]);

		await entregar(envio);

		expect(envio.envios).toHaveLength(2);
		expect(new Set(envio.envios.map((envioHecho) => envioHecho.endpoint)).size).toBe(2);
	});

	it('el registro no contiene el endpoint ni las claves de la suscripción', async () => {
		const id = dispositivo();
		avisar();
		await entregar(crearEnvioFalso([500]));

		const texto = JSON.stringify(registro.eventos);
		expect(texto).not.toContain(`push.ejemplo.test/${id}`);
		expect(texto).not.toContain('p256');
	});

	it('un aviso con datos guardados que no cumplen su esquema se marca agotada y no se envía', async () => {
		dispositivo();
		avisar();
		db.update(notificacion).set({ datos: '{"tipoCapsulaId":"no-ulid"}' }).run();
		const envio = crearEnvioFalso([201]);

		await entregar(envio);

		expect(envio.envios).toHaveLength(0);
		expect(entregas()[0]?.estado).toBe('agotada');
		expect(registro.eventos.some((evento) => evento.codigo === 'dato.invalido')).toBe(true);
	});

	it('borrarAvisosAntiguos borra los avisos de más de 30 días con sus entregas', () => {
		dispositivo();
		avisar();
		entorno.reloj.avanzar(31 * 24 * 60 * MINUTO);
		avisar();

		const borrados = borrarAvisosAntiguos(db, entorno.reloj.ahora());

		expect(borrados).toBe(1);
		expect(db.select().from(notificacion).where(eq(notificacion.tipo, 'stock_bajo')).all()).toHaveLength(1);
	});
});
