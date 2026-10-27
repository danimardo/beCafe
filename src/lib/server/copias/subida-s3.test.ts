import { describe, expect, it } from 'vitest';
import { analizarListado } from './subida-s3';

// Plan F14 D1 y research R3: el listado del bucket (RF-253, CA-253).
const objeto = (clave: string, tamano: number, modificada: string) =>
	`<Contents><Key>${clave}</Key><LastModified>${modificada}</LastModified><ETag>"x"</ETag><Size>${tamano}</Size></Contents>`;

describe('listado del bucket (RF-253, CA-253)', () => {
	it('CA-253: devuelve las copias de la más reciente a la más antigua y marca las de resguardo', () => {
		const xml = `<ListBucketResult>
			${objeto('becafe/2026/10/becafe-2026-10-24T01-00-00.000Z.tar.gz', 1200, '2026-10-24T01:00:05.000Z')}
			${objeto('becafe/resguardos/2026/10/becafe-2026-10-26T10-00-00.000Z.tar.gz', 3000, '2026-10-26T10:00:05.000Z')}
			${objeto('becafe/2026/10/becafe-2026-10-25T01-00-00.000Z.tar.gz', 1500, '2026-10-25T01:00:05.000Z')}
		</ListBucketResult>`;

		const copias = analizarListado(xml);

		expect(copias.map((copia) => [copia.tamano, copia.resguardo])).toEqual([
			[3000, true],
			[1500, false],
			[1200, false],
		]);
	});

	it('CA-289: la lista trae el origen y el tipo de cada copia; las anteriores a F17 no tienen origen', () => {
		const xml = `<ListBucketResult>
			${objeto('becafe/2026/10/becafe-2026-10-27T03-00-00.000Z__becafe.mardomingo.com__manual.tar.gz', 10, '2026-10-27T03:00:05.000Z')}
			${objeto('becafe/2026/10/becafe-2026-10-26T03-00-00.000Z__local__diaria.tar.gz', 20, '2026-10-26T03:00:05.000Z')}
			${objeto('becafe/2026/10/becafe-2026-10-25T03-00-00.000Z.tar.gz', 30, '2026-10-25T03:00:05.000Z')}
		</ListBucketResult>`;

		expect(analizarListado(xml).map((copia) => [copia.origen, copia.tipo])).toEqual([
			['becafe.mardomingo.com', 'manual'],
			['local', 'diaria'],
			[null, 'diaria'],
		]);
	});

	it('ignora lo que no es una copia o no tiene datos válidos', () => {
		const xml = `<ListBucketResult>
			${objeto('becafe/', 0, '2026-10-24T01:00:05.000Z')}
			${objeto('becafe/notas.txt', 10, '2026-10-24T01:00:05.000Z')}
			${objeto('otra/carpeta/becafe.tar.gz', 10, '2026-10-24T01:00:05.000Z')}
			<Contents><Key>becafe/2026/10/sin-fecha.tar.gz</Key><Size>5</Size></Contents>
			${objeto('becafe/2026/10/becafe-valida.tar.gz', 7, '2026-10-24T01:00:05.000Z')}
		</ListBucketResult>`;

		expect(analizarListado(xml).map((copia) => copia.clave)).toEqual(['becafe/2026/10/becafe-valida.tar.gz']);
	});

	it('CA-253: muestra como máximo las 30 copias más recientes', () => {
		const xml = Array.from({ length: 35 }, (_, i) =>
			objeto(`becafe/2026/10/becafe-${i}.tar.gz`, i + 1, new Date(Date.UTC(2026, 9, 1 + i, 1)).toISOString()),
		).join('');

		const copias = analizarListado(`<ListBucketResult>${xml}</ListBucketResult>`);

		expect(copias).toHaveLength(30);
		expect(copias[0]?.tamano).toBe(35);
	});

	it('un listado vacío o con otra forma no da copias ni falla', () => {
		expect(analizarListado('<ListBucketResult></ListBucketResult>')).toEqual([]);
		expect(analizarListado('no es xml')).toEqual([]);
	});
});
