import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import {
	abrirVisita,
	crearEnlaceVisitante,
	eliminarNombreVisita,
	leerVisitas,
	listarEnlacesVisitante,
	resolverVisita,
	revocarEnlaceVisitante,
	validarEnlaceVisitante,
	VIGENCIA_ENLACE_VISITANTE_MS,
} from './visitantes';
import { enlaceVisitante, visita } from './esquema';
import { crearPersona } from './pruebas/persona';
import type { Actor } from './actor';
import { registroAuditoria } from '#lib/server/usuarios';
import { ErrorDeNegocio, crearEntornoPrueba, type EntornoPrueba } from '#lib/server/plataforma';

// Enlaces de visitante y visitas (plan F10 D1; RF-189, RF-190, RF-210).
function actorDe(id: string, rol: Actor['rol']): Actor {
	return { usuarioId: id, rol, autenticadoEn: '2026-10-21T09:00:00.000Z', sesionIdHash: 'h' };
}

describe('enlaces de visitante (CA-189, CA-190, CA-210)', () => {
	let entorno: EntornoPrueba;
	let ana: Actor;
	let luis: Actor;
	let admin: Actor;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
		ana = actorDe(crearPersona(entorno.ambiente, { correo: 'ana@ejemplo.es' }).id, 'miembro');
		luis = actorDe(crearPersona(entorno.ambiente, { correo: 'luis@ejemplo.es' }).id, 'miembro');
		admin = actorDe(crearPersona(entorno.ambiente, { correo: 'admin@ejemplo.es', rol: 'administrador' }).id, 'administrador');
	});

	afterEach(() => entorno.cerrar());

	it('CA-189: un miembro crea un enlace de 24 h y la base no guarda el token en claro', () => {
		const { enlaceId, token, expiraEn } = crearEnlaceVisitante(entorno.ambiente, ana);

		const fila = entorno.ambiente.db.select().from(enlaceVisitante).where(eq(enlaceVisitante.id, enlaceId)).get();
		expect(fila?.tokenHash).not.toBe(token);
		expect(JSON.stringify(fila)).not.toContain(token);
		expect(Date.parse(expiraEn) - Date.parse(entorno.reloj.ahora())).toBe(VIGENCIA_ENLACE_VISITANTE_MS);
		expect(validarEnlaceVisitante(entorno.ambiente.db, token, entorno.reloj.ahora())).toMatchObject({ valido: true, enlaceId });
	});

	it('CA-189: cada miembro ve sus enlaces vigentes y un administrador los ve todos', () => {
		crearEnlaceVisitante(entorno.ambiente, ana);
		crearEnlaceVisitante(entorno.ambiente, luis);
		const ahora = entorno.reloj.ahora();

		expect(listarEnlacesVisitante(entorno.ambiente.db, ana, ahora)).toHaveLength(1);
		expect(listarEnlacesVisitante(entorno.ambiente.db, admin, ahora)).toHaveLength(2);
	});

	it('CA-189: un miembro no revoca el enlace de otro; su creador y un administrador sí', () => {
		const deAna = crearEnlaceVisitante(entorno.ambiente, ana);
		const otro = crearEnlaceVisitante(entorno.ambiente, ana);

		expect(() => revocarEnlaceVisitante(entorno.ambiente, luis, deAna.enlaceId)).toThrow(ErrorDeNegocio);
		revocarEnlaceVisitante(entorno.ambiente, ana, deAna.enlaceId);
		revocarEnlaceVisitante(entorno.ambiente, admin, otro.enlaceId);

		const ahora = entorno.reloj.ahora();
		expect(validarEnlaceVisitante(entorno.ambiente.db, deAna.token, ahora)).toEqual({ valido: false, motivo: 'revocado' });
		expect(validarEnlaceVisitante(entorno.ambiente.db, otro.token, ahora)).toEqual({ valido: false, motivo: 'revocado' });
		expect(listarEnlacesVisitante(entorno.ambiente.db, ana, ahora)).toEqual([]);
	});

	it('CA-190: el visitante abre una visita con su nombre y la cookie se resuelve mientras el enlace está vigente', () => {
		const { token } = crearEnlaceVisitante(entorno.ambiente, ana);
		const { tokenVisita, visitaId } = abrirVisita(entorno.ambiente, token, '  Marta  ');

		expect(resolverVisita(entorno.ambiente.db, tokenVisita, entorno.reloj.ahora())).toMatchObject({ id: visitaId, nombre: 'Marta' });
		const fila = entorno.ambiente.db.select().from(visita).where(eq(visita.id, visitaId)).get();
		expect(fila?.tokenHash).not.toBe(tokenVisita);
	});

	it('CA-190: a las 24 h el enlace caduca, no abre visitas y las visitas abiertas dejan de resolverse', () => {
		const { token } = crearEnlaceVisitante(entorno.ambiente, ana);
		const { tokenVisita } = abrirVisita(entorno.ambiente, token, 'Marta');

		entorno.reloj.avanzar(VIGENCIA_ENLACE_VISITANTE_MS);

		expect(validarEnlaceVisitante(entorno.ambiente.db, token, entorno.reloj.ahora())).toEqual({ valido: false, motivo: 'caducado' });
		expect(resolverVisita(entorno.ambiente.db, tokenVisita, entorno.reloj.ahora())).toBeNull();
		expect(() => abrirVisita(entorno.ambiente, token, 'Otra')).toThrow(ErrorDeNegocio);
	});

	it('CA-190: revocar el enlace cierra también las visitas abiertas', () => {
		const { enlaceId, token } = crearEnlaceVisitante(entorno.ambiente, ana);
		const { tokenVisita } = abrirVisita(entorno.ambiente, token, 'Marta');

		revocarEnlaceVisitante(entorno.ambiente, ana, enlaceId);

		expect(resolverVisita(entorno.ambiente.db, tokenVisita, entorno.reloj.ahora())).toBeNull();
	});

	it('CA-190: un token desconocido no abre ninguna visita', () => {
		expect(validarEnlaceVisitante(entorno.ambiente.db, 'desconocido', entorno.reloj.ahora())).toEqual({
			valido: false,
			motivo: 'desconocido',
		});
		expect(resolverVisita(entorno.ambiente.db, 'desconocido', entorno.reloj.ahora())).toBeNull();
	});

	it('CA-210: un administrador elimina el nombre de forma irreversible y la auditoría no lo contiene', () => {
		const { token } = crearEnlaceVisitante(entorno.ambiente, ana);
		const { visitaId } = abrirVisita(entorno.ambiente, token, 'Marta');

		expect(() => eliminarNombreVisita(entorno.ambiente, ana, visitaId)).toThrow(ErrorDeNegocio);
		eliminarNombreVisita(entorno.ambiente, admin, visitaId);
		eliminarNombreVisita(entorno.ambiente, admin, visitaId);

		expect(leerVisitas(entorno.ambiente.db, [visitaId])).toEqual([{ id: visitaId, nombre: null }]);
		const auditoria = entorno.ambiente.db.select().from(registroAuditoria).where(eq(registroAuditoria.objetoId, visitaId)).all();
		expect(auditoria).toHaveLength(1);
		expect(JSON.stringify(auditoria)).not.toContain('Marta');
	});
});
