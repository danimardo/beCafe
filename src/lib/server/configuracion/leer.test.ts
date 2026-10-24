import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { leerConfiguracion } from './leer';
import { configuracion } from './esquema';
import { crearEntornoPrueba, type EntornoPrueba } from '../plataforma/pruebas/entorno-prueba';

describe('configuración con valores por defecto (RN-032, RN-074, RN-082)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
	});

	afterEach(() => entorno.cerrar());

	it('sin filas, devuelve 15 minutos, −500 céntimos y 60 minutos', () => {
		expect(leerConfiguracion(entorno.ambiente.db)).toEqual({
			plazoAutoanulacionMin: 15,
			limiteDeudaCentimos: -500,
			intervaloRellenosMin: 60,
		});
	});

	it('usa el valor guardado cuando supera su esquema', () => {
		entorno.base.db
			.insert(configuracion)
			.values({ clave: 'plazo_autoanulacion_min', valor: '30', modificadoPor: 'admin-prueba', modificadoEn: entorno.reloj.ahora() })
			.run();
		expect(leerConfiguracion(entorno.ambiente.db).plazoAutoanulacionMin).toBe(30);
	});

	it('un valor guardado no válido vuelve al defecto y registra dato.invalido sin el valor', () => {
		entorno.base.db
			.insert(configuracion)
			.values({ clave: 'plazo_autoanulacion_min', valor: '-7', modificadoPor: 'admin-prueba', modificadoEn: entorno.reloj.ahora() })
			.run();
		expect(leerConfiguracion(entorno.ambiente.db).plazoAutoanulacionMin).toBe(15);
		const invalidos = entorno.eventos().filter((evento) => evento.codigo === 'dato.invalido');
		expect(invalidos).toHaveLength(1);
		expect(JSON.stringify(invalidos)).not.toContain('-7');
	});
});
