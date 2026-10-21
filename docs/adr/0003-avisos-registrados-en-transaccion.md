# 0003 — Avisos registrados en la transacción del caso de uso y entregados después

- **Estado:** Propuesto (se acepta al autorizar la escritura)
- **Fecha:** 21-10-2026
- **Requisitos relacionados:** RN-072, RN-074, RF-101, RF-103, RF-105, RF-107, RNF-008, RNF-010

## Contexto

Varias operaciones generan avisos: un consumo que deja un tipo en stock bajo o en stock negativo, una compra que deja la hucha en negativo, una copia que falla. Las reglas exigen:

- El aviso de stock bajo se envía **una sola vez** al entrar en stock bajo (RN-072, RF-103). La entrada se decide dentro de la transacción del consumo.
- Un fallo de envío **nunca** bloquea ni deshace el registro, y el envío se reintenta (RF-105, RNF-008).
- Todo aviso aparece también en el panel de la aplicación (RF-107).

Si `economia` llamara al envío push directamente, el envío quedaría dentro de la transacción (prohibido: E/S asíncrona) o fuera (se perdería el aviso si el proceso cae entre la confirmación y el envío). Además, `notificaciones` necesita leer saldos para el recordatorio de deuda, lo que crearía un ciclo `economia ↔ notificaciones`.

## Decisión

1. El caso de uso registra el aviso con `notificaciones.registrarAviso(tx, …)` **dentro de su transacción**. La fila de `notificacion` sirve a la vez de deduplicación, de panel de avisos y de cola de entrega.
2. Una tarea del planificador entrega los avisos pendientes por push, reintenta los fallos y elimina las suscripciones que el servicio da por inexistentes.
3. `notificaciones` no depende de `economia`. Los avisos que necesitan saldos (deuda, resumen mensual) los registra el módulo dueño del dato (`economia`, `estadisticas`).

## Alternativas consideradas

- **Envío directo tras la confirmación.** Más sencillo, pero pierde avisos si el proceso se detiene y obliga a cada ruta a recordar el envío.
- **Bus de eventos en memoria.** Desacopla emisores y receptores, pero añade un mecanismo implícito difícil de descubrir y no resuelve la pérdida de avisos.

## Consecuencias

- La entrega es asíncrona: el push llega con el retraso del intervalo de la tarea. El plan de F5 fija ese intervalo.
- La deduplicación y la entrega se prueban con SQLite real (CA-023, CA-105).
- Un aviso nuevo exige añadir su tipo al catálogo de `notificaciones` (RF-101) y su llamada a `registrarAviso` en el caso de uso dueño.
