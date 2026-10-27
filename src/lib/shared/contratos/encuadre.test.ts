import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { camposEncuadre, encuadreDe, refinarEncuadre } from './encuadre';
import { esquemaFotoAlta, esquemaSubirFotoPersona } from './fotos-usuario';

// F15 US4 (RF-273, RF-274): la zona de encuadre llega completa o no llega; sin ella, el servidor recorta el centro.
const esquema = z.strictObject(camposEncuadre).superRefine(refinarEncuadre);
const FOTO = new File([new Uint8Array([1, 2, 3])], 'foto.jpg', { type: 'image/jpeg' });

describe('contrato de encuadre', () => {
	it('CA-273: acepta los tres campos dentro de rango', () => {
		const resultado = esquema.safeParse({ encuadreX: '0.1', encuadreY: '0', encuadreLado: '0.5' });
		expect(resultado.success).toBe(true);
		expect(resultado.data && encuadreDe(resultado.data)).toEqual({ x: 0.1, y: 0, lado: 0.5 });
	});

	it('CA-273: sin ningún campo no hay encuadre', () => {
		const resultado = esquema.safeParse({});
		expect(resultado.success).toBe(true);
		expect(resultado.data && encuadreDe(resultado.data)).toBeUndefined();
	});

	it('CA-273: campos vacíos cuentan como ausentes', () => {
		expect(esquema.safeParse({ encuadreX: '', encuadreY: '', encuadreLado: '' }).success).toBe(true);
	});

	it.each([
		['solo uno', { encuadreX: '0.2' }],
		['solo dos', { encuadreX: '0.2', encuadreY: '0.2' }],
		['fuera de rango', { encuadreX: '1.2', encuadreY: '0', encuadreLado: '0.5' }],
		['negativo', { encuadreX: '-0.1', encuadreY: '0', encuadreLado: '0.5' }],
		['lado cero', { encuadreX: '0', encuadreY: '0', encuadreLado: '0' }],
		['no numérico', { encuadreX: 'a', encuadreY: '0', encuadreLado: '0.5' }],
	])('CA-273: rechaza %s', (_caso, datos) => {
		expect(esquema.safeParse(datos).success).toBe(false);
	});

	it('CA-273: el mensaje de rechazo no incluye el valor recibido', () => {
		const resultado = esquema.safeParse({ encuadreX: '77', encuadreY: '0', encuadreLado: '0.5' });
		expect(JSON.stringify(resultado.error?.issues)).not.toContain('77');
	});

	it('CA-273: la foto de persona y el alta incorporan el encuadre', () => {
		const datos = { foto: FOTO, encuadreX: '0.1', encuadreY: '0.2', encuadreLado: '0.5' };
		expect(esquemaSubirFotoPersona.parse(datos).encuadre).toEqual({ x: 0.1, y: 0.2, lado: 0.5 });
		expect(esquemaFotoAlta.parse(datos).encuadre).toEqual({ x: 0.1, y: 0.2, lado: 0.5 });
		expect(esquemaSubirFotoPersona.parse({ foto: FOTO }).encuadre).toBeUndefined();
		expect(esquemaFotoAlta.safeParse({ foto: FOTO, encuadreX: '0.1' }).success).toBe(false);
	});
});
