import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hacerInstantanea } from './instantanea';
import { empaquetar } from './empaquetado';
import { verificarCopia } from './verificacion';
import { crearEntornoPrueba, type EntornoPrueba } from '#lib/server/plataforma';

// Verificación de copias (plan F8 D11, EV-070): una copia real se verifica y una corrupta se rechaza.
const JOURNAL = 'drizzle/meta/_journal.json';
const INSTANTE = '2026-10-23T03:00:00.000Z';

describe('verificar una copia descargada (EV-070, plan F8 D11)', () => {
	let entorno: EntornoPrueba;
	let directorio: string;

	beforeEach(async () => {
		entorno = crearEntornoPrueba(INSTANTE);
		directorio = await mkdtemp(join(tmpdir(), 'becafe-prueba-copia-'));
	});

	afterEach(async () => {
		entorno.cerrar();
		await rm(directorio, { recursive: true, force: true });
	});

	it('una copia íntegra da integridad ok, todas las migraciones y el recuento de personas', async () => {
		const instantanea = join(directorio, 'instantanea.db');
		const archivo = join(directorio, 'copia.tar.gz');
		hacerInstantanea(entorno.ambiente.db, instantanea);
		await empaquetar({ instantanea, directorioFotos: join(directorio, 'sin-fotos'), destino: archivo });

		const resultado = await verificarCopia(archivo, JOURNAL);

		expect(resultado).toMatchObject({ integridad: 'ok', usuarios: 0 });
		expect(resultado.migracionesEsperadas).toBeGreaterThan(0);
		expect(resultado.migracionesAplicadas).toBe(resultado.migracionesEsperadas);
	});

	it('un archivo que no es un .tar.gz se rechaza', async () => {
		const archivo = join(directorio, 'falsa.tar.gz');
		await writeFile(archivo, 'no es un archivo comprimido');

		await expect(verificarCopia(archivo, JOURNAL)).rejects.toThrow();
	});
});
