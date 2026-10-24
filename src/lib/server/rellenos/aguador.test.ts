import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { enTransaccion, nuevoId, type EntornoPrueba, crearEntornoPrueba, crearPlanificador } from '#lib/server/plataforma';
import { crearUsuario, marcarBaja } from '#lib/server/usuarios';
import { esquemaMes, type Mes } from '#lib/shared/fechas/tipos';
import { aguadorMes, rellenoAgua } from './esquema';
import { determinarAguador, TAREA_AGUADOR } from './aguador';
import { anularRelleno } from './anular';
import { leerAguador } from './consultas';
import type { PersonaRelleno } from './registrar';
import { configuracion } from '#lib/server/configuracion';

// Plan F8 D5, tarea T021: el aguador del mes se fija el día 1 y no cambia (CA-176, Clarifications 1, 2, 5).
const DIA_UNO = '2026-11-01T08:00:00.000Z';
const OCTUBRE = esquemaMes.parse('2026-10');

describe('determinarAguador (CA-176)', () => {
	let entorno: EntornoPrueba;
	let personas: Record<'ana' | 'jorge' | 'luis', PersonaRelleno>;

	beforeEach(() => {
		entorno = crearEntornoPrueba(DIA_UNO);
		const ids = { ana: nuevoId(), jorge: nuevoId(), luis: nuevoId() };
		const nombres = { ana: 'Ana', jorge: 'Jorge', luis: 'Luis' };
		for (const clave of ['ana', 'jorge', 'luis'] as const) {
			const id = ids[clave];
			crearUsuario(entorno.ambiente.db, { id, nombre: nombres[clave], correo: `${id}@example.test`, rol: 'miembro', instante: DIA_UNO });
		}
		personas = { ana: { usuarioId: ids.ana }, jorge: { usuarioId: ids.jorge }, luis: { usuarioId: ids.luis } };
		entorno.ambiente.db
			.insert(configuracion)
			.values({ clave: 'intervalo_rellenos_min', valor: '0', modificadoPor: ids.ana, modificadoEn: DIA_UNO })
			.run();
	});

	afterEach(() => {
		entorno.cerrar();
	});

	/** Siembra un relleno con fecha de octubre. Así un mes puede tener los rellenos que hacen falta sin esperar. */
	function sembrarEnOctubre(persona: PersonaRelleno, dia: number, estado: 'vigente' | 'anulado' = 'vigente') {
		const dia2 = String(dia).padStart(2, '0');
		entorno.ambiente.db
			.insert(rellenoAgua)
			.values({
				id: nuevoId(),
				clienteId: nuevoId(),
				usuarioId: persona.usuarioId,
				registradoEn: `2026-10-${dia2}T10:00:00.000Z`,
				estado,
				...(estado === 'anulado'
					? { anuladoPor: persona.usuarioId, anuladoEn: `2026-10-${dia2}T11:00:00.000Z`, motivoAnulacion: 'prueba' }
					: {}),
			})
			.run();
	}

	function sembrar(persona: PersonaRelleno, veces: number) {
		for (let dia = 1; dia <= veces; dia++) sembrarEnOctubre(persona, dia);
	}

	function determinar(mes: Mes = OCTUBRE) {
		return determinarAguador({ db: entorno.ambiente.db, reloj: entorno.reloj, mes });
	}

	it('CA-176: con Ana 6, Jorge 6 y Luis 4, Ana y Jorge quedan fijados como aguadores de octubre', () => {
		sembrar(personas.ana, 6);
		sembrar(personas.jorge, 6);
		sembrar(personas.luis, 4);

		determinar();

		expect(leerAguador(entorno.ambiente.db, OCTUBRE).map((fila) => fila.nombre)).toEqual(['Ana', 'Jorge']);
	});

	it('CA-176: un mes sin rellenos no tiene filas de aguador', () => {
		expect(determinar()).toBe(0);
		expect(leerAguador(entorno.ambiente.db, OCTUBRE)).toEqual([]);
	});

	it('Clarifications 1: una anulación posterior al día 1 no cambia el aguador fijado', () => {
		const admin = nuevoId();
		crearUsuario(entorno.ambiente.db, {
			id: admin,
			nombre: 'Admin',
			correo: `${admin}@example.test`,
			rol: 'administrador',
			instante: DIA_UNO,
		});
		sembrarEnOctubre(personas.ana, 1);
		sembrarEnOctubre(personas.ana, 2);
		sembrarEnOctubre(personas.luis, 3);
		determinar();
		const antes = entorno.ambiente.db.select().from(aguadorMes).all();

		const relleno = entorno.ambiente.db.select().from(rellenoAgua).where(eq(rellenoAgua.usuarioId, personas.ana.usuarioId)).all()[0];
		anularRelleno(entorno.ambiente, { usuarioId: admin }, relleno.id, 'Error de carga');

		expect(entorno.ambiente.db.select().from(aguadorMes).all()).toEqual(antes);
	});

	it('CA-176: una persona de baja no opta al título aunque tenga más rellenos', () => {
		sembrar(personas.ana, 9);
		sembrar(personas.luis, 2);
		enTransaccion(entorno.ambiente.db, (tx) => marcarBaja(tx, { usuarioId: personas.ana.usuarioId, instante: DIA_UNO }));

		determinar();

		expect(leerAguador(entorno.ambiente.db, OCTUBRE).map((fila) => fila.nombre)).toEqual(['Luis']);
	});

	it('Clarifications 2: una segunda ejecución del mismo mes no hace nada', () => {
		sembrar(personas.ana, 3);
		determinar();

		expect(determinar()).toBe(0);
		expect(leerAguador(entorno.ambiente.db, OCTUBRE)).toHaveLength(1);
	});

	it('Clarifications 2: el servidor parado el día 1 → la recuperación lo fija una vez', async () => {
		sembrar(personas.ana, 3);
		const planificador = crearPlanificador({ db: entorno.ambiente.db, reloj: entorno.reloj });
		planificador.registrar({
			nombre: TAREA_AGUADOR,
			cron: '5 0 1 * *',
			periodo: () => OCTUBRE,
			ejecutar: ({ periodo }) => {
				if (periodo) determinarAguador({ db: entorno.ambiente.db, reloj: entorno.reloj, mes: esquemaMes.parse(periodo) });
			},
		});

		await planificador.recuperar();
		await planificador.recuperar();

		expect(leerAguador(entorno.ambiente.db, OCTUBRE)).toHaveLength(1);
	});
});
