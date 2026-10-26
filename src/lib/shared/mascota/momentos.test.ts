import { describe, expect, it } from 'vitest';
import { ESCENAS_BIENVENIDA } from './bienvenida';
import { EXPRESIONES, MOMENTOS, POSES_RIV, elegirVariante, momentoInicio, srcPose, srcRiv, srcSvg, textoDe } from './momentos';

describe('catálogo de momentos, eventos y bienvenida de Capsulito (RF-185, RF-186)', () => {
	it('CA-185, CA-247: incluye las 8 poses Rive, las 6 expresiones y las 9 escenas de bienvenida, con intro_09 en quinto lugar', () => {
		expect(POSES_RIV).toHaveLength(8);
		expect(EXPRESIONES).toHaveLength(6);
		expect(ESCENAS_BIENVENIDA).toHaveLength(9);
		expect(ESCENAS_BIENVENIDA.map((e) => e.id)).toEqual([
			'intro_01',
			'intro_02',
			'intro_03',
			'intro_04',
			'intro_09',
			'intro_05',
			'intro_06',
			'intro_07',
			'intro_08',
		]);
	});

	it('CA-247: la escena del dinero dice el texto literal de RF-247 y su locución cambia solo las etiquetas', () => {
		const escena = ESCENAS_BIENVENIDA[4];
		expect(escena.id).toBe('intro_09');
		expect(escena.texto).toBe(
			'La hucha común paga las cápsulas. Tú pones dinero con una aportación y cada café descuenta de tu saldo lo que cuesta. De vez en cuando, los administradores cuentan la caja para que todo cuadre.',
		);
		expect(escena.textoVoz.replace(/\[[a-z]+\] ?/g, '')).toBe(escena.texto);
		expect(escena.textoVoz.startsWith('[cheerful]')).toBe(true);
	});

	it('CA-186: momentoInicio prioriza rechazo > pendientes > deuda > stock bajo > aguador > saludo', () => {
		const base = {
			rechazado: false,
			pendientes: 0,
			saldoCents: 0,
			limiteDeudaCents: -500,
			stockBajo: 0,
			soyAguador: false,
			hora: 9,
		};
		expect(momentoInicio(base)).toBe('saludo-manana');
		expect(momentoInicio({ ...base, hora: 16 })).toBe('saludo-tarde');
		expect(momentoInicio({ ...base, soyAguador: true })).toBe('aguador-tu');
		expect(momentoInicio({ ...base, soyAguador: true, stockBajo: 2 })).toBe('aviso-stock-bajo');
		expect(momentoInicio({ ...base, stockBajo: 2, saldoCents: -600 })).toBe('aviso-deuda');
		expect(momentoInicio({ ...base, saldoCents: -600, pendientes: 1 })).toBe('aviso-pendientes');
		expect(momentoInicio({ ...base, pendientes: 1, rechazado: true })).toBe('consumo-rechazado');
	});

	it('CA-186: elegirVariante nunca repite la misma frase dos veces seguidas cuando hay varias opciones', () => {
		const primera = elegirVariante('consumo.confirmado', null, 0);
		const segunda = elegirVariante('consumo.confirmado', primera.id, 0);
		expect(segunda.id).not.toBe(primera.id);

		const tercera = elegirVariante('consumo.confirmado', segunda.id, 1);
		expect(tercera.id).not.toBe(segunda.id);
	});

	it('CA-186: los momentos de deuda personal, errores y rechazos usan tono serio sin etiquetas de risa', () => {
		const serios = [
			MOMENTOS['aviso-deuda'],
			MOMENTOS['consumo-rechazado'],
			MOMENTOS['stock.negativo'],
			MOMENTOS['agua.rechazada_reciente'],
			MOMENTOS['error.sin_permiso'],
			MOMENTOS['error.servidor'],
		];
		for (const momento of serios) {
			expect(['aviso', 'problema']).toContain(momento.tono);
			for (const variante of momento.variantes) {
				expect(variante.textoVoz).not.toMatch(/\[(laughs|chuckles|giggles|excited|cheerful)\]/i);
			}
		}
	});

	it('CA-185: construye las rutas de activos WebP, SVG y Rive y sustituye {nombre}', () => {
		expect(textoDe('saludo-manana', { nombre: 'Ana' })).toContain('Ana');
		expect(srcPose('saludando', 256)).toBe('/mascota/capsulito-saludando-256.webp');
		expect(srcSvg('saludo', 'feliz')).toBe('/mascota/svg/variantes/saludando/alegre.svg');
		expect(srcRiv('celebrando')).toBe('/mascota/riv/capsulito-celebrando.riv');
	});
});

describe('saludo sin nombre (RF-195)', () => {
	it('CA-195: «¡Hola, {nombre}!» sin nombre queda «¡Hola!» y con nombre lo conserva', () => {
		expect(textoDe('bienvenida-hola')).toMatch(/^¡Hola! Soy Capsulito/);
		expect(textoDe('bienvenida-hola', { nombre: 'Ana' })).toMatch(/^¡Hola, Ana! Soy Capsulito/);
	});
});
