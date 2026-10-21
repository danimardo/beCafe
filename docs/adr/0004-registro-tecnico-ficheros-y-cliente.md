# 0004 — Registro técnico en ficheros rotados y registro del cliente enviado al servidor

- **Estado:** Aceptado
- **Fecha:** 21-10-2026
- **Requisitos relacionados:** RNF-014, RF-139, CA-139, RF-140, DEC-067, DEC-076 a DEC-082

## Contexto

RNF-014 pide logs estructurados visibles en Coolify, y `pino` ya es la librería del servidor (DEC-067). Hacen falta dos cosas que la salida estándar no da:

- **Ficheros que un agente de IA pueda leer** para entender por qué falló algo, en desarrollo y en producción. La vista de Coolify no es accesible para un agente.
- **Errores que ocurren en el móvil.** Los fallos de IndexedDB, del service worker o de la suscripción push solo quedan en la consola del navegador, donde nadie los ve.

Un fichero que no rota llenaría el volumen `/data`, que comparte disco con la base de datos.

## Decisión

1. `plataforma/registro.ts` escribe cada evento en la salida estándar y en un fichero JSON diario en el subdirectorio `logs/` del directorio de datos. Usa los transportes de pino: `pino-roll` 4.x (rotación diaria, 30 días) y, solo en desarrollo, `pino-pretty` para la consola.
2. Los ficheros de log no entran en la copia de seguridad ni se muestran en la aplicación. Solo quien administra Coolify los lee.
3. El enlace de RF-139 se escribe con una instancia de pino que solo usa la salida estándar. El fichero recibe el evento sin el enlace.
4. En el cliente, `lib/client/registro.ts` usa `loglevel` 1.x sin guardar el nivel en el navegador. Envía los eventos `warn` y `error` de un catálogo cerrado a `/api/registro-cliente` (sin `/v1`: DEC-100, 21-10-2026; la compatibilidad la da la versión de cada contrato). Este endpoint exige sesión, valida el cuerpo con Zod y limita el tamaño y la frecuencia.

## Alternativas consideradas

- **Fichero solo en desarrollo.** Más simple, pero un agente no podría analizar los errores de producción sin copiar a mano la salida de Coolify.
- **Rotación propia con `croner`.** Evita una dependencia, pero añade unas 40 líneas propias que hay que probar (cambio de día, horario de verano, disco lleno) y que repiten lo que hace `pino-roll`. `pino-roll` lo mantiene la organización de pino.
- **Solo la consola del navegador**, o **ninguna librería en el cliente**. Los errores del móvil seguirían siendo invisibles. `loglevel` es la decisión de partida del prompt de logging, y su única incompatibilidad, que guarda el nivel en `localStorage`, se evita llamando a `setLevel(nivel, false)`.

## Consecuencias

- Tres dependencias nuevas (`pino-roll`, `pino-pretty` en desarrollo y `loglevel`), cada una importada desde un solo archivo. Exigen la enmienda 1.3.0 de la constitución.
- `pino.transport` carga `pino-roll` y `pino-pretty` en tiempo de ejecución, en un hilo aparte. Deben estar en `node_modules` de la imagen; se comprueba en F1 y en la imagen de F7.
- Un endpoint más expuesto a internet. Sus límites (PEND-034) se fijan en el plan de F1.
- Si se pierde el servidor, se pierde el historial de logs. La auditoría de negocio (`registro_auditoria`) y el libro de movimientos están en la base de datos y sí entran en la copia.
