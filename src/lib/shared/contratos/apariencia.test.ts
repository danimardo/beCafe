import { describe, expect, it } from 'vitest';
import {
	esquemaPistaLipSync,
	interpretarBienvenida,
	interpretarMascota,
	interpretarTema,
	interpretarTransparencia,
	interpretarVoz,
} from './apariencia';

// RF-180, RF-181, RF-185, RF-187: los valores válidos pasan; cualquier otro valor cae en el valor por defecto.
describe('preferencias de apariencia y mascota (RF-180, RF-181, RF-185, RF-187)', () => {
	it('CA-180: el tema acepta auto, claro y oscuro', () => {
		expect(interpretarTema('auto')).toBe('auto');
		expect(interpretarTema('claro')).toBe('claro');
		expect(interpretarTema('oscuro')).toBe('oscuro');
	});

	it('CA-180: un tema ausente o no válido vuelve a Automático', () => {
		expect(interpretarTema(null)).toBe('auto');
		expect(interpretarTema(undefined)).toBe('auto');
		expect(interpretarTema('azul')).toBe('auto');
		expect(interpretarTema('CLARO')).toBe('auto');
	});

	it('CA-181: la transparencia acepta normal y reducida', () => {
		expect(interpretarTransparencia('normal')).toBe('normal');
		expect(interpretarTransparencia('reducida')).toBe('reducida');
	});

	it('CA-181: una transparencia ausente o no válida vuelve a normal', () => {
		expect(interpretarTransparencia(null)).toBe('normal');
		expect(interpretarTransparencia('<script>')).toBe('normal');
		expect(interpretarTransparencia(1)).toBe('normal');
	});

	it('CA-185: la mascota acepta visible y oculta y vuelve a visible ante valores inválidos', () => {
		expect(interpretarMascota('visible')).toBe('visible');
		expect(interpretarMascota('oculta')).toBe('oculta');
		expect(interpretarMascota(null)).toBe('visible');
		expect(interpretarMascota('otro')).toBe('visible');
	});

	it('CA-187: la voz acepta activa y silenciada y vuelve a silenciada por defecto', () => {
		expect(interpretarVoz('activa')).toBe('activa');
		expect(interpretarVoz('silenciada')).toBe('silenciada');
		expect(interpretarVoz(null)).toBe('silenciada');
		expect(interpretarVoz('1')).toBe('silenciada');
	});

	it('CA-185: la bienvenida acepta pendiente y vista y vuelve a pendiente por defecto', () => {
		expect(interpretarBienvenida('pendiente')).toBe('pendiente');
		expect(interpretarBienvenida('vista')).toBe('vista');
		expect(interpretarBienvenida(null)).toBe('pendiente');
		expect(interpretarBienvenida('true')).toBe('pendiente');
	});

	it('CA-187: valida el esquema de pista de lip-sync pregenerada', () => {
		const valida = esquemaPistaLipSync.safeParse({
			version: 1,
			audio: 'intro_01.mp3',
			texto: '¡Hola! Soy Capsulito.',
			duration: 2.4,
			cues: [
				{ start: 0.1, end: 0.25, value: 2 },
				{ start: 0.25, end: 0.4, value: 7 },
			],
		});
		expect(valida.success).toBe(true);

		const invalida = esquemaPistaLipSync.safeParse({
			version: 1,
			audio: 'intro_01.mp3',
			texto: '¡Hola!',
			duration: 1,
			cues: [{ start: 0, end: 0.2, value: 9 }],
		});
		expect(invalida.success).toBe(false);
	});
});
