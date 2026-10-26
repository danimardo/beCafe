import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EstadoMascota, RUTA_SONIDO_CELEBRACION } from './mascota.svelte';

// RF-243, RF-244: el sonido de celebración sigue el interruptor de voz y la locución espera a que termine.

class AudioFalso extends EventTarget {
	static instancias: AudioFalso[] = [];
	pausado = false;
	constructor(readonly src: string) {
		super();
		AudioFalso.instancias.push(this);
	}
	play() {
		return Promise.resolve();
	}
	pause() {
		this.pausado = true;
	}
	terminar() {
		this.dispatchEvent(new Event('ended'));
	}
}

describe('EstadoMascota.celebrar (RF-243, RF-244)', () => {
	let peticiones: string[];
	let original: typeof Audio;

	beforeEach(() => {
		original = globalThis.Audio;
		Object.defineProperty(globalThis, 'Audio', { value: AudioFalso, configurable: true, writable: true });
		AudioFalso.instancias = [];
		peticiones = [];
		// Las pistas de la locución: se anota la ruta y se responde 404, que hace que la locución acabe sin sonar.
		vi.stubGlobal('fetch', (entrada: RequestInfo | URL) => {
			peticiones.push(entrada instanceof Request ? entrada.url : entrada.toString());
			return Promise.resolve(new Response(null, { status: 404 }));
		});
	});

	afterEach(() => {
		Object.defineProperty(globalThis, 'Audio', { value: original, configurable: true, writable: true });
		vi.unstubAllGlobals();
	});

	function mascotaConVoz(): EstadoMascota {
		const estado = new EstadoMascota();
		estado.vozActiva = true;
		return estado;
	}

	it('CA-244: con la voz silenciada no suena nada ni se pide ninguna locución', () => {
		const estado = new EstadoMascota();

		estado.celebrar('registro_01');

		expect(AudioFalso.instancias).toHaveLength(0);
		expect(peticiones).toEqual([]);
	});

	it('CA-244: con Capsulito oculta no suena nada', () => {
		const estado = mascotaConVoz();
		estado.visible = false;

		estado.celebrar('registro_01');

		expect(AudioFalso.instancias).toHaveLength(0);
	});

	it('CA-243: con la voz activa suena el sonido y la locución espera a que termine', () => {
		const estado = mascotaConVoz();

		estado.celebrar('registro_01');

		expect(AudioFalso.instancias.map((a) => a.src)).toEqual([RUTA_SONIDO_CELEBRACION]);
		expect(peticiones).toEqual([]);
		AudioFalso.instancias[0]?.terminar();
		expect(peticiones).toEqual(['/mascota/voces/registro_01.json']);
	});

	it('CA-243: sin frase solo suena el sonido', () => {
		const estado = mascotaConVoz();

		estado.celebrar(null);
		AudioFalso.instancias[0]?.terminar();

		expect(peticiones).toEqual([]);
	});

	it('CA-243: una celebración nueva corta la anterior y la locución de esa no llega a decirse', () => {
		const estado = mascotaConVoz();
		estado.celebrar('registro_01');
		const primero = AudioFalso.instancias[0];

		estado.celebrar('registro_02');

		expect(primero.pausado).toBe(true);
		primero.terminar();
		expect(peticiones).toEqual([]);
		AudioFalso.instancias[1]?.terminar();
		expect(peticiones).toEqual(['/mascota/voces/registro_02.json']);
	});

	it('CA-243: detenerVoz corta también el sonido de la celebración', () => {
		const estado = mascotaConVoz();
		estado.celebrar('registro_01');

		estado.detenerVoz();

		expect(AudioFalso.instancias[0]?.pausado).toBe(true);
		AudioFalso.instancias[0]?.terminar();
		expect(peticiones).toEqual([]);
	});
});
