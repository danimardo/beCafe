# Tareas: Visitantes, compras rápidas, estadísticas del departamento y ayuda de Capsulito (F10)

**Entrada**: [plan.md](plan.md) (aprobado el 2026-10-24), [spec.md](spec.md) (aprobada el 2026-10-24), [data-model.md](data-model.md), [contracts/formularios.md](contracts/formularios.md), [research.md](research.md) y `historias.md` v0.19.0 (CAMBIO-019).

**Requisito previo**: F1 a F9 terminadas. El bloque 1 de mantenimiento (captura de errores del cliente, bienvenida, voz por defecto, escritorio, color de cápsula, interruptor de avisos) ya está hecho y verificado.

**Pruebas**: obligatorias (constitución VIII). Cada `CA-189` a `CA-210` y `EV-103` a `EV-106` queda cubierto por al menos una prueba que lo cite en su descripción. Las rutas nuevas entran en `acceso` (EV-050) y en `a11y` (claro y oscuro, EV-061).

**Verificación por lote** (AGENTS.md §7): `npm run test:changed`, `npm run lint:changed`, `npm run check` y, si toca interfaz, `npm run test:e2e:quick -- <spec>` con la build reconstruida. `npm run verify` tras la migración, `hooks.server.ts`, `plataforma/` o contratos públicos. No ejecutar lint y pruebas a la vez. Anotar cada ejecución en `.local/verification/runs.jsonl`.

## Formato: `[ID] [P?] [Historia] Descripción`

---

## Fase 1: Preparación

- [X] T001 Instalar `uqr` (`~0.1.3`) con `npm install uqr`, ejecutar `npm audit --omit=dev` y añadir la regla `uqr-solo-en-adaptador` en `.dependency-cruiser.cjs` para que solo `src/lib/server/plataforma/qr.ts` pueda importar `uqr`.
- [X] T002 [P] Crear `src/lib/server/plataforma/qr.ts` con `qrSvg(texto: string): string` (SVG con `fill="currentColor"`, `viewBox`, sin tamaños fijos, `role="img"` lo pone quien lo usa) y exportarlo en `src/lib/server/plataforma/index.ts`. Prueba unitaria en `src/lib/server/plataforma/qr.test.ts`: el SVG empieza por `<svg`, contiene `currentColor` y dos textos distintos dan SVG distintos.

---

## Fase 2: Fundamentos (bloquean todas las historias)

- [X] T003 Añadir en `src/lib/server/auth/esquema.ts` las tablas `enlace_visitante` (`id` PK ULID, `token_hash` único «SHA-256 del token del enlace», `creado_por` → `usuario.id`, `creado_en`, `expira_en` «`creado_en` + 24 h», `revocado_en?`, `revocado_por?` → `usuario.id`) y `visita` (`id` PK, `enlace_id` → `enlace_visitante.id`, `token_hash` único, `nombre?` con `CHECK` «1–60 caracteres sin espacios en los extremos», `nombre_eliminado_en?`, `creada_en`).
- [X] T004 Añadir en `src/lib/server/economia/esquema.ts` la tabla `cafe_visitante` (`id` PK, `cliente_id` único, `visita_id` sin FK entre módulos, `tipo_capsula_id`, `hora_gesto`, `hora_registro`, `estado` con `CHECK IN ('pendiente','aprobado','rechazado','anulado')`, `revisado_por?`, `revisado_en?`, `coste_medio_aplicado?` entero en diezmilésimas, `anulado_por?`, `anulado_en?`, `motivo_anulacion?`) e índice `(estado, hora_registro)`.
- [X] T005 Añadir en `src/lib/server/usuarios/esquema.ts` la columna `usuario.foto_ruta` (text, anulable) y la tabla `preferencia_cuenta` (`usuario_id` → `usuario.id`, `clave` con `CHECK IN ('tour_inicio_visto','instalacion_descartada','oferta_avisos_vista')`, `valor_en`; PK compuesta `(usuario_id, clave)`).
- [X] T006 Añadir en `src/lib/server/notificaciones/esquema.ts` los tipos `cafe_visitante_pendiente` (solo administradores, desactivable) y `aportacion_en_tu_nombre` (desactivable) a `TIPOS_NOTIFICACION` y `TIPOS_DESACTIVABLES`; añadir su esquema de datos (solo identificadores y recuentos, sin nombres) y su mensaje en `src/lib/server/notificaciones/catalogo.ts`; añadir `cafe_visitante_pendiente` a `TIPOS_ADMINISTRACION` en `src/lib/server/notificaciones/preferencias.ts`; textos en `src/lib/shared/textos.ts` (`notificaciones.tipos`). Ampliar `src/lib/server/notificaciones/catalogo.test.ts`.
- [X] T007 Generar la migración con `npm run db:generate` y renombrarla a `drizzle/0007_f10-visitantes.sql`; comprobar que solo contiene `CREATE TABLE`, `CREATE INDEX` y `ALTER TABLE … ADD COLUMN` (constitución XIV) y que `drizzle/meta` queda coherente.
- [X] T008 Añadir los códigos de evento del plan D12 en `src/lib/server/plataforma/registro.ts` (`NIVEL_EVENTO` y `CamposEvento`): `visitante.enlace_creado` `{ enlaceId }`, `visitante.enlace_revocado` `{ enlaceId }`, `visitante.visita_abierta` `{ visitaId, enlaceId }`, `visitante.enlace_no_valido` (warn) `{ motivo }`, `visitante.limite_superado` (warn) `{ visitaId }`, `cafe_visitante.registrado` `{ cafeId, visitaId }`, `cafe_visitante.revisado` `{ decision, cantidad }`, `cafe_visitante.anulado` `{ cafeId }`, `visitante.nombre_eliminado` `{ visitaId }`, `aportacion.en_nombre_de` `{ aportacionId }`, `usuario.foto_cambiada` `{ usuarioId, quitada }`. Añadir los códigos de error `ENLACE_NO_VALIDO`, `LIMITE_SUPERADO`, `YA_REVISADO`, `NO_ANULABLE`, `PERSONA_NO_ACTIVA` y `CONFIRMACION_PENDIENTE` (si faltan) en `src/lib/server/plataforma/errores.ts` con su mensaje en español en `src/lib/shared/textos.ts`. Ampliar `src/lib/server/plataforma/registro.test.ts` para que un campo `nombre` o `token` en estos eventos falle.
- [X] T009 Crear `src/lib/server/usuarios/preferencias-cuenta.ts` con `leerMarcasCuenta(db, usuarioId)` → `{ tourInicioVisto, instalacionDescartada, ofertaAvisosVista }` y `marcarCuenta(ambiente, actor, clave)` idempotente (inserta si no existe). Exportar en `src/lib/server/usuarios/index.ts`. Prueba de integración en `src/lib/server/usuarios/preferencias-cuenta.test.ts` (`CA-204`, `CA-206`, `CA-207`: marcar dos veces deja una fila; otra persona no ve la marca).
- [X] T010 Actualizar `src/lib/server/economia/pruebas/constructores.ts` y la prueba de reconstrucción de stock (INV-02, EV-030) para que el stock esperado reste los `cafe_visitante` en estado `aprobado`. Ejecutar `npm run verify` al cerrar la fase.

**Punto de control**: migración aplicada, catálogos ampliados y `npm run verify` correcto.

---

## Fase 3: Historia 1 — Visitantes con enlace y aprobación (P1) 🎯 MVP

**Objetivo**: un miembro crea un enlace de 24 h con QR; un visitante sin cuenta escribe su nombre y registra cafés pendientes; un administrador los aprueba (stock − 1, sin dinero) o los rechaza.

**Prueba independiente**: quickstart, escenario 1.

### Núcleo

- [X] T011 [US1] Crear `src/lib/server/auth/visitantes.ts` con `crearEnlaceVisitante(ambiente, actor)` → `{ enlaceId, token, expiraEn }` (token de 32 bytes del azar inyectado, base64url; guarda solo SHA-256), `revocarEnlaceVisitante(ambiente, actor, enlaceId)` (creador o administrador, si no `SIN_PERMISO`), `listarEnlacesVisitante(db, actor, ahora)` (los vigentes del actor; todos para un administrador), `abrirVisita(ambiente, token, nombre)` → `{ tokenVisita, visitaId, expiraEn }` (`ENLACE_NO_VALIDO` si caducado o revocado), `resolverVisita(db, tokenCookie, ahora)` → `VisitaResuelta | null` (nulo si el enlace ya no está vigente), `eliminarNombreVisita(ambiente, actor, visitaId)` (administrador; `nombre = NULL`, `nombre_eliminado_en`, auditoría sin nombre) y `leerVisitas(db, ids)` → `{ id, nombre: string | null }[]`. Registrar los eventos de T008. Exportar en `src/lib/server/auth/index.ts`.
- [X] T012 [US1] Pruebas de integración en `src/lib/server/auth/visitantes.test.ts`: `CA-189` (crear y revocar; un miembro no revoca el de otro; un administrador sí), `CA-190` (con reloj simulado, a las 24 h el enlace y la visita dejan de resolverse), `CA-210` (eliminar el nombre es irreversible y la auditoría no contiene el nombre), y que la base no guarda el token en claro.
- [X] T013 [US1] Crear `src/lib/server/economia/cafes-visitante.ts` con `registrarCafeVisitante(ambiente, visita, { clienteId, tipoCapsulaId, horaGesto })` (tipo activo con coste medio, si no `TIPO_NO_DISPONIBLE`; límite de 10 por visita y minuto con `plataforma/limitador`, si no `LIMITE_SUPERADO`; inserta `pendiente` y registra `cafe_visitante_pendiente` a cada administrador activo en la misma transacción; `cliente_id` repetido devuelve el original), `revisarCafesVisitante(ambiente, actor, { ids, decision })` (administrador; `UPDATE … WHERE estado = 'pendiente'` y solo con `changes = 1` llama a `fijarStock(stock − 1)` y guarda `coste_medio_aplicado`; devuelve `{ aprobados, rechazados, yaRevisados }`), `anularCafeVisitante(ambiente, actor, id, motivo)` (solo `aprobado` → `anulado`, stock + 1, si no `NO_ANULABLE`), `leerCafesVisitante(db, actor, { estado, pagina })` y `contarCafesVisitante(db, periodo)` (aprobados vigentes por mes). Ningún camino escribe `movimiento` (RN-086). Exportar en `src/lib/server/economia/index.ts`.
- [X] T014 [US1] Pruebas de integración en `src/lib/server/economia/cafes-visitante.test.ts`: `CA-191` (pendiente sin cambio de stock, saldos ni movimientos; idempotencia por `cliente_id`), `CA-192` (aviso a cada administrador activo, sin nombre en los datos), `CA-193` y RN-086 (aprobar baja el stock 1 sin movimientos ni coste medio; rechazar no tiene efectos; anular devuelve el stock; un miembro recibe `SIN_PERMISO`), límite de frecuencia, y entrada en stock bajo al aprobar.
- [X] T015 [US1] Prueba de concurrencia `EV-104` en `src/lib/server/economia/cafes-visitante-concurrencia.test.ts` con `worker_threads` (patrón de `anulaciones-concurrencia.test.ts`): dos aprobaciones simultáneas del mismo café bajan el stock una sola vez. Ampliar la prueba de propiedades de stock con secuencias de consumos, compras y cafés de visitante aprobados y anulados (INV-02).

### Sesión y rutas

- [X] T016 [US1] Crear el contrato `src/lib/shared/contratos/visitantes.ts` con `esquemaEntrarVisita` (`z.strictObject({ nombre: 1–60 recortado, privacidad: z.literal('si') })`), `esquemaCafeVisitante` (`clienteId`, `tipoCapsulaId` ULID, `horaGesto` instante), `esquemaRevisarCafes` (`ids` 1–100 ULID, `decision: 'aprobar' | 'rechazar'`), `esquemaAnularCafeVisitante` (`id`, `motivo` 1–200), `esquemaEliminarNombre` (`visitaId`, `confirmar: 'si'`) y `esquemaRevocarEnlace`. Pruebas en `src/lib/shared/contratos/visitantes.test.ts`.
- [X] T017 [US1] Actualizar `src/hooks.server.ts` y `src/app.d.ts`: sin sesión de miembro, resolver la cookie `becafe_visita` en `event.locals.visita`; la puerta de privacidad de miembros no se aplica a `/visita*`; un visitante que pide una ruta de `(app)` o `/api` (salvo `/api/salud`) recibe `redirect(303, '/visita')` o 401 en la API. Añadir `opcionesCookieVisita(origen, expiraEn)` (`HttpOnly`, `SameSite=Lax`, `Secure` en https, `Path=/`) junto a `opcionesCookie`. Ejecutar `npm run verify`.
- [X] T018 [US1] Crear `src/routes/(visita)/+layout.svelte` (superficie estable, `BrandMark`, sin navegación de miembro) y `src/routes/(visita)/visita/[token]/+page.server.ts` y `+page.svelte`: `load` con el estado del enlace (vigente, caducado, revocado) y estados de error en español; texto de privacidad para visitantes (`PrivacyText`, sección «Visitantes» del anexo A v2); acción `entrar` que valida con `esquemaEntrarVisita`, llama a `abrirVisita`, fija la cookie y redirige con 303 a `/visita`.
- [X] T019 [US1] Crear `src/routes/(visita)/visita/+page.server.ts` y `+page.svelte`: `load` exige `locals.visita` (si no, 303 a `/`), devuelve los tipos activos con coste medio y los cafés de la visita con su estado; cuadrícula de `CapsuleTile` en modo visitante (nueva prop `modo: 'miembro' | 'visitante'` que oculta el botón de invitado y los contadores personales); acción `registrar` con `esquemaCafeVisitante`; confirmación anunciada «Pendiente de aprobación» distinta de «registrado» (constitución X); estados vacío, error y sin conexión (sin cola). Actualizar `src/lib/ui/CapsuleTile.svelte` y `src/lib/ui/CapsuleTile.svelte.test.ts`.
- [X] T020 [US1] Crear `src/routes/(app)/visitantes/+page.server.ts` y `+page.svelte`: `load` con `listarEnlacesVisitante`; acción `crear` que devuelve `{ enlace: { id, url, qrSvg, expiraEn } }` (URL con `resolve` y el origen; QR con `qrSvg`); acción `revocar`. Mostrar el QR (`role="img"`, `aria-label`), `CopyField` con el enlace y la caducidad en hora de Madrid. Estado vacío con Capsulito. Añadir en `src/routes/(app)/+page.svelte` una tarjeta secundaria «¿Viene alguien de fuera?» que enlaza a `/visitantes`.
- [X] T021 [US1] Crear `src/routes/(app)/admin/visitantes/+page.server.ts` y `+page.svelte`: `load` con `leerCafesVisitante` y `leerVisitas` (pestañas Pendientes / Revisados con `<form method="get">`); acciones `revisar` (selección múltiple con casillas), `anular` (con `VoidDialog` y motivo) y `eliminarNombre` (con `ConfirmDialog` que avisa de que es irreversible). Nombre nulo → «Visitante». Enlace desde `/admin` y desde el aviso `cafe_visitante_pendiente`.
- [X] T022 [US1] Pruebas de *actions* con `crearEventoAccion` en `src/routes/(visita)/visita/[token]/page.server.test.ts`, `src/routes/(visita)/visita/page.server.test.ts`, `src/routes/(app)/visitantes/page.server.test.ts` y `src/routes/(app)/admin/visitantes/page.server.test.ts`: `CA-189`, `CA-191`, `CA-193`, `CA-210` y rechazos (`fail` con código y valores sin token).
- [X] T023 [US1] Añadir las rutas en `e2e/acceso/rutas.ts` (`/visitantes` miembro, `/admin/visitantes` administrador, `/visita` solo visitante) y casos `EV-103` y `CA-194` en `e2e/acceso/acceso.spec.ts`: con la cookie de visitante, `/`, `/saldos`, `/estadisticas`, `/historial` y `/api/consumos` no dan acceso.
- [X] T024 [US1] E2E en `e2e/flujos/visitantes.spec.ts` (`CA-189` a `CA-193`, `CA-210`: crear enlace, abrir en otro contexto, registrar, aprobar, comprobar stock y saldos) y `e2e/sin-js/visitantes.spec.ts` (entrar, registrar y aprobar sin JavaScript). Pantallas `/visita/[token]`, `/visita`, `/visitantes` y `/admin/visitantes` en `e2e/a11y/visitantes.spec.ts` (claro, oscuro y EV-061).

### Privacidad versión 2 (D11)

- [X] T025 [US1] Actualizar `src/lib/shared/privacidad.ts`: `VERSION_PRIVACIDAD = 2` y el texto igual que el anexo A v2 de `historias.md` (foto, visitantes, estadísticas visibles para todos, aportaciones registradas por un administrador). Ajustar las pruebas y fixtures que fijan la versión 1 (`e2e/fixtures/sesiones.ts`, `e2e/fixtures/usuarios.ts` y pruebas de `usuarios`) y comprobar `e2e/flujos/invitacion-privacidad.spec.ts`.

**Punto de control**: historia 1 usable y demostrable por sí sola.

---

## Fase 4: Historia 2 — Compra de varios tipos de una vez (P1)

**Objetivo**: cuadrícula con contadores e importe por tipo, total visible y diálogo de hucha negativa sin casilla.

**Prueba independiente**: quickstart, escenario 2.

- [X] T026 [US2] Actualizar `src/lib/shared/contratos/economia.ts`: el esquema de compra acepta `confirmarHuchaNegativa?: 'si'` y `saldoConfirmado?` (entero en céntimos, obligatorio si hay confirmación); `lineasDesdeFormulario` descarta las líneas con cantidad `0` y el esquema exige al menos una línea; se sigue aceptando el formato actual (`tipoCapsulaId[]`, `cantidad[]`, `importe[]`, constitución XIV). Pruebas `CA-197` en `src/lib/shared/contratos/economia.test.ts`.
- [X] T027 [US2] Actualizar el caso de uso de compra en `src/lib/server/economia/compras.ts`: si el saldo resultante de la hucha es negativo y falta la confirmación, o `saldoConfirmado` difiere del saldo teórico actual, lanzar `CONFIRMACION_PENDIENTE` con `{ saldo, importe, resultado }`; con confirmación válida guardar `hucha_negativa_confirmada = true` y mantener RF-043/RF-044. Pruebas `CA-198` y `EV-106` en `src/lib/server/economia/compras.test.ts` (saldo cambiado entre la confirmación y el envío pide confirmar otra vez).
- [X] T028 [US2] Actualizar `src/routes/(app)/compras/+page.server.ts`: `load` devuelve todos los tipos activos (con y sin coste medio) y el saldo teórico de la hucha; la acción traduce `CONFIRMACION_PENDIENTE` a `fail(409, { confirmacion, valores })` sin el archivo. Pruebas `CA-197`, `CA-198` en `src/routes/(app)/compras/page.server.test.ts`.
- [X] T029 [US2] Reescribir `src/routes/(app)/compras/+page.svelte`: cuadrícula de tarjetas con `CapsuleImage`, nombre, `Stepper` (0–999, botones de 44 × 44 px y campo numérico), `MoneyField` visible cuando la cantidad es mayor que 0 (sin JavaScript, siempre visible), resumen con líneas y total; sin casilla de hucha negativa; con JavaScript, `ConfirmDialog` con saldo actual, importe, saldo resultante y aviso a los administradores, botones «Cancelar» y «Registrar igualmente»; sin JavaScript, panel de confirmación con los campos ocultos cuando `form.confirmacion` existe. Ayudas bajo los campos en `src/lib/shared/textos.ts`.
- [X] T030 [US2] E2E `CA-197`, `CA-198` en `e2e/flujos/economia.spec.ts` (compra de tres tipos, total, diálogo) y `EV-106` en `e2e/sin-js/economia.spec.ts` (paso intermedio sin JavaScript). Actualizar `e2e/fixtures/economia.ts` al formulario nuevo y `e2e/a11y/economia.spec.ts` con el diálogo abierto.

---

## Fase 5: Historia 3 — Aportaciones por persona (P1)

**Objetivo**: Saldos muestra lo aportado por cada persona y el administrador registra aportaciones en nombre de otra.

**Prueba independiente**: quickstart, escenario 3.

- [X] T031 [US3] Actualizar `src/lib/server/economia/aportaciones.ts`: `registrarAportacion` acepta `beneficiarioId?`; si difiere del actor exige administrador (`SIN_PERMISO`, con `auth.permiso_denegado`) y persona activa (`PERSONA_NO_ACTIVA`); `usuario_id` = beneficiario, `registrada_por` = actor; aviso `aportacion_en_tu_nombre` al beneficiario en la misma transacción; evento `aportacion.en_nombre_de`. Pruebas `CA-200`, `EV-105` y RN-087 en `src/lib/server/economia/aportaciones.test.ts` (los dos movimientos van a la cuenta del beneficiario, RN-008).
- [X] T032 [US3] Actualizar `src/lib/server/economia/saldos.ts` para añadir `totalAportado` (aportaciones vigentes, céntimos) a cada fila y una consulta `leerAportacionesDe(db, actor, usuarioId, pagina)` con `registradaPorNombre`. Pruebas `CA-199` en `src/lib/server/economia/saldos.test.ts`.
- [X] T033 [US3] Actualizar `src/lib/shared/contratos/economia.ts` (`beneficiarioId` ULID opcional en `esquemaAportacion`) y `src/routes/(app)/saldos/+page.server.ts` y `+page.svelte`: columna o dato «Aportado» por persona; para administradores, `SelectField` «Para» con «Yo» por defecto y las personas activas; confirmación anunciada con el nombre del beneficiario. Crear `src/routes/(app)/saldos/personas/[usuarioId=ulid]/+page.server.ts` y `+page.svelte` con el detalle de aportaciones y quién las registró. Pruebas de *action* en `src/routes/(app)/saldos/page.server.test.ts`.
- [X] T034 [US3] E2E `CA-199`, `CA-200` en `e2e/flujos/saldos-historial.spec.ts` y sin JavaScript en `e2e/sin-js/economia.spec.ts`; ruta del detalle en `e2e/acceso/rutas.ts` y en `e2e/a11y/saldos-estadisticas.spec.ts`.

---

## Fase 6: Historia 4 — Estadísticas del departamento (P2)

**Objetivo**: cualquier miembro ve las estadísticas de todos, con gráficos y tablas equivalentes.

**Prueba independiente**: quickstart, escenario 4.

- [X] T035 [US4] Crear `economia.leerEvolucionHucha(db, desde, hasta)` en `src/lib/server/economia/libro.ts` (saldo teórico al cierre de cada mes de `Europe/Madrid`, en céntimos, desde los movimientos vigentes de la cuenta `hucha`) y exportarla. Pruebas en `src/lib/server/economia/libro.test.ts` (`CA-201`: meses sin movimientos repiten el saldo anterior).
- [X] T036 [US4] Actualizar `src/lib/server/estadisticas/consultas.ts`: `leerPersonales` acepta cualquier miembro con sesión (RN-061); `leerEquipo` añade `visitantes`, `porMes[].visitantes` (con `contarCafesVisitante`) y `porPersona` (`{ usuarioId, nombre, fotoUrl, cafes, invitados }`, de mayor a menor) y la evolución de la hucha; periodos nuevos `ultimos3` y `ultimos12` en `resolverPeriodo` y `src/lib/server/estadisticas/dominio/periodos.ts` (se mantienen `mes`, `anio` y `todo`). Pruebas `CA-201`, `CA-202` en `src/lib/server/estadisticas/consultas.test.ts` y en la prueba de periodos.
- [X] T037 [US4] Actualizar `src/lib/shared/contratos/estadisticas.ts` (`periodo` ∈ `mes | ultimos3 | ultimos12 | anio | todo`) y `src/routes/(app)/estadisticas/consulta.ts` con su prueba.
- [X] T038 [P] [US4] Crear `src/lib/ui/LineChart.svelte` (SVG con tokens de datos, ejes con etiquetas en es-ES, línea de cero visible, sin animación con `prefers-reduced-motion`, `role="img"` y `aria-label`) y ampliar `src/lib/ui/BarChart.svelte` con barras apiladas si no las admite. Prueba de componente en `src/lib/ui/LineChart.svelte.test.ts`. Exportar en `src/lib/ui/index.ts`.
- [X] T039 [US4] Rehacer `src/routes/(app)/estadisticas/+page.svelte` y `PanelEstadisticas.svelte` con `PanelGrid`: resumen (`KpiTile` de cafés, invitados, visitantes y coste), principal (cafés por persona con `Avatar` y enlace a `/estadisticas/[usuarioId]`, consumo por tipo, evolución mensual de 12 meses apilada), secundario (evolución de la hucha con `LineChart`, ranking de rellenos); cada gráfico con `<details>` «Ver datos» y su `<table>`; selector de periodo con `<form method="get">`; sin selector de persona. Estados vacío, error y sin conexión.
- [X] T040 [US4] Actualizar `src/routes/(app)/estadisticas/+page.server.ts` y `[usuarioId=ulid]/+page.server.ts` (sin la restricción de administrador). E2E `CA-201`, `CA-202` en `e2e/flujos/saldos-historial.spec.ts` (o `e2e/flujos/estadisticas.spec.ts`) y periodo sin JavaScript en `e2e/sin-js/historial.spec.ts`; `e2e/a11y/saldos-estadisticas.spec.ts` en claro y oscuro.

---

## Fase 7: Historia 5 — Ayuda contextual de Capsulito (P2)

**Objetivo**: panel «?» en cada pantalla, tour de Inicio la primera vez y ayudas fijas bajo los campos técnicos.

**Prueba independiente**: quickstart, escenario 5.

- [X] T041 [P] [US5] Crear `src/lib/shared/ayuda/pantallas.ts` con `IdPantalla`, `pantallaDeRuta(routeId)` y el catálogo `Record<IdPantalla, { titulo, proposito, acciones: { nombre, explicacion }[], campos: { nombre, explicacion }[] }>` para todas las pantallas de `(app)` y `(visita)`, y `src/lib/shared/ayuda/tour.ts` con los 4 pasos (`capsula`, `invitado`, `deshacer`, `navegacion`). Prueba `CA-203` en `src/lib/shared/ayuda/pantallas.test.ts`: cada ruta de `e2e/acceso/rutas.ts` (`RUTAS_PROTEGIDAS` y `RUTAS_DE_ADMINISTRACION`) tiene entrada.
- [X] T042 [US5] Crear `src/lib/ui/AyudaPanel.svelte` sobre `Sheet` (inferior en móvil, lateral desde 1024 px; superficie estable) con Capsulito (`momento` de ayuda), propósito, acciones y campos, voz opcional y «Repetir el tour» en Inicio. Actualizar `src/lib/ui/AppShell.svelte` para recibir `pantallaAyuda`: sin JavaScript, enlace a `/ayuda#<id>`; con JavaScript, botón «?» con `aria-label` «Ayuda de esta pantalla» que abre el panel. Prueba de componente `CA-203` en `src/lib/ui/AyudaPanel.svelte.test.ts` (foco al abrir y al cerrar, `Esc`).
- [X] T043 [US5] Crear `src/lib/ui/TourInicio.svelte` (popover anclado a `[data-tour]`, foco atrapado, «Siguiente», «Saltar», `Esc`, sin animación con `prefers-reduced-motion`, superficie estable) y añadir los `data-tour` en `src/routes/(app)/+page.svelte` y `src/lib/ui/CapsuleTile.svelte`/`AppNav.svelte`. Prueba de componente `CA-204` en `src/lib/ui/TourInicio.svelte.test.ts` (falla si falta un ancla).
- [X] T044 [US5] Actualizar `src/routes/(app)/+layout.server.ts` (`pantallaAyuda` y marcas de cuenta con `leerMarcasCuenta`), `src/routes/(app)/+layout.svelte` (pasa `pantallaAyuda` a `AppShell`) y `src/routes/(app)/+page.server.ts` y `+page.svelte` (acción `tourVisto` con `marcarCuenta`; el tour aparece si `tourInicioVisto` es falso y la bienvenida ya se vio). Actualizar `src/routes/(app)/ayuda/+page.svelte` para listar el catálogo con anclas `id`.
- [X] T045 [US5] Completar las ayudas fijas bajo los campos técnicos (RF-205) en Configuración, umbral mínimo, compras y Arqueos y recuentos con textos de `src/lib/shared/textos.ts`, enlazadas con `aria-describedby`.
- [X] T046 [US5] E2E `CA-203` a `CA-205` en `e2e/flujos/ayuda.spec.ts` (panel en varias pantallas, tour una sola vez por cuenta) y sin JavaScript en `e2e/sin-js/experiencia-capsulito.spec.ts` (el «?» lleva a `/ayuda#<id>`); panel abierto en `e2e/a11y/apariencia.spec.ts`. Actualizar `e2e/fixtures/errores-navegador.ts` o las fixtures de sesión para marcar el tour como visto en las suites que no lo prueban.

---

## Fase 8: Historia 6 — Primer contacto (P2)

**Objetivo**: bienvenida antes de entrar, tarjeta para instalar la aplicación y oferta de avisos tras la bienvenida.

**Prueba independiente**: quickstart, escenario 6.

- [ ] T047 [US6] Ampliar `src/lib/ui/Bienvenida.svelte` con la prop `modo: 'autenticada' | 'antesDeEntrar'` y `visitante?: boolean`: en `antesDeEntrar`, primera pantalla con «Empezar» (gesto que habilita el audio) y última con «Entrar» y, si llegó con enlace, «Soy visitante»; el saludo no usa nombre. Montarla en `src/routes/(auth)/login/+page.svelte` y `src/routes/(visita)/visita/[token]/+page.svelte`, que necesitan `crearContextoMascota` (comprobar `src/routes/+layout.svelte`). Prueba `CA-195` en `src/lib/ui/Bienvenida.svelte.test.ts` y en `PruebasBienvenida.svelte`.
- [X] T048 [P] [US6] Crear `src/lib/client/instalacion.ts` (`beforeinstallprompt`, `appinstalled`, `display-mode: standalone`, `navigator.standalone`, detección de iOS Safari; devuelve `'instalable' | 'ios' | 'instalada' | 'no_disponible'` y `instalar()`), con prueba unitaria en `src/lib/client/instalacion.test.ts`.
- [X] T049 [US6] Crear `src/lib/ui/TarjetaInstalacion.svelte` (props: estado, `oninstalar`, formulario de descarte; en iOS, instrucciones de «Compartir → Añadir a pantalla de inicio») y montarla en `src/routes/(app)/+page.svelte` con la acción `descartarInstalacion` (`marcarCuenta`); añadir «Instalar la aplicación» en `src/routes/(app)/perfil/+page.svelte`. Prueba de componente `CA-206` en `src/lib/ui/TarjetaInstalacion.svelte.test.ts`.
- [X] T050 [US6] Oferta de avisos (RF-207): tras cerrar la bienvenida autenticada, si `ofertaAvisosVista` es falso y `Notification.permission === 'default'`, Capsulito muestra «Activar avisos» (llama a `activarPush`) y «Ahora no»; las dos envían la acción `ofertaAvisosVista`. Implementar en `src/routes/(app)/+layout.svelte` o en un componente `src/lib/ui/OfertaAvisos.svelte` con su prueba `CA-207`.
- [X] T051 [US6] E2E `CA-195`, `CA-206`, `CA-207` en `e2e/flujos/experiencia-capsulito.spec.ts` (contexto limpio en `/login`; `beforeinstallprompt` simulado en Chromium; oferta de avisos una vez) y `CA-196` comprobado en `src/lib/shared/contratos/apariencia.test.ts` (ya existe). `/login` con bienvenida en `e2e/a11y/acceso.spec.ts`.

---

## Fase 9: Historia 7 — Fotos de las personas (P3)

**Objetivo**: cada persona sube su foto; el administrador también; sin foto, iniciales sobre un color cálido estable.

**Prueba independiente**: quickstart, escenario 7.

- [X] T052 [P] [US7] Añadir los tokens `--avatar-1` a `--avatar-6` (cálidos, claro y oscuro, contraste ≥ 4,5:1 con `--ink`) en la fuente de tokens de Latte que usa `generate-tokens` y comprobar el contraste en su validador. Crear `src/lib/shared/avatar.ts` con `colorAvatar(usuarioId)` (FNV-1a de 32 bits módulo 6) y prueba `CA-209` en `src/lib/shared/avatar.test.ts` (estable y repartido).
- [X] T053 [US7] Actualizar `src/lib/ui/Avatar.svelte` con las props `usuarioId` y `fotoUrl?` (imagen `alt=""` con respaldo a iniciales si falla; iniciales sobre `colorAvatar`); prueba de componente en `src/lib/ui/Avatar.svelte.test.ts`. Pasar `usuarioId` y `fotoUrl` donde ya se usa `Avatar`.
- [X] T054 [US7] Crear `src/lib/server/usuarios/fotos.ts` con `cambiarFoto(ambiente, actor, usuarioId, bytes | null)` (la propia persona o un administrador, si no `SIN_PERMISO`; `procesarFoto` y `guardarFoto` en `fotos/usuarios/<id>-<ulid>.webp` fuera de la transacción; actualiza `foto_ruta`; borra la anterior tras confirmar; auditoría y evento `usuario.foto_cambiada`) y `leerFotoUsuario(db, actor, usuarioId)`. Exportar en `src/lib/server/usuarios/index.ts`. Pruebas `CA-208` en `src/lib/server/usuarios/fotos.test.ts` (6 MB y no imagen rechazados; administrador quita la foto de otra persona; miembro no cambia la de otra).
- [X] T055 [US7] Crear `src/routes/fotos/usuarios/[usuarioId=ulid]/+server.ts` (sesión de miembro; 404 sin foto; `Cache-Control: private, max-age=300`; mismo patrón que `src/routes/fotos/[capsulaId=ulid]`). Añadir la acción `foto` con `PhotoField` y «Quitar foto» en `src/routes/(app)/perfil/+page.server.ts` y `+page.svelte` y en `src/routes/(app)/admin/usuarios/[usuarioId=ulid]/+page.server.ts` y `+page.svelte`. Pruebas de *action* en sus `page.server.test.ts`.
- [X] T056 [US7] E2E `CA-208`, `CA-209` en `e2e/flujos/perfil-notificaciones.spec.ts` y `e2e/flujos/usuarios.spec.ts`; subida sin JavaScript en `e2e/sin-js/`; ruta de foto en `e2e/acceso/rutas.ts`.

---

## Fase 10: Cierre

- [X] T057 Actualizar `ARCHITECTURE.md` §2 (`(visita)`, `lib/shared/ayuda/`, `lib/client/instalacion.ts`, `plataforma/qr.ts`), §3 (tablas nuevas de `auth`, `economia` y `usuarios`) y §11 (`uqr` en su único archivo); actualizar `docs/pruebas.md` con las rutas nuevas de `acceso` y `a11y`.
- [X] T058 Proponer a la persona usuaria el CAMBIO-020 de `historias.md` (§10.3 `uqr`, §10.4 tablas, §10.5 rutas) y aplicarlo solo con su autorización, con respaldo previo en `.respaldos/`.
- [ ] T059 Ejecutar `scripts/benchmark.sh` completo en serie (verificación completa y E2E de todos los proyectos) y comprobar la Definition of Done de `docs/pruebas.md` §20.2; cobertura ≥ 90 % en `economia` y ≥ 80 % en `lib/server` + `lib/shared`.
- [ ] T060 Pedir a la persona usuaria la revisión manual con VoiceOver (iOS) y TalkBack (Android) de `/visita`, `/compras`, `/estadisticas`, el panel de ayuda y el tour (constitución XI), y anotar el resultado en este archivo.
- [ ] T061 Comprobar `git status` (sin `.env`, `*.db`, `.local/`, informes ni capturas de `.logs/`) e informar de lo ejecutado, lo reutilizado y lo no verificado.

---

## Dependencias y orden

- **Fase 1 → Fase 2 → historias.** La fase 2 bloquea todo (migración, catálogos, marcas de cuenta).
- **Historias 1, 2 y 3 (P1)** son independientes entre sí; la 1 es el MVP.
- **Historia 4** usa `contarCafesVisitante` (T013) y `totalAportado` no; si se hace antes que la 1, `visitantes` vale 0 hasta T013.
- **Historia 5** necesita la entrada de ayuda de las rutas nuevas: hacerla después de las historias 1 y 3 o añadir las entradas cuando se creen las rutas.
- **Historia 6** usa `preferencia_cuenta` (T009) y la ruta `/visita/[token]` (T018) para «Soy visitante».
- **Historia 7** es independiente; `Avatar` con foto mejora las historias 3 y 4.
- **Cierre** después de todas las historias.

## Paralelismo

- T002 con T003–T006 (archivos distintos).
- Dentro de la historia 1: T011/T012 (`auth`) en paralelo con T013/T014 (`economia`) tras la fase 2; T016 en paralelo con ambos.
- T038 (`LineChart`), T041 (catálogo de ayuda), T048 (instalación) y T052 (tokens de avatar) no dependen de otras tareas de su historia.
- Historias 2, 3 y 7 pueden avanzar en paralelo tras la fase 2 porque tocan archivos distintos, salvo `src/lib/shared/contratos/economia.ts` (historias 2 y 3: hacerlas en serie en ese archivo).

## Estrategia

1. **MVP**: fases 1, 2 y 3 (visitantes). Verificar y demostrar.
2. **P1 restantes**: historias 2 y 3.
3. **P2**: historias 4, 5 y 6.
4. **P3**: historia 7.
5. **Cierre**: documentación, CAMBIO-020 autorizado, benchmark y revisión manual.
