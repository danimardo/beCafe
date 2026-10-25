import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { abrirVisita, crearEnlaceVisitante, resolverVisita, type Actor, type VisitaResuelta } from '#lib/server/auth';
import { contarCafesVisitantePendientes, registrarAportacion, registrarCompra } from '#lib/server/economia';
import { darDeAltaCapsula } from '#lib/server/economia';
import { crearEntornoPrueba, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';

// Café de visitante de un toque (RF-191, CA-191, CA-194).
const INSTANTE = '2026-10-24T09:00:00.000Z';

async function capturar(operacion: () => unknown): Promise<unknown> {
	try {
		return await operacion();
	} catch (causa) {
		return causa;
	}
}

describe('café de visitante', () => {
	let entorno: EntornoPrueba;
	let visita: VisitaResuelta;
	let tipo: string;

	beforeEach(async () => {
		entorno = crearEntornoPrueba(INSTANTE);
		const id = nuevoId();
		crearUsuario(entorno.ambiente.db, { id, nombre: 'Ana', correo: 'ana@ejemplo.es', rol: 'administrador', instante: INSTANTE });
		const admin: Actor = { usuarioId: id, rol: 'administrador', autenticadoEn: INSTANTE, sesionIdHash: 'h' };
		({ id: tipo } = await darDeAltaCapsula(entorno.ambiente, admin, {
			nombre: 'Ristretto',
			marca: 'Marca',
			intensidad: 9,
			color: 'cap-ristretto',
			umbralMinimo: 0,
		}));
		registrarAportacion(entorno.ambiente, admin, { clienteId: nuevoId(), importe: 5000 });
		await registrarCompra(entorno.ambiente, admin, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 10, importe: 400 }],
			confirmoHuchaNegativa: false,
		});
		const { token } = crearEnlaceVisitante(entorno.ambiente, admin);
		const { tokenVisita } = abrirVisita(entorno.ambiente, token, 'Marta');
		const resuelta = resolverVisita(entorno.ambiente.db, tokenVisita, INSTANTE);
		if (!resuelta) throw new Error('La visita de prueba debe resolverse');
		visita = resuelta;
	});

	afterEach(() => entorno.cerrar());

	function evento(locals: Partial<App.Locals>, datos: Record<string, string>) {
		return crearEventoAccion({
			locals: { ambiente: entorno.ambiente, ...locals },
			ruta: '/(visita)/visita',
			params: {},
			cuerpo: new URLSearchParams(datos),
			cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
		});
	}

	it('CA-191: con una visita vigente el café queda pendiente', async () => {
		const resultado = await actions.registrar(evento({ visita }, { clienteId: nuevoId(), tipoCapsulaId: tipo }));

		expect(resultado).toMatchObject({ cafe: { estado: 'pendiente' } });
		expect(contarCafesVisitantePendientes(entorno.ambiente.db)).toBe(1);
	});

	it('CA-194: sin visita la acción redirige a la entrada y no registra nada', async () => {
		const lanzado = await capturar(() => actions.registrar(evento({}, { clienteId: nuevoId(), tipoCapsulaId: tipo })));

		expect(isRedirect(lanzado)).toBe(true);
		expect(contarCafesVisitantePendientes(entorno.ambiente.db)).toBe(0);
	});

	it('CA-191: un tipo desconocido devuelve un fallo con su código', async () => {
		const fallo = desenvolverFallo(await actions.registrar(evento({ visita }, { clienteId: nuevoId(), tipoCapsulaId: nuevoId() })));

		expect(fallo.estado).toBe(400);
		expect(JSON.stringify(fallo.datos)).toContain('TIPO_NO_DISPONIBLE');
	});
});
