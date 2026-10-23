import type { EnviarPush, SuscripcionEnvio } from '../entrega-push';

// Envío falso para las pruebas (constitución VIII): guarda lo enviado y responde con los códigos configurados, en orden.
// Solo lo importan los `*.test.ts` de `notificaciones`.

export type EnvioFalso = {
	enviar: EnviarPush;
	envios: { endpoint: string; mensaje: string }[];
};

export function crearEnvioFalso(estados: number[] = []): EnvioFalso {
	const envios: { endpoint: string; mensaje: string }[] = [];
	const cola = [...estados];
	return {
		envios,
		enviar: (suscripcion: SuscripcionEnvio, mensaje: string) => {
			envios.push({ endpoint: suscripcion.endpoint, mensaje });
			return Promise.resolve({ estado: cola.shift() ?? 201 });
		},
	};
}
