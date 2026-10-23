import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '#lib/server/auth';
import { crearEntornoPrueba, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { anularAportacion } from './anulaciones';
import { leerHistorial, leerRegistroDeControl, type FiltrosHistorial } from './historial';
import { prepararAportacion, prepararConsumo, prepararMiembros, prepararTipo } from './pruebas/constructores';
import { arqueo, movimiento, reparto } from './esquema';

// Plan F5 D2 y tarea T008: historial con «Todo» y «Míos», anulados ocultos, visibilidad de consumos y paginación (CA-112, CA-113).
const INSTANTE = '2026-10-22T10:00:00.000Z';

function actorDe(usuarioId: string, rol: Actor['rol'] = 'miembro'): Actor {
	return { usuarioId, rol, autenticadoEn: INSTANTE, sesionIdHash: `hash-${usuarioId}` };
}

const TODO: FiltrosHistorial = { quien: 'todo', tipo: 'todos', anulados: false, pagina: 1 };

describe('historial económico (CA-112, CA-113, Clarifications 3 y 7)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('CA-112: «Míos» incluye mis aportaciones, mis consumos y mis repartos, y no los de otras personas', async () => {
		const [ana, bea] = prepararMiembros(entorno.ambiente.db, 2);
		const tipo = await prepararTipo(entorno.ambiente);
		const aportacionAna = prepararAportacion(entorno.ambiente.db, { usuarioId: ana, importe: 1000, instante: INSTANTE });
		const consumoAna = prepararConsumo(entorno.ambiente.db, {
			usuarioId: ana,
			tipoCapsulaId: tipo,
			precioAplicado: 35,
			costeMedioAplicado: 30,
			horaRegistro: '2026-10-22T09:00:00.000Z',
		});
		prepararConsumo(entorno.ambiente.db, {
			usuarioId: bea,
			tipoCapsulaId: tipo,
			precioAplicado: 35,
			costeMedioAplicado: 30,
			horaRegistro: '2026-10-22T09:30:00.000Z',
		});
		const repartoId = nuevoId();
		entorno.ambiente.db
			.insert(reparto)
			.values({ id: repartoId, origenTipo: 'arqueo', origenId: nuevoId(), importe: 300, miembros: 2, creadoEn: INSTANTE })
			.run();
		entorno.ambiente.db
			.insert(movimiento)
			.values({
				id: nuevoId(),
				cuenta: 'persona',
				usuarioId: ana,
				tipo: 'reparto_arqueo',
				importe: 150,
				origenTipo: 'reparto',
				origenId: repartoId,
				creadoEn: INSTANTE,
			})
			.run();

		const pagina = leerHistorial(entorno.ambiente.db, actorDe(ana), { ...TODO, quien: 'mios' });

		const ids = pagina.filas.map((fila) => fila.id);
		expect(ids).toEqual(expect.arrayContaining([aportacionAna, consumoAna, repartoId]));
		expect(pagina.filas.map((fila) => fila.personaId)).not.toContain(bea);
		expect(pagina.total).toBe(3);
	});

	it('CA-113: los anulados no aparecen por defecto; con «anulados» muestran autor, fecha y motivo', () => {
		const ana = prepararMiembros(entorno.ambiente.db, 1)[0];
		const admin = crearAdministradorDePrueba();
		const aportacionId = prepararAportacion(entorno.ambiente.db, { usuarioId: ana, importe: 500, instante: INSTANTE });
		anularAportacion(entorno.ambiente, actorDe(admin, 'administrador'), aportacionId, 'Importe mal introducido');

		expect(leerHistorial(entorno.ambiente.db, actorDe(admin, 'administrador'), TODO).filas).toEqual([]);

		const conAnulados = leerHistorial(entorno.ambiente.db, actorDe(admin, 'administrador'), { ...TODO, anulados: true });
		expect(conAnulados.filas).toEqual([
			expect.objectContaining({
				id: aportacionId,
				anulado: true,
				anuladoEn: INSTANTE,
				motivo: 'Importe mal introducido',
			}),
		]);
	});

	it('Clarifications 3: un miembro ve sus consumos en «Todo» y no los ajenos; un administrador los ve todos', async () => {
		const [ana, bea] = prepararMiembros(entorno.ambiente.db, 2);
		const admin = crearAdministradorDePrueba();
		const tipo = await prepararTipo(entorno.ambiente);
		const consumoAna = prepararConsumo(entorno.ambiente.db, {
			usuarioId: ana,
			tipoCapsulaId: tipo,
			precioAplicado: 35,
			costeMedioAplicado: 30,
			horaRegistro: '2026-10-22T09:00:00.000Z',
		});
		const consumoBea = prepararConsumo(entorno.ambiente.db, {
			usuarioId: bea,
			tipoCapsulaId: tipo,
			precioAplicado: 35,
			costeMedioAplicado: 30,
			horaRegistro: '2026-10-22T09:30:00.000Z',
		});

		const comoMiembro = leerHistorial(entorno.ambiente.db, actorDe(ana), TODO).filas.map((fila) => fila.id);
		expect(comoMiembro).toContain(consumoAna);
		expect(comoMiembro).not.toContain(consumoBea);

		const comoAdmin = leerHistorial(entorno.ambiente.db, actorDe(admin, 'administrador'), TODO).filas.map((fila) => fila.id);
		expect(comoAdmin).toEqual(expect.arrayContaining([consumoAna, consumoBea]));
	});

	it('tipo «consumos» con «Todo» para un miembro se trata como «todos» (solo sus consumos y el resto del historial)', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		const aportacionAna = prepararAportacion(entorno.ambiente.db, { usuarioId: ana, importe: 500, instante: INSTANTE });

		const pagina = leerHistorial(entorno.ambiente.db, actorDe(ana), { ...TODO, tipo: 'consumos' });

		expect(pagina.filas.map((fila) => fila.id)).toContain(aportacionAna);
	});

	it('tipo «aportaciones» solo devuelve aportaciones', async () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		const tipo = await prepararTipo(entorno.ambiente);
		prepararConsumo(entorno.ambiente.db, {
			usuarioId: ana,
			tipoCapsulaId: tipo,
			precioAplicado: 35,
			costeMedioAplicado: 30,
			horaRegistro: INSTANTE,
		});
		const aportacionAna = prepararAportacion(entorno.ambiente.db, { usuarioId: ana, importe: 500, instante: INSTANTE });

		const pagina = leerHistorial(entorno.ambiente.db, actorDe(ana), { ...TODO, tipo: 'aportaciones' });

		expect(pagina.filas.map((fila) => fila.id)).toEqual([aportacionAna]);
	});

	it('pagina de 20 registros, ordenada por fecha descendente, con el total', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		for (let indice = 0; indice < 25; indice += 1) {
			prepararAportacion(entorno.ambiente.db, {
				usuarioId: ana,
				importe: 100,
				instante: `2026-10-${String(1 + indice).padStart(2, '0')}T10:00:00.000Z`,
			});
		}

		const primera = leerHistorial(entorno.ambiente.db, actorDe(ana), { ...TODO, tipo: 'aportaciones' });
		const segunda = leerHistorial(entorno.ambiente.db, actorDe(ana), { ...TODO, tipo: 'aportaciones', pagina: 2 });

		expect(primera.filas).toHaveLength(20);
		expect(segunda.filas).toHaveLength(5);
		expect(primera.total).toBe(25);
		expect(primera.filas[0].fecha > primera.filas[19].fecha).toBe(true);
	});

	it('CA-113 y plan D7: el detalle de un arqueo lista su reparto por persona y su anulación; un id desconocido no existe', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		const admin = crearAdministradorDePrueba();
		const arqueoId = nuevoId();
		const repartoId = nuevoId();
		entorno.ambiente.db
			.insert(arqueo)
			.values({
				id: arqueoId,
				adminId: admin,
				realizadoEn: INSTANTE,
				saldoTeorico: 1000,
				contado: 900,
				diferencia: -100,
				estado: 'vigente',
			})
			.run();
		entorno.ambiente.db
			.insert(reparto)
			.values({ id: repartoId, origenTipo: 'arqueo', origenId: arqueoId, importe: 100, miembros: 1, creadoEn: INSTANTE })
			.run();
		entorno.ambiente.db
			.insert(movimiento)
			.values({
				id: nuevoId(),
				cuenta: 'persona',
				usuarioId: ana,
				tipo: 'reparto_arqueo',
				importe: -100,
				origenTipo: 'reparto',
				origenId: repartoId,
				creadoEn: INSTANTE,
			})
			.run();

		const detalle = leerRegistroDeControl(entorno.ambiente.db, actorDe(admin, 'administrador'), arqueoId);

		expect(detalle).toEqual(
			expect.objectContaining({
				tipo: 'arqueo',
				diferencia: -100,
				anulado: false,
				repartos: [expect.objectContaining({ usuarioId: ana, importe: -100 })],
			}),
		);
		expect(() => leerRegistroDeControl(entorno.ambiente.db, actorDe(admin, 'administrador'), nuevoId())).toThrow();
	});

	function crearAdministradorDePrueba(): string {
		const id = nuevoId();
		crearUsuario(entorno.ambiente.db, {
			id,
			nombre: 'Admin de prueba',
			correo: `admin-${id}@example.test`,
			rol: 'administrador',
			instante: INSTANTE,
		});
		return id;
	}
});
