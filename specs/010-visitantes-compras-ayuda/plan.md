# Implementation Plan: Visitantes, compras rápidas, estadísticas del departamento y ayuda de Capsulito (F10)

**Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9) | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/010-visitantes-compras-ayuda/spec.md` (aprobada el 2026-10-24) y `historias.md` v0.19.0 (CAMBIO-019).

**Status**: Propuesta. Pendiente de aprobación por la persona usuaria.

## Summary

F10 añade siete capacidades sobre la arquitectura existente, sin módulos nuevos ni aristas nuevas en el grafo:

1. **Visitantes** (RF-189 a RF-194, RF-210, RN-086): `auth` posee los enlaces y las visitas (token y nombre); `economia` posee el café de visitante y su aprobación, que escribe el stock. El acceso usa una cookie `HttpOnly` propia y un grupo de rutas `(visita)`.
2. **Compra rápida** (RF-197, RF-198): el formulario de compra pasa a una cuadrícula con `Stepper` por tipo y la confirmación de hucha negativa pasa a `ConfirmDialog`, con un paso intermedio en el servidor sin JavaScript.
3. **Aportaciones por persona** (RF-199, RF-200, RN-087): la tabla `aportacion` ya guarda `usuario_id` y `registrada_por`; solo cambian el caso de uso, la acción y la pantalla.
4. **Estadísticas del departamento** (RF-201, RF-202, RN-061): `estadisticas.leerEquipo` añade el desglose por persona, los visitantes y la evolución de la hucha, y la pantalla usa `KpiTile`, `BarChart` y un `LineChart` nuevo.
5. **Ayuda contextual y tour** (RF-203 a RF-205): un catálogo tipado por pantalla en `lib/shared/ayuda/`, un panel `AyudaPanel` sobre `Sheet` y un tour de Inicio.
6. **Primer contacto** (RF-195, RF-196, RF-206, RF-207): la bienvenida antes de la entrada, la tarjeta de instalación y la oferta de avisos. Las marcas por cuenta se guardan en una tabla nueva de `usuarios`.
7. **Fotos de persona** (RF-208, RF-209): columna `foto_ruta` en `usuario`, ruta de servicio protegida y `Avatar` con foto o iniciales sobre tokens cálidos.

Ya corregido durante la preparación (mantenimiento, sin cambio de comportamiento aprobado): el interruptor de avisos de Perfil dibujaba la bolita siempre a la izquierda (`aria-checked:` en un hijo sin el atributo). El servidor ya trataba todos los avisos como activados sin fila (`notificaciones/preferencias.ts`), así que RF-207 solo añade la oferta de permiso tras la bienvenida.

## Technical Context

**Language/Version**: TypeScript 6.x estricto, Node.js 24.x
**Primary Dependencies**: SvelteKit 3 + adapter-node 6, Svelte 5 (runes), Tailwind CSS 4, Bits UI 2, Drizzle ORM 0.45, Zod 4, `sharp` 0.35. **Nueva**: `uqr` 0.1.x (QR en SVG, solo servidor; ver «Dependencias nuevas»).
**Storage**: SQLite (`better-sqlite3`), migración `0007_f10-visitantes.sql`; fotos de persona en `/data/fotos/usuarios/`.
**Testing**: Vitest (unidad e integración con SQLite real), Vitest Browser Mode (componentes), Playwright (E2E, `sin-js`, `a11y`, `acceso`).
**Target Platform**: PWA en Safari iOS ≥ 16.4 y Chrome Android; escritorio.
**Project Type**: aplicación web SvelteKit única.
**Performance Goals**: café de visitante confirmado en ≤ 1 s p95 (RNF-002); Estadísticas dentro del presupuesto de `perf:lectura`.
**Constraints**: sin JavaScript para todas las acciones con formulario (XVII); el navegador solo guarda la lista cerrada del principio V; ningún nombre de visitante en los logs (XVI).
**Scale/Scope**: unas 10 personas, una instancia; visitantes esporádicos.

## Constitution Check (v1.7.0)

| Principio | Cumplimiento |
| --- | --- |
| I. Fuente vigente | Todas las reglas proceden de la spec aprobada y de `historias.md` v0.19.0. El límite de frecuencia de visitantes es un parámetro técnico de protección (D3), no una regla de negocio. |
| II. Complejidad | Sin módulos nuevos. Una tabla por necesidad concreta. Una sola dependencia nueva (`uqr`), con alternativa evaluada. |
| III. Módulos | Visitas en `auth`, cafés de visitante en `economia`, marcas de cuenta y fotos en `usuarios`. Aristas existentes (`economia → auth`, `economia → notificaciones`, `estadisticas → economia`). |
| IV. Integridad económica | El café de visitante aprobado no genera movimientos (RN-086); su anulación vuelve a sumar stock sin borrar nada. Aprobar y anular son idempotentes por estado y transaccionales. La aportación en nombre de otro mantiene sus dos movimientos (RN-008). |
| V. Almacenamiento | El tour visto, la tarjeta de instalación descartada y la oferta de avisos se guardan en la cuenta (`preferencia_cuenta`), no en el navegador. La voz y la bienvenida ya estaban en la lista permitida. |
| VI. Seguridad | Token de enlace con 256 bits de azar, guardado como SHA-256 (patrón de `enlace_acceso`). Cookie `becafe_visita` `HttpOnly`, `SameSite=Lax`, `Secure` en https, caduca con el enlace. Cada caso de uso de visitante comprueba el enlace. Límite de frecuencia por visita. Toda entrada con `z.strictObject`. |
| VII. Tipado | Sin aserciones ni escapes. |
| VIII. Pruebas | Cada CA-189 a CA-210 y EV-103 a EV-106 tiene prueba (tabla «Pruebas previstas»). `economia` mantiene ≥ 90 %. |
| IX. Verificación | Lotes con comprobaciones afectadas; cierre con `scripts/benchmark.sh`. |
| X. Usabilidad | Café de visitante de un toque. Confirmaciones distinguen «pendiente de aprobación». Hucha negativa con efecto y confirmación. Estados vacío, cargando, error y sin conexión en cada pantalla nueva. |
| XI. Accesibilidad | Gráficos con tabla equivalente; contadores de 44 × 44 px; avatares con contraste ≥ 4,5:1; panel de ayuda con gestión de foco. |
| XIV. Compatibilidad | `/api/consumos` no cambia. El formulario de compra sigue aceptando los campos actuales (`tipoCapsulaId[]`, `cantidad[]`, `importe[]`). |
| XVI. Registro | Eventos nuevos sin nombres ni tokens (D12). |
| XVII. SvelteKit | Cargas en `+page.server.ts`; acciones con nombre y `use:enhance`; sin `+server.ts` nuevos salvo la ruta de foto (sirve un archivo, como las de cápsulas y tickets). |
| XVIII. Cristal | Panel de ayuda y tour sobre superficie estable (`Sheet`); ningún cristal nuevo bajo formularios. |

**Resultado**: sin infracciones. No se necesita ADR ni enmienda.

## Architecture Check (`ARCHITECTURE.md` §15)

1. **Constitución**: ver tabla anterior.
2. **Ubicación**: tablas `enlace_visitante` y `visita` en `auth/esquema.ts`; `cafe_visitante` en `economia/esquema.ts`; `preferencia_cuenta` y columna `foto_ruta` en `usuarios/esquema.ts`. Rutas en `src/routes/(visita)/`, `src/routes/(app)/visitantes/`, `src/routes/(app)/admin/visitantes/` y `src/routes/fotos/usuarios/[usuarioId=ulid]/`. Catálogo de ayuda en `src/lib/shared/ayuda/`. Instalación PWA en `src/lib/client/instalacion.ts`. QR en `src/lib/server/plataforma/qr.ts` (único archivo que importa `uqr`).
3. **Grafo**: sin aristas nuevas. `economia` lee la visita con la API pública de `auth` (arista existente). `estadisticas` lee la evolución de la hucha y los cafés de visitante con la API de `economia` (arista existente).
4. **Reutilización**: `Stepper`, `ConfirmDialog`, `Sheet`, `KpiTile`, `BarChart`, `Avatar`, `PhotoField`, `CopyField`, `CapsuleImage`, `Bienvenida`, `limitador` y `imagenes` existentes.
5. **Abstracciones nuevas**: `LineChart` (evolución de la hucha; `BarChart` no sirve para series temporales continuas), `AyudaPanel`, `TourInicio`, `TarjetaInstalacion`. Cada una responde a un requisito.
6. **Reglas e invariantes**: RN-086 → `economia/cafes-visitante.ts` con transacción y prueba de concurrencia (EV-104); INV-02 → la reconstrucción de stock de las pruebas (`economia/pruebas/`) incluye los cafés aprobados vigentes; RN-087 → `economia/aportaciones.ts` comprueba el rol.
7. **Repetición y fallos**: café de visitante idempotente por `cliente_id`; aprobar o rechazar un café ya revisado devuelve `YA_REVISADO` sin efecto; los avisos se registran en la misma transacción y se entregan después (patrón F5).
8. **Fuentes y contratos**: `contracts/formularios.md`. La API de la cola sin conexión no cambia.
9. **Autorización**: en cada caso de uso. Rutas nuevas en EV-050: `/visitantes` (miembro), `/admin/visitantes` (administrador), `/fotos/usuarios/[id]` (miembro), `/visita` (solo visitante; un miembro sin visita no entra).
10. **Afectados**: F4 (aportaciones, compras), F5 (avisos), F6 (estadísticas, privacidad), F9 (bienvenida, `Avatar`).
11. **Migraciones**: solo añaden tablas y una columna anulable; no tocan cargos ni movimientos.
12. **SvelteKit**: todas las acciones funcionan sin JavaScript. Excepciones ya cerradas en XVII: la instalación de la PWA y las notificaciones push.
13. **Registro**: eventos de D12, comprobados con el registrador falso.
14. **Estados y a11y**: cada pantalla nueva define vacío, cargando, error y sin conexión, y entra en `a11y` con EV-061.

## Dependencias nuevas (`ARCHITECTURE.md` §13)

| Campo | `uqr` |
| --- | --- |
| Necesidad | Dibujar el QR del enlace de visitante (RF-189). |
| Alternativa presente | Ninguna en el proyecto. `qrcode` 1.5.4 (MIT) arrastra `yargs`, `pngjs` y `dijkstrajs`; `uqr` no tiene dependencias. |
| Mantenimiento | 0.1.3, repositorio `unjs/uqr`, publicado el 03-04-2026. |
| Licencia | MIT. |
| Seguridad | Sin dependencias transitivas; `npm audit` se ejecuta al instalarla. |
| Impacto | Solo servidor (`plataforma/qr.ts`); 0 bytes en el cliente. El SVG se incrusta en la página. |

Al ser `0.x`, la línea es `0.1.x`. Se registra en `historias.md` §10.3 en el cierre de F10.

## Decisiones de diseño

### D1. Enlace de visitante y visita en `auth` (RF-189, RF-190, RF-210)

- Tabla `enlace_visitante`: `id`, `token_hash` (único), `creado_por`, `creado_en`, `expira_en` (= creado + 24 h), `revocado_en`, `revocado_por`.
- Tabla `visita`: `id`, `enlace_id`, `token_hash` (cookie de la visita, único), `nombre` (anulable tras RF-210), `nombre_eliminado_en`, `creada_en`.
- API pública: `crearEnlaceVisitante(ambiente, actor)` → `{ enlaceId, token, expiraEn }`; `revocarEnlaceVisitante(ambiente, actor, enlaceId)` (creador o administrador); `listarEnlacesVisitante(db, actor)`; `abrirVisita(ambiente, token, nombre)` → `{ cookie, expiraEn }`; `resolverVisita(db, tokenCookie, ahora)` → `VisitaResuelta | null`; `eliminarNombreVisita(ambiente, actor, visitaId)` (administrador, irreversible, auditoría sin nombre); `leerVisitas(db, ids)` para que `economia` muestre el nombre.
- Comparación de tokens por SHA-256, igual que `enlace_acceso`. Una visita deja de resolverse cuando su enlace caduca o se revoca.

### D2. Café de visitante en `economia` (RF-191, RF-193, RN-086)

- Tabla `cafe_visitante`: `id`, `cliente_id` (único), `visita_id`, `tipo_capsula_id`, `hora_gesto`, `hora_registro`, `estado` (`pendiente | aprobado | rechazado | anulado`, con `CHECK`), `revisado_por`, `revisado_en`, `coste_medio_informativo` (anulable), `anulado_por`, `anulado_en`, `motivo_anulacion`.
- `registrarCafeVisitante(ambiente, visita, datos)`: valida tipo activo con coste medio (RN-006), comprueba el límite de frecuencia (D3), inserta `pendiente` y registra el aviso `cafe_visitante_pendiente` a cada administrador en la misma transacción. `cliente_id` repetido → devuelve el original.
- `revisarCafesVisitante(ambiente, actor, { ids, decision })`: administrador. Por cada id en `pendiente`: `aprobado` → `fijarStock(stock − 1)` y guarda el coste medio vigente; `rechazado` → sin efectos. Un id no pendiente se ignora y se informa como `YA_REVISADO`. Todo en una transacción (`UPDATE … WHERE estado = 'pendiente'` decide quién gana, EV-104).
- `anularCafeVisitante(ambiente, actor, id, motivo)`: administrador, solo `aprobado` → `anulado` y stock + 1.
- Sin movimientos, sin cambios de coste medio, sin regularizaciones (RN-012 solo afecta a consumos).

### D3. Sesión de visitante y rutas `(visita)` (RF-190, RF-194, RF-195)

- `hooks.server.ts` resuelve la cookie `becafe_visita` en `event.locals.visita` si no hay sesión de miembro. La puerta de privacidad de miembros no se aplica a `/visita*`.
- `/visita/[token]`: carga el estado del enlace; muestra la bienvenida si el dispositivo no la vio (cliente), el aviso de privacidad para visitantes y el formulario del nombre (acción `entrar`). Con éxito, cookie y `redirect(303, '/visita')`.
- `/visita`: cuadrícula de cápsulas (`CapsuleTile` sin botón de invitado ni contadores personales) y acción `registrar`. Sin cola sin conexión: sin red, el botón muestra el estado sin conexión.
- `/(app)` y `/api` rechazan `locals.visita` sin sesión de miembro (EV-103). Un visitante que pide una ruta de miembro va a `/visita`.
- Límite de frecuencia: 10 cafés por visita y minuto con `plataforma/limitador` (mismo mecanismo que `/api/registro-cliente`). Superarlo devuelve `LIMITE_SUPERADO` con mensaje en español.

### D4. Generación y revisión (RF-189, RF-192, RF-193)

- `/visitantes` (miembro): botón «Crear enlace de visitante», lista de mis enlaces vigentes con `CopyField`, QR (SVG de `plataforma/qr.ts`), caducidad y «Revocar». El token solo se muestra en la respuesta de creación; la lista muestra el QR y el enlace solo de los creados en la sesión de la página (después, «Revocar» o crear otro).
- `/admin/visitantes` (administrador): pestañas Pendientes / Revisados; selección múltiple; «Aprobar», «Rechazar», «Anular» (con motivo) y «Eliminar nombre» (con confirmación de irreversibilidad). Enlace desde la campana (`cafe_visitante_pendiente`) y desde `/admin`.
- Inicio de los miembros muestra una tarjeta secundaria «¿Viene alguien de fuera?» que enlaza a `/visitantes`.

### D5. Compra rápida y confirmación de hucha negativa (RF-197, RF-198)

- La carga de `/compras` devuelve todos los tipos activos (con coste medio o sin él: la compra crea el primero) y el saldo teórico de la hucha.
- Cuadrícula de tarjetas con `CapsuleImage`, nombre, `Stepper` (0–999, `−`/`+` de 44 px y campo numérico) y `MoneyField` visible cuando la cantidad > 0. Resumen fijo con líneas y total.
- Sin JavaScript: la cuadrícula envía `tipoCapsulaId[]`, `cantidad[]` e `importe[]` de todos los tipos; el servidor descarta las cantidades 0 (`lineasDesdeFormulario` ya existe) y exige al menos una línea.
- Hucha negativa: el cliente calcula `saldo − total`; si < 0, `ConfirmDialog` muestra saldo, importe, resultado y aviso. «Registrar igualmente» envía `confirmarHuchaNegativa=si` y `saldoConfirmado` (céntimos). El servidor vuelve a calcular: si queda negativo y falta la confirmación o `saldoConfirmado` ≠ saldo actual, devuelve `fail(409, { confirmacion: { saldo, importe, resultado }, valores })` y la página muestra el mismo panel como paso intermedio. Se elimina la casilla.

### D6. Aportaciones por persona (RF-199, RF-200, RN-087)

- `registrarAportacion` acepta `beneficiarioId` opcional. Si difiere del actor, exige administrador y persona activa (`SIN_PERMISO`, `PERSONA_NO_ACTIVA`). `registrada_por` = actor. Aviso `aportacion_en_tu_nombre` al beneficiario en la misma transacción.
- `leerSaldos` añade `totalAportado` por persona. El detalle por persona (`/saldos/personas/[usuarioId]`) lista aportaciones con quién las registró.
- En Saldos, el formulario del administrador muestra un `SelectField` «Para» (por defecto, «Yo»).

### D7. Estadísticas del departamento (RF-201, RF-202, RN-061)

- `leerPersonales` deja de exigir que el actor sea la persona o un administrador: basta un miembro con sesión (RN-061).
- `leerEquipo` añade `porPersona: { usuarioId, nombre, fotoUrl, cafes, invitados }[]`, `visitantes` y `porMes[].visitantes`, con los cafés de visitante aprobados vigentes (API nueva `economia.contarCafesVisitante`).
- `economia.leerEvolucionHucha(db, meses, ahora)` devuelve el saldo teórico al cierre de cada mes (`Europe/Madrid`) desde el libro de movimientos.
- Periodos: `mes` (por defecto), `ultimos3` y `ultimos12`. `anio` y `todo` siguen aceptándose en la URL para no romper enlaces existentes (resumen mensual).
- Pantalla con `PanelGrid`: resumen (`KpiTile` ×4), principal (barras por persona con `Avatar`, consumo por tipo, evolución mensual apilada), secundario (evolución de la hucha con `LineChart`, ranking de rellenos). Cada gráfico tiene una `<table>` equivalente (visible en un `<details>` «Ver datos»).
- Se retira el selector de persona; `/estadisticas/[usuarioId]` se mantiene para el detalle de una persona, abierto desde la barra de esa persona.

### D8. Ayuda contextual y tour (RF-203 a RF-205)

- `src/lib/shared/ayuda/pantallas.ts`: catálogo tipado `Record<IdPantalla, { titulo, proposito, acciones: {nombre, explicacion}[], campos: {nombre, explicacion}[] }>` para todas las pantallas de `(app)` y `(visita)`. Los textos son la fuente de `/ayuda` (sin JS) y del panel. Una prueba unitaria comprueba que cada ruta de `RUTAS_PROTEGIDAS` tiene entrada.
- `AppShell` recibe `pantallaAyuda` del layout (derivado de `page.route.id`). Sin JavaScript renderiza un formulario GET a `/ayuda?pantalla=<id>` (la regla `svelte/no-navigation-without-resolve` no admite anclas `#`) y esa pantalla se muestra la primera; tras hidratar, un botón que abre `AyudaPanel` (`Sheet` inferior en móvil, lateral en escritorio) con Capsulito (`momento` `ayuda`, frase sin audio genérico) y la voz opcional de las frases que tengan audio.
- `TourInicio`: 4 pasos anclados a `data-tour="capsula" | "invitado" | "deshacer" | "navegacion"`; popover con foco atrapado, «Siguiente», «Saltar», `Esc`. Se muestra si `preferenciaCuenta.tourInicioVisto` es falso y la bienvenida ya se vio. Terminar o saltar envía la acción `?/tourVisto` (formulario). Con `prefers-reduced-motion`, sin animación.
- RF-205: las líneas de ayuda ya añadidas en Arqueos y recuentos se completan en Configuración (ya tiene `hint`), umbral mínimo (ya tiene) y se verifican en una prueba E2E.

### D9. Primer contacto (RF-195, RF-196, RF-206, RF-207)

- `/login` y `/visita/[token]` montan `Bienvenida` en modo `antesDeEntrar`: primera pantalla con «Empezar» (gesto de usuario que habilita el audio) y última con «Entrar» o «Soy visitante». Usa la misma marca `becafe-bienvenida` del dispositivo.
- RF-196 ya está implementado (`interpretarVoz` → `activa`).
- `src/lib/client/instalacion.ts`: captura `beforeinstallprompt`, detecta `display-mode: standalone` e iOS Safari. `TarjetaInstalacion` (props) en Inicio; «Descartar» envía `?/descartarInstalacion` (marca en la cuenta). Perfil muestra siempre «Instalar la aplicación» con el mismo comportamiento.
- Oferta de avisos: tras cerrar la bienvenida autenticada, si `preferenciaCuenta.ofertaAvisosVista` es falso y el permiso del navegador es `default`, Capsulito muestra «Activar avisos» / «Ahora no». Cualquiera de las dos marca la oferta como vista (`?/ofertaAvisosVista`).

### D10. Fotos de persona y avatar (RF-208, RF-209)

- Columna `usuario.foto_ruta` (anulable). `usuarios.cambiarFoto(ambiente, actor, usuarioId, bytes | null)`: la propia persona o un administrador; `procesarFoto` (RF-005) y `guardarFoto` en `fotos/usuarios/<id>-<ulid>.webp`; borra la anterior tras confirmar; auditoría `usuario.foto_cambiada` / `usuario.foto_quitada`.
- `src/routes/fotos/usuarios/[usuarioId=ulid]/+server.ts`: solo miembros con sesión; `Cache-Control: private`.
- `Avatar` acepta `fotoUrl` y `colorId`. Sin foto, iniciales sobre `--avatar-1` a `--avatar-6` (tokens nuevos cálidos, claro y oscuro, contraste ≥ 4,5:1 con `--ink`, comprobado por `generate-tokens`). El índice es un hash estable del `usuarioId` (`lib/shared/avatar.ts`, función pura con prueba).

### D11. Privacidad versión 2

- `VERSION_PRIVACIDAD = 2` y el texto de `lib/shared/privacidad.ts` igual que el anexo A v2. Cada miembro vuelve a aceptarla al entrar (RF-160).
- `/visita/[token]` muestra la sección «Visitantes» antes del campo del nombre.

### D12. Registro técnico (XVI)

Códigos nuevos en los catálogos de `auth` y `economia`: `visitante.enlace_creado`, `visitante.enlace_revocado`, `visitante.visita_abierta`, `visitante.enlace_no_valido` (warn), `visitante.limite_superado` (warn), `cafe_visitante.registrado`, `cafe_visitante.revisado` (`decision`, `cantidad`), `cafe_visitante.anulado`, `visitante.nombre_eliminado`, `aportacion.en_nombre_de`, `usuario.foto_cambiada`. Campos solo con identificadores y recuentos. `redact` ya cubre `*.nombre` y `*.token`.

## Pruebas previstas (`docs/pruebas.md` §14)

| Regla | Nivel | Prueba |
| --- | --- | --- |
| CA-189, CA-190, EV-103 | Integración + E2E + `acceso` | Crear, revocar y caducar enlaces con reloj simulado; visitante sin acceso a rutas de miembro |
| CA-191, CA-192 | Integración + E2E | Café pendiente sin efectos; idempotencia por `cliente_id`; aviso a administradores |
| CA-193, RN-086, EV-104 | Integración + concurrencia (`worker_threads`) + propiedades | Aprobar, rechazar, anular; dos aprobaciones simultáneas; EV-030 ampliado con cafés aprobados |
| CA-194 | E2E `acceso` | Visitante en `/saldos`, `/estadisticas`, `/historial` |
| CA-195, CA-196 | Componente + E2E | `Bienvenida` antes de entrar; voz por defecto (ya cubierta en `apariencia.test.ts`) |
| CA-197, CA-198, EV-106 | Acción con evento falso + E2E + `sin-js` | Compra de 3 líneas; diálogo; paso intermedio sin JS; saldo cambiado entre confirmación y envío |
| CA-199, CA-200, EV-105 | Integración + acción + E2E | Totales por persona; aportación en nombre de otro; rechazo para miembros |
| CA-201, CA-202 | Integración + E2E + `a11y` | `leerEquipo` con visitantes y por persona; evolución de hucha por mes; periodo sin JS; tablas equivalentes |
| CA-203, CA-204, CA-205 | Unidad (catálogo completo) + componente (`AyudaPanel`, `TourInicio`) + E2E | Foco, `Esc`, sin JS a `/ayuda#id`; tour visto en la cuenta |
| CA-206, CA-207 | Componente + E2E (Chromium con `beforeinstallprompt` simulado) | Tarjeta y descarte por cuenta; oferta de avisos una vez |
| CA-208, CA-209 | Integración + E2E + unidad (`avatar.ts`) + `a11y` | Subida, rechazo de 6 MB y no imagen, foto quitada por admin, color estable |
| CA-210 | Integración + E2E | Eliminación irreversible del nombre; auditoría sin nombre |

Cada pantalla nueva entra en `a11y` (claro y oscuro) y en `acceso` (EV-050).

## Lotes de implementación

1. **Datos y núcleo**: migración 0007; `auth` (enlaces y visitas); `economia` (café de visitante, aportación en nombre de otro, evolución de hucha); `usuarios` (`preferencia_cuenta`, foto). Pruebas de integración y concurrencia.
2. **Visitantes en pantalla**: hooks, `(visita)`, `/visitantes`, `/admin/visitantes`, QR, avisos, privacidad v2. E2E, `acceso`, `sin-js`.
3. **Compras y aportaciones**: cuadrícula, `ConfirmDialog`, paso intermedio; aportación «Para» y totales en Saldos.
4. **Estadísticas**: consultas, `LineChart`, pantalla nueva.
5. **Ayuda y primer contacto**: catálogo, `AyudaPanel`, `TourInicio`, bienvenida antes de entrar, instalación, oferta de avisos.
6. **Fotos y avatar**: tokens, `Avatar`, ruta de foto, Perfil y Usuarios.
7. **Cierre**: `ARCHITECTURE.md`, `docs/pruebas.md`, `historias.md` §10.3/§10.4 (con autorización), benchmark completo y revisión manual con VoiceOver y TalkBack.

## Cambios en otros documentos

- `ARCHITECTURE.md` §3: tablas nuevas de `auth`, `economia` y `usuarios`; §2: `(visita)`, `lib/shared/ayuda/`, `lib/client/instalacion.ts`, `plataforma/qr.ts`; §11: `uqr` en su único archivo.
- `docs/pruebas.md`: rutas nuevas en `acceso` y `a11y`.
- `historias.md` §10.3 (`uqr`), §10.4 (tablas) y §10.5 (rutas): un CAMBIO-020 con autorización al cerrar F10.
- `e2e/acceso/rutas.ts`: rutas nuevas.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Un enlace de visitante se filtra y alguien llena la cola de pendientes | Caducidad de 24 h, revocación, límite de frecuencia, rechazo múltiple. Nada cambia sin aprobación. |
| La reaceptación de la privacidad v2 molesta a los miembros | Es obligatoria por RF-160; se anuncia con Capsulito y un solo paso. |
| `beforeinstallprompt` no existe en Safari ni en Firefox | La tarjeta muestra instrucciones en iOS y se oculta donde no se puede instalar. |
| Los gráficos sin librería quedan pobres | `BarChart` y `LineChart` en SVG con los tokens de datos y la guía de visualización; tablas equivalentes. |
| El tour se rompe al cambiar la maqueta de Inicio | Anclas `data-tour` con prueba de componente que falla si falta un ancla. |

## Complexity Tracking

Sin infracciones de la constitución que justificar.
