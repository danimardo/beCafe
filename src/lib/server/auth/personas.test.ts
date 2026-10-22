import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listarPersonas, obtenerPersona } from './personas';
import type { Actor } from './actor';
import { crearPersona, definirContrasena } from './pruebas/persona';
import { crearEntornoPrueba, type EntornoPrueba } from '../plataforma/pruebas/entorno-prueba';
import { RecursoNoEncontrado } from '../plataforma';

// Vista de administración: solo para administradores, sin credenciales (RF-130, RF-134).
const INSTANTE = '2026-10-21T09:00:00.000Z';

describe('listado de personas para administración (RF-130)', () => {
	let entorno: EntornoPrueba;
	let admin: Actor;
	let miembro: Actor;

	beforeEach(async () => {
		entorno = crearEntornoPrueba(INSTANTE);
		const ana = crearPersona(entorno.ambiente, { correo: 'ana@ejemplo.es', rol: 'administrador' });
		await definirContrasena(entorno.ambiente, ana);
		const luis = crearPersona(entorno.ambiente, { correo: 'luis@ejemplo.es', rol: 'miembro' });
		admin = { usuarioId: ana.id, rol: 'administrador', autenticadoEn: INSTANTE, sesionIdHash: 'prueba' };
		miembro = { usuarioId: luis.id, rol: 'miembro', autenticadoEn: INSTANTE, sesionIdHash: 'prueba' };
	});

	afterEach(() => entorno.cerrar());

	it('marca quién tiene contraseña y cuenta los administradores activos', () => {
		crearPersona(entorno.ambiente, { correo: 'pedro@ejemplo.es', rol: 'miembro' });

		const listado = listarPersonas(entorno.ambiente.db, admin);

		expect(listado.administradoresActivos).toBe(1);
		const porCorreo = new Map(listado.personas.map((persona) => [persona.email, persona.tieneContrasena]));
		expect(porCorreo.get('ana@ejemplo.es')).toBe(true);
		expect(porCorreo.get('pedro@ejemplo.es')).toBe(false);
	});

	it('RN-042: con dos administradores activos el recuento llega a dos, para no mostrar el aviso de un solo administrador', () => {
		crearPersona(entorno.ambiente, { correo: 'marta@ejemplo.es', rol: 'administrador' });

		const listado = listarPersonas(entorno.ambiente.db, admin);

		expect(listado.administradoresActivos).toBe(2);
	});

	it('no expone credenciales ni enlaces en la vista', () => {
		const listado = listarPersonas(entorno.ambiente.db, admin);

		expect(JSON.stringify(listado)).not.toContain('hash');
		expect(JSON.stringify(listado)).not.toContain('token');
	});

	it('un miembro no ve el listado: SIN_PERMISO y el intento queda registrado', () => {
		expect(() => listarPersonas(entorno.ambiente.db, miembro)).toThrow('SIN_PERMISO');
		expect(entorno.eventos()).toContainEqual(expect.objectContaining({ codigo: 'auth.permiso_denegado' }));
	});

	it('obtener una persona inexistente no devuelve nada: recurso no encontrado', () => {
		expect(() => obtenerPersona(entorno.ambiente.db, admin, '01ARZ3NDEKTSV4RRFFQ69G5FAV')).toThrow(RecursoNoEncontrado);
	});
});
