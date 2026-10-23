# Implementation Plan: Notificaciones (F5)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md) (aprobada el 2026-10-22)

**Estado**: plan aprobado por la persona usuaria el 2026-10-22, con las decisiones propuestas. Las decisiones están en la sección Clarifications de la spec.

**Artefactos**: decisiones D1 a D14 en este archivo; tablas en [data-model.md](data-model.md); API y rutas en [contracts/api-push.md](contracts/api-push.md) y [contracts/rutas.md](contracts/rutas.md); validación en [quickstart.md](quickstart.md).

**Depende de** F2 (`entrada_stock_bajo`), F4 (`aviso_economia`, saldos, límite de deuda), F3 (consumos, service worker) y F6 (consultas de consumo del mes para el resumen).

## Summary

F5 crea el módulo `notificaciones` y el planificador. Los casos de uso registran cada aviso con `notificaciones.registrarAviso(tx, …)` dentro de su transacción (ADR-0003). Una tarea entrega los avisos pendientes por Web Push cada minuto, con reintentos, y elimina las suscripciones caducadas. Cada aviso aparece también en el panel de la campana durante 30 días.

El recordatorio de deuda (RN-074) usa una función pura de tramos con reloj inyectado. El resumen mensual se ejecuta el día 1 a las 09:00 de Madrid y, si el servidor estaba parado, al arrancar, una sola vez por mes gracias a una tabla de ejecuciones con clave única.

## Technical Context

**Language/Version**: TypeScript 6 estricto; Node 24 LTS.

**Primary Dependencies**: `web-push` 3.x (solo en `notificaciones/entrega-push.ts`) y `croner` 10.x (solo en `plataforma/planificador.ts`). Las dos están en la tabla de tecnologías de la constitución y en `ARCHITECTURE.md` §11; F5 las instala.

**Storage**: SQLite. Migración `0004_f5-notificaciones.sql` (el número sigue a la `0003` condicional de F6; si F6 no la crea, esta es la `0003`): `notificacion`, `entrega_push`, `preferencia_notificacion`, `suscripcion_push` y `ejecucion_tarea`.

**Testing**: Vitest: unidad (tramos de RN-074 con reloj simulado, EV-101; cálculo de la próxima ejecución), integración con SQLite real y un push falso (CA-023, CA-100 a CA-105, RF-107), endpoint con evento falso. Playwright: `/perfil` (preferencias, `sin-js`), `/ayuda` (CA-106, `a11y`), campana y `/avisos`. La entrega push real se revisa a mano en Android e iOS (`docs/pruebas.md` §24).

**Target Platform**: la de la aplicación. Push en Chrome para Android y en Safari para iOS ≥ 16.4 con la PWA instalada.

**Performance Goals**: el registro del aviso no añade más de unas pocas escrituras a la transacción del caso de uso (RNF-002). Entrega en 1 minuto o menos en condiciones normales.

**Constraints**: ningún dato de suscripción en el log (constitución XVI, `redact` de `*.endpoint` y `*.keys` ya configurado); el fallo de push no deshace nada (RNF-008); suscripción push como excepción cerrada a «sin JavaScript» (constitución XVII).

**Scale/Scope**: 30 usuarios, unos pocos dispositivos por persona, decenas de avisos al día.

## Constitution Check

| Principio | Cumplimiento en F5 | Estado |
| --- | --- | --- |
| I. Fuente vigente | Comportamiento de la spec y de RN-072/RN-074. Valores no fijados por la spec en D14 | Cumple, con D14 pendiente |
| II. Complejidad | Dos tareas nuevas (entrega y recordatorio) y la del resumen, cada una con su problema. Tabla `entrega_push` y `ejecucion_tarea` justificadas en Complexity Tracking | Cumple |
| III. Separación | `notificaciones` no depende de `economia` (ADR-0003). Los tramos son una función pura | Cumple |
| IV. Integridad | El aviso se registra en la transacción del registro; su entrega va fuera | Cumple |
| V. Fechas | Horas de tareas en `Europe/Madrid`; instantes en UTC | Cumple |
| VI. Validación | Cuerpo de la suscripción con `z.strictObject`; datos del aviso validados al leer | Cumple |
| X. Usabilidad | Interruptores que guardan al pulsarlos; deuda bloqueada y visible; ayuda de instalación | Cumple |
| XI. Accesibilidad | `Switch` con nombre; contador de la campana en texto accesible; axe en `/perfil`, `/ayuda` y `/avisos` | Cumple |
| XIII. Avisos | El fallo de push no bloquea ni deshace (RNF-008) | Cumple |
| XVI. Registro | Eventos del catálogo de §9 sin endpoint ni claves | Cumple |
| XVII. SvelteKit | Preferencias y «marcar vistos» con *actions*; `POST/DELETE /api/push/suscripcion` es una excepción permitida | Cumple |

**Resultado:** la puerta se supera.

## Architecture Check (`ARCHITECTURE.md` §15)

1. **Constitución:** sí.
2. **Ubicaciones:** módulo `src/lib/server/notificaciones/` (`index.ts`, `esquema.ts`, `catalogo.ts`, `registrar.ts`, `entregar.ts`, `entrega-push.ts`, `preferencias.ts`, `suscripciones.ts`, `panel.ts`); `lib/shared/deuda/tramos.ts` (tramos de RN-074, puros y compartidos para que la pantalla de configuración de F7 los muestre en vivo); `plataforma/planificador.ts` (`croner`, tabla `ejecucion_tarea`); `economia/recordatorio-deuda.ts`; `estadisticas/resumen-mensual.ts`; `lib/client/push.ts`; `lib/shared/contratos/push.ts`; rutas `(app)/ayuda`, `(app)/avisos`, `api/push/suscripcion`; manejadores `push` y `notificationclick` en `src/service-worker.ts`.
3. **Grafo:** usa aristas ya previstas en §4: `economia → notificaciones`, `estadisticas → notificaciones`, `notificaciones → usuarios`. Sin aristas nuevas.
4. **Reutilización:** `NotificationBell`, `NotificationPanel`, `NotificationItem`, `Switch`, `Section`, `Banner`, `Button`, `EmptyState`.
5. **Piezas nuevas:** módulo `notificaciones` y planificador (previstos en §3); tablas `entrega_push` y `ejecucion_tarea` (Complexity Tracking).
6. **Reglas:** RN-072 (dueño `economia`, ya en F2: la transición crea la entrada y ahora también el aviso), RN-074 (tramos en `lib/shared/deuda/tramos.ts`, tarea en `economia`). Cada una con prueba.
7. **Repetición y fallos:** el aviso queda en la transacción; la entrega es idempotente por `entrega_push` (estado por suscripción); la tarea del resumen no se duplica por la clave única de `ejecucion_tarea`; un proceso que cae a mitad de una entrega reintenta en el siguiente minuto (un push puede llegar dos veces en ese caso, D6).
8. **Fuentes:** la spec y RN-074. El diseño §7.1 («se marcan leídos al abrir») y §7.11 (avisos de administración en el perfil) se adoptan.
9. **Autorización:** el panel y las preferencias son de la propia persona; las preferencias de administración solo se muestran y se aceptan con rol administrador (CA-101). La suscripción exige sesión. Rutas nuevas en EV-050: `/ayuda`, `/avisos`, `POST/DELETE /api/push/suscripcion`.
10. **Afectados:** F2 y F3 (stock bajo y stock negativo pasan a llamar a `registrarAviso`), F4 (hucha negativa y deuda), F6 (consultas del resumen), F7 (fallo de copia, pantalla del límite), F8 (aguador en el resumen).
11. **Migraciones:** una, solo de avance. No convierte los registros previos de `entrada_stock_bajo` ni de `aviso_economia` en notificaciones: no hay datos de producción antes de F7 (D3).
12. **Datos y formularios:** preferencias y «marcar vistos» con `<form method="post">`; la suscripción push necesita JavaScript (excepción cerrada).
13. **Eventos:** los de `ARCHITECTURE.md` §9 (`aviso.registrado`, `push.enviado`, `push.fallido`, `push.suscripcion_caducada`, `push.reintentos_agotados`, `tarea.*`). Nuevo: `push.suscripcion_registrada` (info).
14. **Pantallas:** estados en [contracts/rutas.md](contracts/rutas.md).

## Decisiones

### D1. Catálogo (RF-101)

`notificaciones/catalogo.ts` (constante congelada):

| Tipo | Destinatarios | Desactivable | Origen |
| --- | --- | --- | --- |
| `stock_bajo` | Miembros activos | Sí | `economia`, transición a stock bajo (F2) |
| `deuda` | La persona | **No** (RF-102) | `economia`, transición y recordatorio (D7) |
| `resumen_mensual` | La persona | Sí | `estadisticas`, tarea del día 1 (D8) |
| `stock_negativo` | Administradores | Sí | `economia`, consumo con stock ≤ 0 (F3) |
| `hucha_negativa` | Administradores | Sí | `economia`, compra o devolución por baja (F4) |
| `fallo_copia` | Administradores | Sí | `copias` (F7) |

Cada tipo tiene un esquema Zod de sus datos (por ejemplo, `{ tipoCapsulaId, nombreTipo, stock }`) y una función que construye el título, el texto y el enlace desde `lib/shared/textos.ts`. El texto se construye al mostrar y al enviar, no se guarda.

### D2. Registro de un aviso (ADR-0003, RF-103)

`registrarAviso(tx, { tipo, destinatario, datos, origen })`, síncrono, dentro de la transacción del caso de uso:

1. Resuelve los destinatarios con `usuarios` (activos; con rol administrador si el tipo lo exige). Las personas de baja no reciben nada (RN-051).
2. Inserta una fila de `notificacion` por destinatario. Esa fila sirve para el panel y para la deduplicación de RN-074.
3. Si la preferencia del tipo está activada (o el tipo no es desactivable), inserta una fila de `entrega_push` por cada suscripción **existente** de esa persona, en estado `pendiente`. Un dispositivo suscrito después no recibe avisos pasados (Clarifications 3).
4. Registra `aviso.registrado` (tipo y número de destinatarios).

La deduplicación de RN-072 ya la da `entrada_stock_bajo` (solo se crea en la transición). F5 añade la llamada a `registrarAviso` en el mismo punto, y en los puntos de `aviso_economia` de F3 y F4.

### D3. Tablas transitorias de F2 y F4

`entrada_stock_bajo` y `aviso_economia` siguen como registro de origen en `economia` y la notificación guarda su id en `origen`. La migración no crea notificaciones para registros anteriores a F5: no hay producción antes de F7.

### D4. Preferencias (RF-102, CA-102)

- `preferencia_notificacion (usuario_id, tipo, activada)`. Sin fila: activada (valor por defecto de cada tipo desactivable; D14-1). `deuda` no se guarda: siempre activada.
- `/perfil`, sección «Notificaciones»: un `Switch` por tipo. Los administradores ven además el subgrupo «Avisos de administración» (diseño §7.11). El interruptor de deuda aparece activado, deshabilitado y con el texto «Siempre activado» (CA-102).
- **Sin JavaScript y sin botón «Guardar»:** cada interruptor es un botón de envío (`role="switch"`, `aria-checked`) de un formulario `?/preferencia` con `tipo` y `activada`. Con `use:enhance` no recarga ni pierde el foco. Así se guarda al pulsar, como pide el diseño, sin `requestSubmit()`.
- La *action* rechaza un tipo de administración si la persona no es administradora y el tipo `deuda` siempre.
- La preferencia afecta al push. El panel muestra todos los avisos de la persona (D14-2).

### D5. Suscripción push (RF-100, CA-100)

- `lib/client/push.ts`: comprueba el soporte (`PushManager`, service worker), pide el permiso **solo** tras pulsar «Activar notificaciones» (en `/ayuda` y en `/perfil`), se suscribe con la clave pública VAPID y envía la suscripción a `POST /api/push/suscripcion`. «Desactivar en este dispositivo» llama a `unsubscribe()` y a `DELETE`.
- Estado visible en `/perfil` y `/ayuda`: no compatible, permiso denegado (con la explicación y el enlace a `/ayuda`), activado en este dispositivo, sin activar.
- Servidor: `suscripciones.registrar(actor, datos)` hace *upsert* por `endpoint` (único). Si el endpoint ya era de otra persona (dispositivo compartido), pasa a la persona con sesión. Sin permiso concedido no hay suscripción y no se intenta ningún push (CA-100).
- Entorno: `VAPID_PUBLIC_KEY` (pública, también expuesta como `PUBLIC_VAPID_KEY` vía `lib/client/entorno.ts`), `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` (`mailto:` o URL) en `src/env.ts`, obligatorias en producción. `scripts/` incluye un comando para generar el par de claves. Ninguna clave en el repositorio.

### D6. Entrega con reintentos (RF-105, CA-105, RNF-008)

- Tarea `notificaciones.entregarPendientes` cada minuto. Lee las entregas `pendiente` con `proximo_intento <= ahora`, fuera de cualquier transacción, y envía con `entrega-push.ts` (`web-push`, TTL de 24 h, `urgency: 'normal'`).
- Resultado por entrega:
  - 2xx: `enviada`; `push.enviado` (debug).
  - 404 o 410: borra la suscripción y sus entregas pendientes; `push.suscripcion_caducada` (info).
  - Otro error o tiempo agotado (10 s): `intentos + 1` y `proximo_intento` con espera creciente de 1, 5, 30, 120 y 720 minutos. Tras 5 intentos fallidos, `agotada`; `push.reintentos_agotados` (error). Cada fallo, `push.fallido` (warn) con el código HTTP, sin endpoint ni cuerpo.
  - Una entrega con más de 24 h se marca `caducada` sin enviarla (el aviso sigue en el panel).
- La tarea no se solapa consigo misma (`protect` de `croner`). Si el proceso cae tras enviar y antes de marcar, el push se repite una vez: se acepta (el panel no se duplica).
- **Doble de pruebas:** `arranque.ts` recibe la función de envío por parámetro; las pruebas inyectan un push falso que guarda los envíos y puede responder 201, 410 o 500. Sin variable de entorno que lo active en producción (`docs/pruebas.md` §24).

### D7. Aviso y recordatorio de deuda (RN-074, CA-074, EV-101)

- **Tramos** (`lib/shared/deuda/tramos.ts`, puro; en `lib/shared` y no en `notificaciones/dominio` porque F7 los muestra en vivo en el navegador): `intervaloRecordatorio(saldo, limite)` devuelve `null` si `saldo >= limite`; 7 días si `saldo < limite`; 3 si `saldo < 2 × limite`; 1 si `saldo < 4 × limite`. `tocaRecordatorio({ saldo, limite, ultimoEnvio, hoy })` compara **días naturales de Madrid** desde el último aviso de deuda.
- **Aviso al bajar:** `economia` anota los movimientos de cada registro en un único punto (el libro). Tras anotarlos, para cada persona afectada compara el saldo anterior y el nuevo con el límite; si cruza de `>= L` a `< L`, llama a `registrarAviso(tx, deuda)` en la misma transacción. Una nueva bajada tras volver al límite genera así un aviso nuevo (RN-074).
- **Recordatorio:** tarea diaria `economia.recordarDeudas` a las 09:00 de Madrid (D14-3). Para cada persona activa con `saldo < L`, si `tocaRecordatorio` con su último aviso `deuda`, registra un aviso nuevo. El intervalo cuenta desde el último aviso: subir de tramo no envía en el momento (CA-074, punto 2). Un cambio de límite (F7) se aplica en la siguiente ejecución (CA-074, punto 3).
- **Ejemplo de CA-074:** recordatorio el lunes con −6 €; el miércoles baja a −12 € (tramo de 3 días); el jueves (tercer día natural) recibe el siguiente.

### D8. Resumen mensual (RF-104, CA-104)

- Tarea `estadisticas.enviarResumenMensual` el día 1 a las 09:00 de Madrid (`croner` con `timezone: 'Europe/Madrid'`, correcto en los cambios de horario).
- En una transacción síncrona: inserta `ejecucion_tarea ('resumen_mensual', 'AAAA-MM')` (clave primaria; si ya existe, termina sin hacer nada) y, para cada miembro activo, registra un aviso `resumen_mensual` con los cafés del mes anterior (propios e invitados, consultas de F6) y el saldo actual. La preferencia se aplica en D2 (solo afecta al push).
- **Arranque tras una caída** (Clarifications 2): `arranque.ts` llama a `planificador.recuperar()`, que ejecuta cada tarea con periodo cuyo instante programado del periodo actual ya pasó y no tiene fila en `ejecucion_tarea`. Solo se recupera el último periodo; no se acumulan meses. Dos arranques seguidos no duplican: la clave primaria lo impide.
- El recordatorio de deuda usa el mismo mecanismo con periodo `AAAA-MM-DD`.
- F8 añade el aguador del mes al resumen (los datos del tipo admiten el campo opcional desde F5).

### D9. Panel de avisos (RF-107, CA-021, diseño §7.1)

- `NotificationBell` en `PageHeader` con el número de avisos sin ver («3 avisos nuevos» como nombre accesible).
- **Sin JavaScript:** la campana es un formulario `POST /avisos?/abrir` que marca como vistos los avisos de la persona y redirige a `/avisos` (página con la lista). **Con JavaScript:** el mismo formulario con `use:enhance` abre el `NotificationPanel` (`Sheet`) con los datos devueltos y actualiza el contador; no hay `fetch` manual.
- Contenido: avisos de los últimos 30 días, «Nuevos · N» arriba (los no vistos antes de abrir) y «Anteriores» debajo; pie «Ajustar qué avisos recibo» → `/perfil`. Nadie tiene que descartarlos (Clarifications 1).
- El estado actual (stock bajo, hucha, deudores) sigue en el `AlertsPanel` de la página de inicio (F2 y F4).
- **Limpieza:** la tarea de entrega borra una vez al día las notificaciones con más de 30 días y sus entregas. RN-074 solo necesita el último aviso de deuda de los últimos 7 días.

### D10. Service worker

`src/service-worker.ts` (de F3) añade `push` (muestra la notificación con título, texto, icono y `tag` por tipo para no apilar avisos de stock del mismo tipo) y `notificationclick` (abre o enfoca la ventana en el enlace del aviso, que es una ruta de la propia aplicación). El cuerpo del push se valida con su esquema antes de mostrarse.

### D11. Ayuda de instalación (`/ayuda`, RF-106, CA-106)

Página estática con sesión: `Banner info` «En iPhone y iPad hace falta instalarla primero», pasos para Android (Chrome: menú → «Instalar aplicación») y para iPhone o iPad (Safari: Compartir → «Añadir a pantalla de inicio», iOS 16.4 o posterior), y el botón «Activar notificaciones» (D5), que con JavaScript desactivado no aparece y se sustituye por el texto «Activa JavaScript para recibir avisos en este dispositivo». Textos en `textos.ts`.

### D12. Personas de baja (RN-051)

`usuarios.marcarBaja` (F4) llama a `notificaciones.retirarPersona(tx, usuarioId)`: borra sus suscripciones y sus entregas pendientes. Sus notificaciones se borran con la limpieza de los 30 días.

### D13. Registro técnico

Eventos del catálogo de `notificaciones` y de tareas (§9). `push.fallido` lleva `entregaId`, `codigoHttp` e `intento`; nunca el endpoint, las claves ni el contenido. Cada ejecución de tarea abre su `operacionId` en el planificador.

### D14. Decisiones de la persona usuaria

1. **Preferencias por defecto.** Todos los tipos desactivables empiezan activados para quien activa las notificaciones.
2. **Preferencia desactivada.** Afecta solo al push: el aviso aparece igualmente en el panel (RF-107: «todas las notificaciones»).
3. **Hora del recordatorio de deuda.** Una vez al día, a las 09:00 de Madrid. El aviso al cruzar el límite es inmediato (en la transacción).
4. **Días naturales.** «Cada 3 días» se cuenta en días naturales de Madrid desde el día del último aviso (aviso el lunes → siguiente el jueves).
5. **Reintentos.** 5 intentos con esperas de 1, 5, 30, 120 y 720 minutos; un aviso con más de 24 h ya no se envía por push (spec, Assumptions: lo fija el plan).
6. **Recuperación de tareas.** Solo el último periodo perdido (si el servidor estuvo parado dos meses, se envía un resumen, el del último mes).
7. **«Vistos» al abrir el panel** (diseño §7.1). No es un descarte: el aviso sigue visible 30 días.

## Pruebas

| Regla o escenario | Nivel | Archivo previsto |
| --- | --- | --- |
| EV-101, CA-074 (tramos, cambio de tramo, cambio de límite) | Unidad con reloj simulado + StrykerJS | `lib/shared/deuda/tramos.test.ts` |
| RN-074 (aviso al cruzar, nueva bajada) | Integración | `economia/recordatorio-deuda.test.ts` |
| CA-100, CA-101 (sin suscripción; miembro y `stock_negativo`) | Integración con push falso | `notificaciones/registrar.test.ts` |
| CA-102 (preferencia; deuda no desactivable) | Integración + E2E + `sin-js` | `notificaciones/preferencias.test.ts`, `e2e/flujos/perfil-notificaciones.spec.ts` |
| CA-023 (una entrada, tres consumos, salida, nueva entrada) | Integración | `economia/consumos.test.ts` (amplía F3) |
| CA-017, CA-043 (push a administradores) | Integración con push falso | `notificaciones/entregar.test.ts` |
| CA-104 (día 1, caída, doble arranque, cambio de horario) | Integración con reloj simulado | `estadisticas/resumen-mensual.test.ts`, `plataforma/planificador.test.ts` |
| CA-105, RNF-008 (push con error, 410) | Integración con push falso | `notificaciones/entregar.test.ts` |
| RF-107, CA-021 (29 y 31 días; vistos) | Integración + E2E | `notificaciones/panel.test.ts`, `e2e/flujos/avisos.spec.ts` |
| CA-106 | E2E + `a11y` | `e2e/flujos/ayuda.spec.ts` |
| Endpoint de suscripción (401, 400, clave extra, *upsert*) | Ruta con evento falso | `src/routes/api/push/suscripcion/server.test.ts` |
| Eventos sin datos de suscripción | Registrador falso | `notificaciones/entregar.test.ts` |
| Entrega real en Android e iOS | Manual | Lista de `quickstart.md` |

## Lotes de implementación (orientativo)

| Lote | Contenido | CA/EV | Cierre |
| --- | --- | --- | --- |
| F5-L1 Planificador | `croner`, `planificador.ts`, `ejecucion_tarea`, recuperación al arrancar | CA-104 (parte) | `test:changed` + `verify` (migración, `plataforma/`) |
| F5-L2 Módulo y registro | Migración, catálogo, `registrarAviso`, preferencias, llamadas desde `economia` | CA-023, CA-100, CA-101, CA-017, CA-043 | `test:changed` |
| F5-L3 Entrega | `web-push`, VAPID en `env.ts`, entrega con reintentos, push falso | CA-105, RNF-008 | `verify` (entorno) |
| F5-L4 Deuda | Tramos, aviso al cruzar, tarea diaria | CA-074, EV-101 | `test:changed` + Stryker |
| F5-L5 Resumen | Tarea del día 1 | CA-104 | `test:changed` |
| F5-L6 Cliente | Suscripción, service worker, `/ayuda`, `/perfil`, campana, `/avisos` | CA-102, CA-106, CA-021 | E2E, `sin-js`, `a11y`, `acceso` |
| F5-L7 Cierre | `ARCHITECTURE.md`, `.env.example`, revisión manual en móviles, benchmark | Todos | `verify` + benchmark |

## Cambios en otros documentos

| Documento | Cambio | Lote |
| --- | --- | --- |
| `ARCHITECTURE.md` | §3: tablas de `notificaciones` con `entrega_push`; `plataforma` posee `ejecucion_tarea`. §9: `push.suscripcion_registrada`. §8: variables VAPID. §3: los tramos de RN-074 pasan de `notificaciones/dominio` a `lib/shared/deuda/tramos.ts` | F5-L7 |
| `docs/pruebas.md` | §24: decisión del push falso por inyección resuelta | F5-L3 |
| `docs/diseno/screen-layouts.md` | §2.5: guardar los interruptores con botones de envío; retirar «guardar el tema en la cuenta» (contradice la constitución V) | F5-L7 |
| `specs/006-notificaciones/spec.md` | Clarifications con las decisiones de D14 aprobadas | Antes de `tasks.md` |
| `historias.md` §10.4 | Tablas `entrega_push` y `ejecucion_tarea`. Solo con autorización y CAMBIO-NNN, con respaldo | Pendiente de autorización |

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Push poco fiable en iPhone sin instalar | Panel de avisos y `/ayuda` (RF-106, RF-107) |
| Un push duplicado si el proceso cae a mitad de la entrega | Aceptado (D6); el panel no se duplica |
| Fuga del endpoint en el log | Catálogo tipado sin esos campos y `redact`; prueba con el registrador falso |
| Resumen duplicado por dos arranques | Clave primaria de `ejecucion_tarea` en la misma transacción que los avisos |
| Recordatorio a destiempo por el cambio de horario | Días naturales de Madrid; prueba con fechas de marzo y octubre |

## Complexity Tracking

| Pieza | Problema concreto | Alternativa más simple descartada porque… |
| --- | --- | --- |
| Tabla `entrega_push` | Reintentar solo en el dispositivo que falló y no enviar avisos pasados a un dispositivo nuevo | El estado en `notificacion` reenviaría a todos los dispositivos en cada reintento |
| Tabla `ejecucion_tarea` | Resumen una sola vez por mes, también tras una caída o dos arranques (Clarifications 2) | Calcularlo desde `notificacion` falla si en un mes no hay ningún destinatario |
| Tarea de entrega cada minuto | ADR-0003: el aviso se registra en la transacción y se entrega fuera | El envío directo tras confirmar pierde avisos si el proceso cae |
| Aviso de deuda en el libro de movimientos | Avisar en el momento en que el saldo cruza el límite | Esperar a la tarea diaria retrasa el primer aviso hasta 24 h |
