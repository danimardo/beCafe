import { describe, expect, it } from 'vitest';
import {
	esquemaAnularCafeVisitante,
	esquemaCafeVisitanteForm,
	esquemaEliminarNombre,
	esquemaEntrarVisita,
	esquemaRevisarCafes,
	esquemaTokenVisitante,
	esquemaVistaVisitantes,
} from './visitantes';

const ULID = '01JABCDEFGHJKMNPQRSTVWXYZ0';

describe('contratos de visitantes', () => {
	it('CA-190: el nombre del visitante se recorta y admite de 1 a 60 caracteres; hay que aceptar la privacidad', () => {
		expect(esquemaEntrarVisita.parse({ nombre: '  Marta ', privacidad: 'si' }).nombre).toBe('Marta');
		expect(esquemaEntrarVisita.safeParse({ nombre: '   ', privacidad: 'si' }).success).toBe(false);
		expect(esquemaEntrarVisita.safeParse({ nombre: 'a'.repeat(61), privacidad: 'si' }).success).toBe(false);
		expect(esquemaEntrarVisita.safeParse({ nombre: 'Marta' }).success).toBe(false);
		expect(esquemaEntrarVisita.safeParse({ nombre: 'Marta', privacidad: 'si', extra: '1' }).success).toBe(false);
	});

	it('CA-190: el mensaje de error no incluye el valor recibido', () => {
		const resultado = esquemaEntrarVisita.safeParse({ nombre: 'x'.repeat(70), privacidad: 'si' });
		expect(JSON.stringify(resultado.error?.issues.map((i) => i.message))).not.toContain('xxxx');
	});

	it('CA-189: el token tiene el formato de 32 bytes en base64url', () => {
		expect(esquemaTokenVisitante.safeParse('a'.repeat(43)).success).toBe(true);
		expect(esquemaTokenVisitante.safeParse('a'.repeat(42)).success).toBe(false);
		expect(esquemaTokenVisitante.safeParse(`${'a'.repeat(42)}/`).success).toBe(false);
	});

	it('CA-191: el toque del visitante exige identificadores ULID', () => {
		expect(esquemaCafeVisitanteForm.safeParse({ clienteId: ULID, tipoCapsulaId: ULID }).success).toBe(true);
		expect(esquemaCafeVisitanteForm.safeParse({ clienteId: 'x', tipoCapsulaId: ULID }).success).toBe(false);
	});

	it('CA-193: la revisión admite de 1 a 100 cafés y una decisión válida', () => {
		expect(esquemaRevisarCafes.safeParse({ ids: [ULID], decision: 'aprobar' }).success).toBe(true);
		expect(esquemaRevisarCafes.safeParse({ ids: [], decision: 'aprobar' }).success).toBe(false);
		expect(esquemaRevisarCafes.safeParse({ ids: Array(101).fill(ULID), decision: 'aprobar' }).success).toBe(false);
		expect(esquemaRevisarCafes.safeParse({ ids: [ULID], decision: 'borrar' }).success).toBe(false);
		expect(esquemaAnularCafeVisitante.safeParse({ id: ULID, motivo: ' ' }).success).toBe(false);
	});

	it('CA-210: eliminar el nombre exige confirmación expresa', () => {
		expect(esquemaEliminarNombre.safeParse({ visitaId: ULID }).success).toBe(false);
		expect(esquemaEliminarNombre.safeParse({ visitaId: ULID, confirmar: 'si' }).success).toBe(true);
	});

	it('CA-193: la vista por defecto es la de pendientes', () => {
		expect(esquemaVistaVisitantes.parse({})).toEqual({ vista: 'pendientes', pagina: 1 });
		expect(esquemaVistaVisitantes.safeParse({ vista: 'otra' }).success).toBe(false);
	});
});
