import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { esquemaInstanteUtc, type InstanteUtc } from '#lib/shared/fechas/tipos';
import { registrarAviso } from './registrar';
import { contarNuevos, leerAvisoRecuentoPendiente, leerPanel, marcarVisto, marcarVistos, ultimoAviso } from './panel';

// Plan F6 D13, tarea T034: panel de avisos (RF-107, CA-021). Un aviso es visible 30 días; los nuevos, sin `vista_en`.
const AHORA = esquemaInstanteUtc.parse('2026-11-20T10:00:00.000Z');
const HACE_29_DIAS = esquemaInstanteUtc.parse('2026-10-22T10:00:00.000Z');
const HACE_31_DIAS = esquemaInstanteUtc.parse('2026-10-20T10:00:00.000Z');

describe('panel de avisos (RF-107, CA-021, Clarifications 11)', () => {
	let entorno: EntornoPrueba;
	let ana: string;
	let bea: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba(AHORA);
		ana = nuevoId();
		bea = nuevoId();
		crearUsuario(entorno.ambiente.db, { id: ana, nombre: 'Ana', correo: `${ana}@example.test`, rol: 'miembro', instante: AHORA });
		crearUsuario(entorno.ambiente.db, { id: bea, nombre: 'Bea', correo: `${bea}@example.test`, rol: 'miembro', instante: AHORA });
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function avisar(destinatario: string, instante: InstanteUtc) {
		enTransaccion(entorno.ambiente.db, (tx) =>
			registrarAviso(tx, {
				tipo: 'resumen_mensual',
				destinatario,
				datos: { mes: '2026-10', cafes: 3, invitados: 0, saldo: -500 },
				instante,
			}),
		);
	}

	it('CA-021: un aviso de hace 29 días es visible y uno de hace 31 días no', () => {
		const { db } = entorno.ambiente;
		avisar(ana, HACE_29_DIAS);
		avisar(ana, HACE_31_DIAS);

		const panel = leerPanel(db, { usuarioId: ana }, AHORA);

		expect(panel.avisos).toHaveLength(1);
		expect(panel.avisos[0].creadaEn).toBe(HACE_29_DIAS);
	});

	it('los nuevos son los avisos sin vista; contarNuevos los cuenta', () => {
		const { db } = entorno.ambiente;
		avisar(ana, HACE_29_DIAS);
		avisar(ana, AHORA);

		expect(contarNuevos(db, { usuarioId: ana }, AHORA)).toBe(2);
	});

	it('marcarVistos pone la vista y los avisos siguen visibles en el panel', () => {
		const { db } = entorno.ambiente;
		avisar(ana, AHORA);

		const marcados = marcarVistos(entorno.ambiente, { usuarioId: ana });

		expect(marcados).toBe(1);
		expect(contarNuevos(db, { usuarioId: ana }, AHORA)).toBe(0);
		const panel = leerPanel(db, { usuarioId: ana }, AHORA);
		expect(panel.avisos).toHaveLength(1);
		expect(panel.avisos[0].vista).toBe(true);
	});

	it('solo muestra los avisos propios', () => {
		const { db } = entorno.ambiente;
		avisar(bea, AHORA);

		expect(leerPanel(db, { usuarioId: ana }, AHORA).avisos).toHaveLength(0);
		expect(contarNuevos(db, { usuarioId: ana }, AHORA)).toBe(0);
	});

	it('ultimoAviso devuelve el instante del aviso más reciente de ese tipo', () => {
		const { db } = entorno.ambiente;
		avisar(ana, HACE_29_DIAS);
		avisar(ana, AHORA);

		expect(ultimoAviso(db, ana, 'resumen_mensual')).toBe(AHORA);
		expect(ultimoAviso(db, bea, 'resumen_mensual')).toBeNull();
	});

	describe('aviso de recuento en Inicio (RF-246, CA-246)', () => {
		const datosRecuento = {
			recuentoId: nuevoId(),
			accion: 'registrado',
			fecha: '2026-11-19',
			lineas: [{ nombreTipo: 'Ristretto', diferencia: -3 }],
			importe: 105,
			personas: 8,
			minimo: 13,
			maximo: 13,
		};

		function avisarRecuento(instante: InstanteUtc): void {
			enTransaccion(entorno.ambiente.db, (tx) => registrarAviso(tx, { tipo: 'recuento', datos: datosRecuento, instante }));
		}

		it('CA-246: devuelve el último recuento sin ver con su título y su texto', () => {
			avisarRecuento(HACE_29_DIAS);
			avisarRecuento(AHORA);

			const aviso = leerAvisoRecuentoPendiente(entorno.ambiente.db, { usuarioId: ana }, AHORA);

			expect(aviso?.titulo).toBe('Recuento del 19/11');
			expect(aviso?.texto).toContain('Faltaban 3 Ristretto');
		});

		it('CA-246: un aviso de hace más de 30 días no se muestra', () => {
			avisarRecuento(HACE_31_DIAS);

			expect(leerAvisoRecuentoPendiente(entorno.ambiente.db, { usuarioId: ana }, AHORA)).toBeNull();
		});

		it('CA-246: marcarVisto lo oculta de Inicio y no marca los avisos de otra persona', () => {
			avisarRecuento(AHORA);
			const { db } = entorno.ambiente;
			const deAna = leerAvisoRecuentoPendiente(db, { usuarioId: ana }, AHORA);
			const deBea = leerAvisoRecuentoPendiente(db, { usuarioId: bea }, AHORA);
			expect(deAna).not.toBeNull();
			if (!deAna || !deBea) throw new Error('Faltan los avisos de prueba');

			expect(marcarVisto(entorno.ambiente, { usuarioId: bea }, deAna.id)).toBe(false);
			expect(leerAvisoRecuentoPendiente(db, { usuarioId: ana }, AHORA)).not.toBeNull();

			expect(marcarVisto(entorno.ambiente, { usuarioId: ana }, deAna.id)).toBe(true);
			expect(leerAvisoRecuentoPendiente(db, { usuarioId: ana }, AHORA)).toBeNull();
			expect(leerAvisoRecuentoPendiente(db, { usuarioId: bea }, AHORA)?.id).toBe(deBea.id);
			// Sigue en el panel (RF-107).
			expect(leerPanel(db, { usuarioId: ana }, AHORA).avisos.map((a) => a.tipo)).toContain('recuento');
		});

		it('CA-246: repetir marcarVisto no cambia nada', () => {
			avisarRecuento(AHORA);
			const aviso = leerAvisoRecuentoPendiente(entorno.ambiente.db, { usuarioId: ana }, AHORA);
			if (!aviso) throw new Error('Falta el aviso de prueba');

			expect(marcarVisto(entorno.ambiente, { usuarioId: ana }, aviso.id)).toBe(true);
			expect(marcarVisto(entorno.ambiente, { usuarioId: ana }, aviso.id)).toBe(false);
		});
	});
});
