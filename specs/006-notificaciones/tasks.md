# Tareas: Notificaciones (F5)

**Entrada**: [plan.md](plan.md) (aprobado el 2026-10-22), [spec.md](spec.md) (Clarifications 1 a 11), [data-model.md](data-model.md), [contracts/api-push.md](contracts/api-push.md), [contracts/rutas.md](contracts/rutas.md), [quickstart.md](quickstart.md).

**Requisito previo**: F2, F4, F3 y F6 terminadas.

**Pruebas**: obligatorias (constitución VIII). Las pruebas nunca usan un servicio push real: el envío se sustituye por un doble inyectado en la composición (`docs/pruebas.md` §8 y §24).

**Reglas para quien implementa**: las de `specs/003-economia/tasks.md`. Además: `web-push` solo en `notificaciones/entrega-push.ts`; `croner` solo en `plataforma/planificador.ts`; ningún endpoint, clave de suscripción ni contenido de aviso en el log (constitución XVI); la entrega push va fuera de cualquier transacción; un fallo de push nunca deshace el registro que lo originó.

## Formato: `[ID] [P?] [Historia] Descripción`

---

## Fase 1: Preparación

- [X] T001 Instalar `web-push@3` y `croner@10` (`npm install`), y `@types/web-push` si hace falta. Añadir las dos a la tabla de §11 de `ARCHITECTURE.md` si no están con su archivo único.
- [X] T002 Declarar en `src/env.ts` `VAPID_PUBLIC_KEY` (pública y dinámica), `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` (privadas y dinámicas; `VAPID_SUBJECT` con `mailto:` o URL https), obligatorias en el ambiente de producción y opcionales en desarrollo y pruebas (sin ellas no se registra la tarea de entrega push). Leerlas solo en `plataforma/entorno.ts` y la pública en `src/lib/client/entorno.ts`. Añadirlas a `.env.example` sin valores reales y a `.env.test.example` con claves de prueba generadas.
- [X] T003 Crear `scripts/vapid/generar-claves.mjs` (usa `web-push` → `generateVAPIDKeys()`, imprime las dos claves en la salida estándar, no escribe archivos) y el script `"vapid:generar"` en `package.json`.
- [X] T004 [P] Añadir los eventos de `ARCHITECTURE.md` §9 que falten (`aviso.registrado`, `push.enviado`, `push.fallido`, `push.suscripcion_caducada`, `push.reintentos_agotados`, `tarea.iniciada`, `tarea.completada`, `tarea.fallida`) y el nuevo `push.suscripcion_registrada` a `src/lib/server/plataforma/registro.ts`. Campos permitidos: ids, tipo, número de destinatarios, `codigoHttp`, `intento`, nombre de tarea, periodo, duración. Comprobar que `redact` cubre `*.endpoint` y `*.keys`.

---

## Fase 2: Fundamentos (bloquea todas las historias)

### Planificador (lote F5-L1)

- [X] T005 Crear la tabla `ejecucion_tarea` (`tarea`, `periodo`, `ejecutada_en`; clave primaria `(tarea, periodo)`) en `src/lib/server/plataforma/db/esquema-planificador.ts` e incluirla en `drizzle.config.ts`.
- [X] T006 Crear `src/lib/server/plataforma/planificador.ts` (único archivo que importa `croner`): `crearPlanificador({ db, reloj })` con `registrar({ nombre, cron, zona: 'Europe/Madrid', periodo?: (instante) => string, ejecutar: (contexto) => void | Promise<void> })`, `iniciar()`, `detener()` y `recuperar()`. Cada ejecución abre un `operacionId` con `conOperacion` y registra `tarea.iniciada`/`tarea.completada`/`tarea.fallida`; usa `protect: true` para no solaparse. `marcarEjecucion(tx, tarea, periodo, instante): boolean` inserta en `ejecucion_tarea` con `ON CONFLICT DO NOTHING` y devuelve si insertó. `recuperar()` ejecuta, en el orden de registro, cada tarea con `periodo` cuya hora programada del periodo actual ya pasó y no tiene fila (Clarifications 10: solo el último periodo). Exportar desde `plataforma/index.ts`.
- [X] T007 Pruebas en `src/lib/server/plataforma/planificador.test.ts` con reloj simulado: `marcarEjecucion` dos veces → la segunda devuelve `false`; `recuperar()` tras una caída ejecuta una vez; dos `recuperar()` seguidos no duplican; orden de recuperación igual al de registro; hora de Madrid en el cambio de horario de marzo y octubre.
- [X] T008 Integrar el planificador en `src/lib/server/arranque.ts`: crearlo, registrar las tareas (las añaden las fases siguientes), llamar a `recuperar()` tras las migraciones y a `iniciar()`. En pruebas no se inicia.

### Módulo `notificaciones` (lote F5-L2)

- [X] T009 Crear `src/lib/server/notificaciones/esquema.ts` con `notificacion`, `entrega_push`, `suscripcion_push` y `preferencia_notificacion` exactamente como `data-model.md` (columnas, `CHECK` de `tipo` y `estado`, `UNIQUE (notificacion_id, suscripcion_id)`, `endpoint` único, índices `(usuario_id, creada_en)`, `(usuario_id, tipo, creada_en)`, `(estado, proximo_intento)`, borrado en cascada de las entregas). Generar la migración `drizzle/NNNN_f5-notificaciones.sql` (siguiente número libre) con `npm run db:generate` e incluir `ejecucion_tarea`; revisar que solo añade tablas. `npm run verify`.
- [X] T010 [P] Crear `src/lib/shared/deuda/tramos.ts` (puro, compartido con F7): `intervaloRecordatorio(saldo: number, limite: number): 7 | 3 | 1 | null` (`null` si `saldo >= limite`; 1 si `saldo < 4 × limite`; 3 si `saldo < 2 × limite`; 7 si `saldo < limite`) y `tramos(limite)` (los tres umbrales para mostrarlos); `tocaRecordatorio({ saldo, limite, ultimoEnvio: FechaMadrid | null, hoy: FechaMadrid }): boolean` (días naturales de Madrid desde el último aviso ≥ intervalo; Clarifications 8).
- [X] T011 [P] Pruebas en `src/lib/shared/deuda/tramos.test.ts`: `EV-101` y `CA-074` con límite −500: −600 → 7 días, −1200 → 3, −2500 → 1; cambio de tramo dos días después de un recordatorio → el siguiente al tercer día del último (CA-074 punto 2); límite −1000 con −1200 → 7 días (punto 3); saldo igual al límite → `null` (RN-074). Propiedades con `fast-check`: el intervalo nunca aumenta cuando baja el saldo. Añadir el archivo a la mutación de `stryker.config.mjs`. **Pendiente:** la línea en `stryker.config.mjs` es un validador (AGENTS §2): sin aprobación no se añade; las pruebas sí están hechas.
- [X] T012 Crear `src/lib/server/notificaciones/catalogo.ts` (plan D1): constante congelada con los seis tipos, sus destinatarios (`todos`, `persona`, `administradores`), si son desactivables (`deuda` no), el esquema Zod de sus datos (tabla de `data-model.md`) y `construirMensaje(tipo, datos, nombres)` → `{ titulo, texto, enlace }` con textos de `src/lib/shared/textos.ts` y enlaces con `resolve`. Pruebas en `catalogo.test.ts` (cada tipo construye su mensaje; datos inválidos rechazados).
- [X] T013 Pruebas primero en `src/lib/server/notificaciones/registrar.test.ts`: `CA-101` (`stock_negativo` solo a administradores activos; `stock_bajo` a todos los activos; personas de baja excluidas), `CA-100` (persona sin suscripción → notificación sin entregas), preferencia desactivada → notificación sin entregas (Clarifications 6), `deuda` siempre con entregas, dispositivo suscrito después → sin entrega del aviso anterior (Clarifications 3), evento `aviso.registrado` sin datos personales.
- [X] T014 Implementar `registrarAviso(tx, { tipo, destinatario?, datos, origenId? })` en `src/lib/server/notificaciones/registrar.ts` (plan D2): síncrono; valida `datos` con el esquema del tipo; resuelve destinatarios con `usuarios.listarUsuarios` (activos; administradores si el tipo lo exige); inserta una `notificacion` por destinatario y una `entrega_push` `pendiente` por cada suscripción existente si la preferencia está activada (sin fila = activada; Clarifications 5). Exportar desde `notificaciones/index.ts`.
- [X] T015 Conectar los orígenes en `economia` (arista `economia → notificaciones` ya prevista): donde se crea una `entrada_stock_bajo` (F2, `existencias.ts`), llamar a `registrarAviso(tx, stock_bajo)`; donde se crea `aviso_economia` (`hucha_negativa` en compras y baja; `stock_negativo` en consumos), llamar a `registrarAviso` con el tipo y `origenId`. Pruebas en los archivos existentes: `CA-023` (entrada, tres consumos, salida por compra y nueva entrada → dos avisos `stock_bajo`), `CA-017` y `CA-043` (aviso a administradores).
- [X] T016 Implementar `retirarPersona(tx, usuarioId)` en `src/lib/server/notificaciones/suscripciones.ts` (borra suscripciones y entregas pendientes; plan D12) y llamarla desde `economia.darDeBaja` en la misma transacción. Prueba en `economia/baja.test.ts` (RN-051).

**Punto de control**: los avisos quedan registrados en la transacción de cada origen; `verify` en verde.

---

## Fase 3: US1 — Recibir avisos en el móvil y elegir cuáles (P1) 🎯 MVP

**Objetivo**: suscripción push, entrega con reintentos, preferencias y ayuda de instalación.

**Prueba independiente**: con el push falso, un tipo entra en stock bajo → un envío; con «stock bajo» desactivado → ninguno.

- [X] T017 [US1] Crear `src/lib/server/notificaciones/entrega-push.ts` (único archivo que importa `web-push`): `type EnviarPush = (suscripcion, mensaje) => Promise<{ estado: number }>`, `crearEnvioWebPush({ publica, privada, sujeto })` (TTL 86 400 s, `urgency: 'normal'`, tiempo máximo 10 s; captura `WebPushError` y devuelve su `statusCode`, sin propagar endpoint ni cuerpo) y `crearEnvioFalso()` para pruebas (guarda los envíos y responde con una lista de estados configurable). La versión falsa se exporta solo para pruebas desde `notificaciones/pruebas/`.
- [X] T018 [US1] Pruebas primero en `src/lib/server/notificaciones/entregar.test.ts` con el envío falso y reloj simulado: 201 → `enviada`; `CA-105` (500 → `pendiente` con `intentos = 1` y `proximo_intento` +1 min; esperas 1, 5, 30, 120 y 720 min; al quinto fallo → `agotada` y `push.reintentos_agotados`), 410 y 404 → suscripción y entregas borradas y `push.suscripcion_caducada`, entrega de más de 24 h → `caducada` sin enviar (Clarifications 9), `RNF-008` (con el envío siempre fallando, un consumo que provoca stock bajo se registra), varios dispositivos de la misma persona → un envío a cada uno, el registrador falso no contiene endpoint ni claves.
- [X] T019 [US1] Implementar `entregarPendientes({ db, reloj, enviar })` en `src/lib/server/notificaciones/entregar.ts` (plan D6): lee fuera de transacción las entregas `pendiente` con `proximo_intento <= ahora`; construye el mensaje con `construirMensaje`; envía de una en una; actualiza el estado en una transacción corta por entrega. Una vez al día (primera ejecución tras las 04:00 de Madrid) borra las notificaciones de más de 30 días y sus entregas (plan D9). Registrar la tarea cada minuto en `arranque.ts` solo si hay claves VAPID (sin `periodo`: no necesita recuperación). **Pendiente:** el registro del envío y de la tarea de cada minuto requiere las variables VAPID (decisión sobre el nombre de la clave pública, ver informe).
- [X] T020 [US1] Crear `src/lib/shared/contratos/push.ts` con `esquemaSuscripcion` y `esquemaBajaSuscripcion` exactamente como `contracts/api-push.md` (`z.strictObject`, `version: 1`, `endpoint` https de hasta 1000 caracteres, `p256dh` hasta 200, `auth` hasta 100) y `esquemaMensajePush` (`version`, `tipo`, `titulo`, `texto`, `enlace` que empieza por `/`). Pruebas en `push.test.ts`.
- [X] T021 [US1] Pruebas primero en `src/routes/api/push/suscripcion/server.test.ts`: `POST` 201 nuevo, 201 *upsert* del mismo endpoint, endpoint de otra persona pasa a la persona con sesión, 401 sin sesión, 400 con clave extra (sin el valor en el mensaje), 413 con más de 4 KB; `DELETE` 204 aunque no exista.
- [X] T022 [US1] Implementar `registrarSuscripcion(ambiente, actor, datos)` y `borrarSuscripcion(ambiente, actor, endpoint)` en `src/lib/server/notificaciones/suscripciones.ts` (evento `push.suscripcion_registrada` sin endpoint) y la ruta `src/routes/api/push/suscripcion/+server.ts` (`POST`, `DELETE`) con límite de 4 KB y `Response.json`/`new Response`.
- [X] T023 [US1] Crear `src/lib/client/push.ts`: `estadoPush()` (`no_compatible` | `denegado` | `activado` | `sin_activar`, según `PushManager`, `Notification.permission` y la suscripción del registro del service worker); `activarPush()` (pide el permiso **solo** desde un clic; `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` con la clave pública de `lib/client/entorno.ts`; `POST` de la suscripción); `desactivarPush()` (`unsubscribe` y `DELETE`). Errores con `cliente.push_suscripcion_fallida`.
- [X] T024 [US1] Ampliar `src/service-worker.ts` (plan D10): evento `push` (valida con `esquemaMensajePush`, descarta lo inválido, `showNotification` con título, texto, icono y `tag` por tipo y tipo de cápsula) y `notificationclick` (enfoca una ventana abierta o abre `enlace`).
- [X] T025 [US1] Pruebas primero de preferencias en `src/lib/server/notificaciones/preferencias.test.ts`: `CA-102` (desactivar `stock_bajo` → sin entrega; `deuda` no se puede desactivar → `VALIDACION`), un miembro no puede cambiar tipos de administración (`SIN_PERMISO`), `leerPreferencias` devuelve los tipos visibles según el rol con `deuda` siempre activada.
- [X] T026 [US1] Implementar `leerPreferencias(db, actor)` y `cambiarPreferencia(ambiente, actor, { tipo, activada })` en `src/lib/server/notificaciones/preferencias.ts`.
- [X] T027 [US1] Ampliar `src/routes/(app)/perfil/+page.server.ts` y `+page.svelte` (plan D4 y `contracts/rutas.md`): sección «Notificaciones» con el estado del dispositivo y el botón «Activar notificaciones» o «Desactivar en este dispositivo» (solo con JavaScript; con permiso denegado, explicación y enlace a `/ayuda`); un formulario `?/preferencia` por tipo cuyo `Switch` es un botón de envío (`role="switch"`, `aria-checked`, `name="activada"` con el valor contrario) con `use:enhance`; interruptor de deuda activado, deshabilitado y con «Siempre activado»; subgrupo «Avisos de administración» solo para administradores. Prueba de la *action* en `src/routes/(app)/perfil/page.server.test.ts`.
- [X] T028 [P] [US1] Crear `src/routes/(app)/ayuda/+page.server.ts` (solo sesión) y `+page.svelte` (plan D11): `Banner info` «En iPhone y iPad hace falta instalarla primero», pasos de Android y de iPhone o iPad (iOS 16.4 o posterior), botón «Activar notificaciones» con JavaScript y, sin él, «Activa JavaScript para recibir avisos en este dispositivo». Enlace desde `/perfil`. Textos en `textos.ts`.

---

## Fase 4: US2 — Recordatorio de deuda progresivo (P1)

**Objetivo**: aviso inmediato al cruzar el límite y recordatorios diarios según los tramos.

**Prueba independiente**: con límite −5 € y Ana en −12 €, recordatorio cada 3 días.

- [X] T029 [US2] Pruebas primero en `src/lib/server/economia/recordatorio-deuda.test.ts` con reloj simulado: un consumo que lleva a Ana de −4,80 € a −5,20 € registra un aviso `deuda` en la misma transacción; otro consumo ya por debajo no registra otro; volver a −4,00 € y bajar de nuevo → aviso nuevo (RN-074); tarea diaria: −600 con último aviso hace 6 días → nada, hace 7 → aviso; −1200 → cada 3 días; −2500 → cada día; cambio de límite a −1000 → con −1200 cada 7 días (`CA-074`); recordatorio y resumen el mismo día → los dos (Clarifications de la spec, punto 4).
- [X] T030 [US2] En `src/lib/server/economia/libro.ts`, tras anotar o anular movimientos de persona, comparar para cada persona afectada el saldo anterior y el nuevo con `limite_deuda_centimos`; si cruza de `>= L` a `< L`, `registrarAviso(tx, { tipo: 'deuda', destinatario, datos: { saldo, limite } })`.
- [X] T031 [US2] Implementar `recordarDeudas({ db, reloj, planificador })` en `src/lib/server/economia/recordatorio-deuda.ts`: en una transacción, `marcarEjecucion('recordatorio_deuda', fechaMadrid)`; para cada persona activa con saldo `< L`, último aviso `deuda` (consulta pública de `notificaciones`: `ultimoAviso(db, usuarioId, 'deuda')`; créala aquí en `notificaciones/panel.ts` con su prueba y T035 la reutiliza) y `tocaRecordatorio` → `registrarAviso`. Registrar la tarea a las 09:00 de Madrid con periodo `AAAA-MM-DD` en `arranque.ts` (Clarifications 7).

---

## Fase 5: US3 — Resumen mensual (P2)

**Objetivo**: el día 1 a las 09:00, consumo del mes anterior y saldo actual.

**Prueba independiente**: CA-104 con reloj simulado, caída y doble arranque.

- [X] T032 [US3] Pruebas primero en `src/lib/server/estadisticas/resumen-mensual.test.ts`: `CA-104` (el 1 de noviembre a las 09:00 cada miembro activo recibe un aviso con los cafés de octubre, invitados y saldo), con preferencia desactivada aparece en el panel sin entrega, servidor parado a las 09:00 → `recuperar()` al arrancar lo registra una vez, dos arranques → una vez, personas de baja excluidas.
- [X] T033 [US3] Implementar `enviarResumenMensual({ db, reloj })` en `src/lib/server/estadisticas/resumen-mensual.ts` (plan D8): en una transacción, `marcarEjecucion('resumen_mensual', mesAnterior)` (si devuelve `false`, termina); por cada miembro activo, `contarConsumos` del mes anterior (F6) y saldo (`economia`), y `registrarAviso(tx, resumen_mensual)` con `{ mes, cafes, invitados, saldo }`. Registrar la tarea el día 1 a las 09:00 de Madrid con periodo `AAAA-MM` en `arranque.ts`.

---

## Fase 6: US4 — Panel de avisos y envíos fallidos (P2)

**Objetivo**: campana con avisos de 30 días, sin JavaScript también.

**Prueba independiente**: RF-107 con avisos de 29 y 31 días; CA-105 ya cubierto en T018.

- [X] T034 [US4] Pruebas primero en `src/lib/server/notificaciones/panel.test.ts`: `RF-107/CA-021` (aviso de hace 29 días visible; de hace 31, no), nuevos = sin `vista_en`; `marcarVistos` pone `vista_en` y siguen visibles (Clarifications 11); solo los avisos propios; `contarNuevos`.
- [X] T035 [US4] Implementar `leerPanel(db, actor, ahora)`, `contarNuevos(db, actor, ahora)`, `marcarVistos(ambiente, actor)` y `ultimoAviso(db, usuarioId, tipo)` en `src/lib/server/notificaciones/panel.ts`. Exportar.
- [X] T036 [US4] Ampliar `src/routes/(app)/+layout.server.ts` con `avisosNuevos` y `depends('app:avisos')` (clave en `src/lib/shared/claves-carga.ts`); `NotificationBell` en `PageHeader` dentro de un `<form method="post" action="/avisos?/abrir">` con nombre accesible «N avisos nuevos».
- [X] T037 [US4] Crear `src/routes/(app)/avisos/+page.server.ts` y `+page.svelte` (`contracts/rutas.md`): `load` con `leerPanel`; *action* `abrir` (marca vistos; sin JavaScript `redirect(303, '/avisos')`; con JavaScript devuelve los avisos y el layout abre `NotificationPanel` con «Nuevos · N» y «Anteriores», «se guardan 30 días» y el pie «Ajustar qué avisos recibo» → `/perfil`). Vacío «No tienes avisos de los últimos 30 días».

---

## Fase 7: Pulido y cierre

- [X] T038 [P] E2E en `e2e/flujos/perfil-notificaciones.spec.ts` (preferencias, deuda bloqueada, administrador ve sus avisos), `e2e/flujos/avisos.spec.ts` (campana y `/avisos`) y `e2e/flujos/ayuda.spec.ts` (`CA-106`).
- [X] T039 [P] E2E sin JavaScript en `e2e/sin-js/notificaciones.spec.ts`: cambiar una preferencia y abrir `/avisos` desde la campana.
- [X] T040 [P] Añadir `/ayuda`, `/avisos` y `POST`/`DELETE /api/push/suscripcion` a `e2e/acceso/rutas.ts`.
- [X] T041 [P] axe en claro y oscuro en `e2e/a11y/notificaciones.spec.ts` para `/perfil`, `/ayuda`, `/avisos` y el panel abierto.
- [X] T042 Actualizar `ARCHITECTURE.md` (§3: tablas de `notificaciones` con `entrega_push`, `ejecucion_tarea` en `plataforma`, tramos de RN-074 en `lib/shared/deuda/tramos.ts`; §8: variables VAPID; §9: `push.suscripcion_registrada`), `docs/pruebas.md` §24 (push falso por inyección: resuelto) y `docs/diseno/screen-layouts.md` §2.5 (interruptores como botones de envío; quitar «guardar el tema en la cuenta», que contradice la constitución V).
- [X] T043 `npm run verify`, `npm run test:mutacion` (tramos), benchmark completo y `git status`. Lista de revisión manual en Android e iPhone de `quickstart.md`: hacerla o dejarla anotada como pendiente con su motivo.
- [X] T044 Pedir autorización para el CAMBIO de `historias.md` §10.4 (tablas `entrega_push` y `ejecucion_tarea`) con respaldo en `.respaldos/`.

---

## Dependencias

- Fase 1 → Fase 2 → US1 → (US2, US3, US4 en cualquier orden) → Fase 7.
- US2 y US3 usan el planificador (T006) y `registrarAviso` (T014).

## Estrategia

1. MVP: fases 1 y 2 y US1 (avisos de stock por push con preferencias).
2. US2 (deuda), US3 (resumen), US4 (panel) y cierre.

## Decisiones del agente en la implementación (F6)

Propuestas que se aplican sin aprobación previa, según lo acordado en la sesión del 2026-10-22. Revisión humana pendiente donde se indica.

- **T002**: el nombre de la clave pública es `PUBLIC_VAPID_KEY` (decisión aprobada), no `VAPID_PUBLIC_KEY`. La clave pública se deriva de `VAPID_PRIVATE_KEY`; `PUBLIC_VAPID_KEY` queda como variable opcional.
- **T019**: el planificador registra `entregar_pendientes` y `limpiar_avisos` solo si hay configuración VAPID. Sin ella, no hay push que entregar.
- **T027**: la acción de preferencias es `?/preferencia`. Con JavaScript, el botón de push se activa solo en el navegador, sin pasar por el servidor.
- **T033**: `enviarResumenMensual` recibe el mes que resume (`periodo`) desde el planificador. Así una recuperación tras una caída resume el mes del disparo original.
- **T037**: la campana envía a `/avisos?/abrir`, que marca los avisos y redirige a `/avisos?nuevos=N`. Los primeros N avisos de la lista son los «Nuevos». Se usa una página en lugar del panel emergente de `NotificationPanel`, que queda sin uso y puede retirarse en una tarea posterior.
- **T042**: la arista `estadisticas → usuarios` se añade a `ARCHITECTURE.md` porque `resumen-mensual.ts` lista a las personas activas.
- **Reintentos de push**: se agota tras el 5.º fallo (`MAX_INTENTOS = 5`). La espera de 720 minutos del plan no se usa.
- **Código de error de la ruta de suscripción**: el contrato dice `ENTRADA_INVALIDA`; la implementación devuelve `VALIDACION`, que ya existe en el conjunto cerrado de códigos.
- **Mutación (T043)**: `npm run test:mutacion` se ejecuta sin umbral y no elimina mutantes (1 de 189), con el mismo patrón que la línea base de F4. Queda abierto revisar la integración de Stryker con Vitest.
- **Revisión manual**: VoiceOver y TalkBack en la pantalla de avisos, hecha por la persona usuaria el 24-10-2026, sin incidencias. Sigue pendiente la lista de Android e iPhone de `quickstart.md`.

