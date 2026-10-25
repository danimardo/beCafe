import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { CATALOGO, construirMensaje, validarDatos } from './catalogo';
import { TIPOS_NOTIFICACION } from './esquema';

const ULID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

describe('catálogo de avisos (RF-101, plan D1)', () => {
	it('tiene todos los tipos y solo deuda no es desactivable', () => {
		expect(Object.keys(CATALOGO).sort()).toEqual([...TIPOS_NOTIFICACION].sort());
		const noDesactivables = TIPOS_NOTIFICACION.filter((tipo) => !CATALOGO[tipo].desactivable);
		expect(noDesactivables).toEqual(['deuda']);
	});

	it('asigna los destinatarios del plan: stock bajo a todos, negativos y copias a administradores, deuda y resumen a la persona', () => {
		expect(CATALOGO.stock_bajo.destinatarios).toBe('todos');
		expect(CATALOGO.stock_negativo.destinatarios).toBe('administradores');
		expect(CATALOGO.hucha_negativa.destinatarios).toBe('administradores');
		expect(CATALOGO.fallo_copia.destinatarios).toBe('administradores');
		expect(CATALOGO.deuda.destinatarios).toBe('persona');
		expect(CATALOGO.resumen_mensual.destinatarios).toBe('persona');
		expect(CATALOGO.cafe_visitante_pendiente.destinatarios).toBe('administradores');
		expect(CATALOGO.aportacion_en_tu_nombre.destinatarios).toBe('persona');
	});

	it('está congelado', () => {
		expect(Object.isFrozen(CATALOGO)).toBe(true);
	});
});

describe('construirMensaje', () => {
	it('CA-192: cafe_visitante_pendiente cuenta los pendientes y enlaza a la revisión, sin nombres', () => {
		const mensaje = construirMensaje('cafe_visitante_pendiente', { cafeId: ULID, pendientes: 3 });
		expect(mensaje).toEqual({
			titulo: 'Café de visitante pendiente',
			texto: 'Hay 3 cafés de visitante por revisar.',
			enlace: '/admin/visitantes',
		});
		expect(construirMensaje('cafe_visitante_pendiente', { cafeId: ULID, pendientes: 1 }).texto).toBe(
			'Hay 1 café de visitante por revisar.',
		);
	});

	it('CA-200: aportacion_en_tu_nombre formatea el importe y enlaza a saldos', () => {
		const mensaje = construirMensaje('aportacion_en_tu_nombre', { aportacionId: ULID, importe: 1000 });
		expect(mensaje.texto).toContain('10,00');
		expect(mensaje.enlace).toBe('/saldos');
	});

	it('stock_bajo: título con el nombre del tipo y enlace a la pantalla de inicio', () => {
		const mensaje = construirMensaje('stock_bajo', { tipoCapsulaId: ULID, nombreTipo: 'Lungo', stock: 2 });
		expect(mensaje).toEqual({ titulo: 'Stock bajo: Lungo', texto: 'Quedan 2 cápsulas.', enlace: '/' });
	});

	it('stock_negativo: enlaza a la ficha de la cápsula', () => {
		const mensaje = construirMensaje('stock_negativo', { tipoCapsulaId: ULID, nombreTipo: 'Lungo', stock: -1 });
		expect(mensaje.enlace).toBe(`/admin/capsulas/${ULID}`);
		expect(mensaje.texto).toContain('-1');
	});

	it('hucha_negativa: formatea el saldo en euros desde céntimos', () => {
		const mensaje = construirMensaje('hucha_negativa', { saldoHucha: -1234 });
		expect(mensaje.texto).toContain('12,34');
		expect(mensaje.enlace).toBe('/admin/control');
	});

	it('deuda: muestra saldo y límite y enlaza a saldos', () => {
		const mensaje = construirMensaje('deuda', { saldo: -600, limite: -500 });
		expect(mensaje.texto).toContain('6,00');
		expect(mensaje.texto).toContain('5,00');
		expect(mensaje.enlace).toBe('/saldos');
	});

	it('resumen_mensual: título con el mes y enlace a estadísticas', () => {
		const mensaje = construirMensaje('resumen_mensual', { mes: '2026-10', cafes: 12, invitados: 3, saldo: 500 });
		expect(mensaje.titulo).toBe('Resumen de 2026-10');
		expect(mensaje.enlace).toBe('/estadisticas');
	});

	it('fallo_copia: no muestra el identificador de la copia en el texto', () => {
		const mensaje = construirMensaje('fallo_copia', { copiaId: ULID });
		expect(mensaje.texto).not.toContain(ULID);
		expect(mensaje.enlace).toBe('/admin');
	});

	it('rechaza datos con claves extra o con tipos incorrectos', () => {
		expect(() => construirMensaje('hucha_negativa', { saldoHucha: -1, extra: true })).toThrow(ZodError);
		expect(() => construirMensaje('stock_bajo', { tipoCapsulaId: 'no-ulid', nombreTipo: 'Lungo', stock: 1 })).toThrow(ZodError);
		expect(() => construirMensaje('deuda', { saldo: 1.5, limite: -500 })).toThrow(ZodError);
	});

	it('el error de validación no incluye el valor recibido', () => {
		try {
			validarDatos('stock_bajo', { tipoCapsulaId: ULID, nombreTipo: 'Lungo', stock: 'secreto-123' });
			expect.unreachable('debía rechazar el valor');
		} catch (causa) {
			expect(causa).toBeInstanceOf(ZodError);
			expect(JSON.stringify(causa)).not.toContain('secreto-123');
		}
	});
});
