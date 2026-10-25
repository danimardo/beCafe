import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { leerMarcasCuenta, marcarCuenta } from './index';
import { crearUsuario } from './alta';
import { preferenciaCuenta } from './esquema';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';

// Marcas de la cuenta (plan F10 D8 y D9): se guardan por persona y en el servidor (constitución V).
const INSTANTE = '2026-10-24T09:00:00.000Z';

describe('marcas de la cuenta', () => {
	let entorno: EntornoPrueba;
	let ana: string;
	let luis: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		ana = nuevoId();
		luis = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => {
			crearUsuario(tx, { id: ana, nombre: 'Ana', correo: 'ana@ejemplo.es', rol: 'miembro', instante: INSTANTE });
			crearUsuario(tx, { id: luis, nombre: 'Luis', correo: 'luis@ejemplo.es', rol: 'miembro', instante: INSTANTE });
		});
	});

	afterEach(() => entorno.cerrar());

	it('CA-204, CA-206, CA-207: una cuenta nueva no tiene ninguna marca', () => {
		expect(leerMarcasCuenta(entorno.ambiente.db, ana)).toEqual({
			tourInicioVisto: false,
			instalacionDescartada: false,
			ofertaAvisosVista: false,
		});
	});

	it('CA-204: marcar el tour dos veces deja una sola fila y solo afecta a esa persona', () => {
		marcarCuenta(entorno.ambiente, ana, 'tour_inicio_visto');
		marcarCuenta(entorno.ambiente, ana, 'tour_inicio_visto');

		expect(entorno.ambiente.db.select().from(preferenciaCuenta).all()).toHaveLength(1);
		expect(leerMarcasCuenta(entorno.ambiente.db, ana).tourInicioVisto).toBe(true);
		expect(leerMarcasCuenta(entorno.ambiente.db, luis).tourInicioVisto).toBe(false);
	});

	it('CA-206, CA-207: cada marca se guarda por separado', () => {
		marcarCuenta(entorno.ambiente, ana, 'instalacion_descartada');
		marcarCuenta(entorno.ambiente, ana, 'oferta_avisos_vista');

		expect(leerMarcasCuenta(entorno.ambiente.db, ana)).toEqual({
			tourInicioVisto: false,
			instalacionDescartada: true,
			ofertaAvisosVista: true,
		});
	});
});
