# Tareas: Inicio centrado en el café, Capsulito gamberro y pulido de la interfaz (F11)

**Entrada**: [plan.md](plan.md) (aprobado el 2026-10-25), [spec.md](spec.md) (aprobada el 2026-10-25), [frases.md](frases.md), [data-model.md](data-model.md), [contracts/formularios.md](contracts/formularios.md), [research.md](research.md), `historias.md` v0.22.0 (CAMBIO-022) y constitución 1.8.0.

**Requisito previo**: F1 a F10 terminadas.

**Pruebas**: obligatorias (constitución VIII). Cada `CA-211` a `CA-237` y `EV-107` a `EV-111` queda cubierto por al menos una prueba que lo cite en su descripción. `/ajustes` entra en `acceso` (EV-050) y en `a11y` (claro y oscuro). Los fallos corregidos (CA-211, CA-212, CA-228, CA-229) se reproducen con una prueba en rojo **antes** de corregirlos.

**Verificación por lote** (AGENTS.md §7): `npm run test:changed`, `npm run lint:changed`, `npm run check` y, si toca interfaz, `npm run test:e2e:quick -- <spec>` con la build reconstruida. `npm run verify` tras la migración, `plataforma/` o contratos públicos. No ejecutar lint y pruebas a la vez. Anotar cada ejecución en `.local/verification/runs.jsonl`.

## Formato: `[ID] [P?] [Historia] Descripción`

---

## Fase 1: Preparación

- [X] T001 [P] Crear `src/lib/shared/mascota/frases.ts` con `FRASES_REGISTRO` y `FRASES_SALUDO` (80 cada una, `readonly { id: 'registro_NN' | 'saludo_NN'; texto; textoVoz; pose: Pose }[]` con `as const` y tipos literales). `texto` es copia literal de `specs/011-inicio-cafe-capsulito/frases.md` (sin las comillas «» ni el número). `textoVoz` = el mismo texto con etiquetas de expresión de ElevenLabs v3 (`[laughs]`, `[excited]`, `[whispers]`, `[shouts]`, `[sighs]`, `[sarcastic]`, `[surprised]`…) sin cambiar ninguna palabra. Pose elegida según el tono de cada frase entre `POSES`. El archivo no importa nada salvo tipos de `./momentos` (sintaxis borrable: lo importa `scripts/generar-voces.mjs` con Node 24). Exportar `IDS_REGISTRO`, `IDS_SALUDO` y `buscarFrase(id)`.
- [X] T002 [P] Prueba `src/lib/shared/mascota/frases.test.ts` (`CA-237`): lee `specs/011-inicio-cafe-capsulito/frases.md`, extrae las 160 frases y comprueba que cada `texto` es idéntico y en el mismo orden; que `textoVoz` sin las etiquetas `[...]` y sin espacios repetidos es igual a `texto`; ids únicos; 80 + 80.
- [X] T003 [P] Añadir los tokens de movimiento de la guía en `src/app.css` y `docs/diseno/` (`--motion-icon-pop-scale: 1.08`, `--motion-check-length: 32`, `--motion-shake-distance`, `--motion-switch-squish: .88`, `--motion-spotlight-size: 15rem`, `--motion-spotlight-border: 2px`, `--motion-spotlight-strength: 45%`) y el token de superficie `--wall-raised` (claro y oscuro, contraste del texto ≥ 4,5:1 medido) con su utilidad `bg-wall-raised`.

---

## Fase 2: Fundamentos (bloquean US1 y US3)

- [X] T004 Añadir en `src/lib/server/usuarios/esquema.ts` la tabla `frase_entregada` (`usuario_id` → `usuario.id`, `lista` con `CHECK (lista IN ('registro','saludo'))`, `ciclo` integer «≥ 1», `frase_id` text, `entregada_en` text ISO; PK `(usuario_id, lista, ciclo, frase_id)`; índice `(usuario_id, lista, entregada_en)`). Generar con `npm run db:generate` y renombrar a `drizzle/0008_f11-frases.sql`; comprobar que solo contiene `CREATE TABLE` y `CREATE INDEX` (constitución XIV).
- [X] T005 [P] Crear `src/lib/server/usuarios/dominio/ciclo-frases.ts` con `siguienteFrase(catalogo, entregadas, cicloActual, azar)` → `{ fraseId, ciclo }` (RN-088: azar entre las no entregadas del ciclo; ids entregados fuera del catálogo se ignoran; sin disponibles → `ciclo + 1` con todo el catálogo). Pruebas de propiedades con `fast-check` en `ciclo-frases.test.ts` (`CA-215`: n llamadas sin repetir; la n + 1 sube el ciclo; nunca fuera del catálogo).
- [X] T006 Crear `src/lib/server/usuarios/frases.ts` con `entregarFrase(ambiente, usuarioId, lista)` → `{ fraseId }` (una transacción: ciclo actual, entregadas, `siguienteFrase`, insertar, borrar ciclos `< actual − 1`), `leerSaludoDisponible(db, usuarioId, ahora)` → boolean (RN-089: sin saludo o último hace ≥ 2 h) y `entregarSaludo(ambiente, usuarioId)` → `{ fraseId } | null` (comprueba las 2 h dentro de la transacción). Exportar en `src/lib/server/usuarios/index.ts`.
- [X] T007 Pruebas de integración en `src/lib/server/usuarios/frases.test.ts` con SQLite real y reloj simulado: `CA-215` (80 sin repetir y ciclo nuevo; otra persona tiene su propio ciclo), `CA-214` (saludo a las 0 h, ninguno a 1 h 59 min, otro a 2 h), frases retiradas del catálogo ignoradas. Prueba de concurrencia `EV-108` en `src/lib/server/usuarios/frases-concurrencia.test.ts` con `worker_threads` (dos entregas simultáneas → frases distintas y dos filas).
- [X] T008 Añadir los códigos de evento en `src/lib/server/plataforma/registro.ts`: `frase.entregada` (debug) `{ usuarioId, lista, fraseId, ciclo }`, `frase.ciclo_reiniciado` (info) `{ usuarioId, lista, ciclo }`, `frase.fallo` (error), `consumo.confirmacion_sin_stock` (info) `{ tipoCapsulaId }`; y el código de error `CONFIRMAR_SIN_STOCK` con su mensaje en `src/lib/shared/textos.ts`. Ampliar `registro.test.ts` (un campo `texto` en `frase.entregada` falla). Ejecutar `npm run verify`.

**Punto de control**: migración aplicada, ciclo probado con propiedades y concurrencia, `npm run verify` correcto.

---

## Fase 3: Historia 2 — Fallos de compras, navegación y tour (P1)

**Objetivo**: restablecer F10. **Prueba independiente**: compra con una línea sin importe, contar enlaces de la navegación, «Repetir el tour» en Inicio.

- [X] T009 [US2] Prueba en rojo: en `src/lib/shared/contratos/economia.test.ts` y `src/routes/(app)/compras/page.server.test.ts`, `CA-211` (cantidad 16 e importe vacío o `0` → error `importe.<i>` con código `IMPORTE_OBLIGATORIO`, sin respuesta de confirmación de hucha). E2E en `e2e/flujos/compras-f11.spec.ts`: `CA-211` (sin diálogo, error en el campo, foco en él) y `CA-212` (con el diálogo abierto, un error del servidor deja el diálogo cerrado y el resumen de errores visible con el foco). Variante sin JavaScript en `e2e/sin-js/compras-f11.spec.ts` (`EV-107`).
- [X] T010 [US2] Corregir: regla en el esquema de compra de `src/lib/shared/contratos/economia.ts` antes del cálculo de hucha; validación previa en `src/routes/(app)/compras/+page.svelte` que marca el campo y no abre `ConfirmDialog`; cerrar el diálogo con cualquier resultado del envío y llevar el foco al resumen (`role="alert"`, `tabindex="-1"`). Revisar los demás usos de `ConfirmDialog` con envío (`grep -rn ConfirmDialog src/routes`) para que tampoco tapen errores (RF-212).
- [X] T011 [US2] Prueba en rojo `CA-229` en `e2e/flujos/navegacion-f11.spec.ts`: en 1440 px, por rol, cada destino aparece una vez en `aside nav` y en la navegación de administración, también con el diálogo de compras abierto y tras un envío fallido. Diagnosticar la causa (research R6), corregirla en `src/lib/ui/AppNav.svelte` o en `src/routes/(app)/+layout.svelte`, y documentar la causa en el commit. Cambiar la etiqueta corta de Configuración a «Config.». **Resultado**: con el código actual no se reproduce el duplicado (la prueba `CA-229` pasa en 1280 y 1440 px, con el diálogo abierto y tras cancelar); queda como prueba de regresión. La captura `5.png` es anterior a la corrección de T010. La etiqueta corta de Configuración pasa a «Config.».
- [X] T012 [US2] Prueba en rojo `CA-228` en `e2e/flujos/ayuda.spec.ts` (con JavaScript) y `e2e/sin-js/experiencia-capsulito.spec.ts`: en `/`, abrir la ayuda, «Repetir el tour» → paso 1 de 4 visible y panel cerrado. Corregir según research R7 en `src/lib/ui/AyudaPanel.svelte` y `src/routes/(app)/+page.svelte` (con JavaScript: cerrar el `Sheet` y reabrir el tour sin navegar; sin JavaScript: GET a `/?tour=si`). Prueba de componente en `src/lib/ui/AyudaPanel.svelte.test.ts`. **Resultado**: el defecto no se reprodujo en Chromium móvil, Chromium escritorio ni WebKit con el flujo de la prueba; se aplica la corrección prevista de R7 (con JavaScript, la ayuda cierra el panel y reabre el tour sin navegar) y quedan las pruebas `CA-228` como regresión.

**Punto de control**: las cuatro pruebas en rojo pasan a verde.

---

## Fase 4: Historia 1 — Inicio centrado en las cápsulas (P1) 🎯 MVP

**Objetivo**: Capsulito arriba, cápsulas con «Sin stock» confirmable y «Quedan pocas», resto debajo. **Prueba independiente**: tres tipos (stock alto, bajo y 0) con y sin JavaScript.

- [X] T013 [US1] Ampliar `registrarConsumo` en `src/lib/server/economia/consumos.ts`: `DatosConsumo` añade `sinStockVisto?: boolean` y `confirmado?: boolean`; si el stock real es ≤ 0, `sinStockVisto` y no `confirmado`, lanza `ErrorDeNegocio('CONFIRMAR_SIN_STOCK')` sin escribir nada. `/api/consumos` no pasa estos campos (comportamiento actual). Pruebas en `src/lib/server/economia/consumos.test.ts`: `CA-217` (sin confirmar → rechazo sin efectos; confirmado → stock −1 y descuadre como CA-017; tarjeta cargada con stock y stock real 0 → se registra con un toque).
- [X] T014 [US1] Ampliar `esquemaConsumirForm` (`src/lib/shared/contratos/consumos.ts`) con `sinStock: z.literal('1').optional()`, `confirmarSinStock: z.literal('si').optional()` y `mascota: z.literal('si').optional()`. En la acción `consumir` de `src/routes/(app)/+page.server.ts`: pasar los campos; traducir `CONFIRMAR_SIN_STOCK` a `fail(409, { confirmarSinStock: { tipoCapsulaId, nombre, clienteId } })`. Pruebas con evento falso en `src/routes/(app)/page.server.test.ts` (`CA-217`).
- [X] T015 [P] [US1] `src/lib/ui/CapsuleTile.svelte`: `level === 'out'` → superficie atenuada sin bajar el contraste del texto, icono `PackageX` y texto visible «Sin stock», campo oculto `sinStock=1`; `level === 'low'` → icono `TriangleAlert` y «Quedan pocas»; prop `onconfirmar?: (formulario) => void` que, con JavaScript, intercepta el envío de una tarjeta `out` (propio o invitado). Textos en `textos.ts`. Pruebas en `CapsuleTile.svelte.test.ts` (`CA-217`, `CA-218`).
- [X] T016 [US1] Reordenar `src/routes/(app)/+page.svelte` (RF-216): Capsulito grande arriba (`CapsulitoInicio`, bocadillo `aria-live="polite"`), cápsulas en `principal`, `AlertsPanel`, agua, visitantes y últimos consumos en `secundario`; en móvil, en ese orden. Conservar las anclas `data-tour`. Diálogo `ConfirmDialog` de stock 0 con el texto de RF-217, «Sí, registrar» y «Cancelar»; al confirmar envía con `confirmarSinStock=si`. Sin conexión: la misma pregunta antes de encolar. Panel intermedio sin JavaScript a partir de `form.confirmarSinStock`.
- [X] T017 [US1] Estado del bocadillo de Inicio (plan D1): `mensaje` con prioridad saludo → stock bajo → reposo; lo sustituyen la frase de registro, el agua (`agua.confirmada`, `agua.rechazada_reciente`), la sincronización y la pérdida de conexión. `CA-219`: el agua se ve en el bocadillo y se anuncia. **Resultado**: `decir(momento)` fija el evento en el bocadillo (`role="group"` «Capsulito», `aria-live="polite"`); la prioridad del saludo se añade en T020.
- [X] T018 [US1] E2E en `e2e/flujos/inicio-f11.spec.ts`: `CA-216` (orden en 390 y 1440 px), `CA-217` (diálogo, cancelar, confirmar, «Deshacer»), `CA-218`, `CA-219`. Sin JavaScript en `e2e/sin-js/inicio-f11.spec.ts` (`CA-217`, `EV-107`: página intermedia). Medir el tiempo de Inicio en WebKit antes y después (`docs/pruebas.md` §12.3) y anotarlo. Actualizar las referencias de regresión visual de Inicio. **Resultado**: `chromium-movil` completo en verde salvo lo corregido (precarga de la pose sin conexión en el `<head>`; `experiencia-capsulito` confirma el toque de invitado con stock 0). WebKit: specs nuevas en verde; `CA-218` falló una vez en una tanda larga y pasó 6/6 al repetirlo. No se midió el tiempo de Inicio en WebKit «antes» (sin línea base) y el repositorio no tiene pruebas de regresión visual que actualizar.

**Punto de control**: Inicio usable con los tres estados de stock, con y sin JavaScript.

---

## Fase 5: Historia 3 — Frases de registro y saludo sin repetir (P2)

**Objetivo**: cada café confirmado y cada saludo usan las frases del anexo sin repetir por persona. **Prueba independiente**: registrar cafés y abrir Inicio con reloj simulado.

- [X] T019 [US3] Acción `consumir`: si el consumo es nuevo y llega `mascota=si`, llamar a `entregarFrase(ambiente, actor.usuarioId, 'registro')` fuera de la transacción del consumo; un error se registra (`frase.fallo`) y devuelve `fraseId: null` sin afectar al consumo. Acción nueva `?/saludo` con `entregarSaludo`. `load` añade `saludoDisponible` (`leerSaludoDisponible`). Pruebas con evento falso (`CA-213`: consumo propio y de invitado devuelven `fraseId`; sin `mascota` no; duplicado no; `CA-214`: `?/saludo` dos veces seguidas → la segunda `null`).
- [X] T020 [US3] `src/lib/ui/contextos/mascota.svelte.ts`: `mostrarFrase(fraseId)` (busca en `frases.ts`, devuelve texto y pose, y llama a `hablar(fraseId)`). `src/routes/(app)/+page.svelte`: `use:enhance` de las tarjetas añade `mascota=si` si `mascota.visible`; tras el consumo muestra la frase en el bocadillo (sustituye a `consumo.confirmado` y `consumo.invitado_confirmado`); tras montar, si `saludoDisponible` y la mascota es visible, envía el formulario oculto `?/saludo` y muestra el saludo; el aviso de stock bajo va después. Retirar las variantes antiguas de `momentos.ts` (dejar el texto base como respaldo sin mascota). **Resultado**: `mascota.mostrarFrase`, `mascota=si` en el envío y saludo con `?/saludo` tras montar (a los 6 s vuelve el aviso de stock bajo). Las variantes antiguas de `consumo.confirmado` y `consumo.invitado_confirmado` ya no se muestran con frase del servidor, pero siguen en `momentos.ts` (respaldo y aviso «Deshacer»): retirarlas cambia el catálogo de voces y se hace con T043.
- [X] T021 [US3] E2E en `e2e/flujos/frases.spec.ts`: `CA-213` (frase del anexo tras un café propio y otro de invitado; sin conexión «Pendiente de enviar» sin frase; con la mascota oculta, sin frase), `CA-214` (saludo y después el aviso de stock bajo; recarga sin saludo), `CA-215` (dos contextos de navegador con la misma cuenta no repiten). Prueba de componente del bocadillo con `aria-live`. **Resultado**: 5 pruebas en `e2e/flujos/frases.spec.ts` en Chromium y WebKit; `aria-live="polite"` comprobado en la E2E, no con prueba de componente porque el atributo vive en la página.

**Punto de control**: frases y saludo visibles, sin repetir y sin retrasar la confirmación (medir p95 en `perf` si existe el escenario).

---

## Fase 6: Historia 4 — Ajustes, Perfil, avatar, alta con foto y privacidad (P2)

**Objetivo**: sección Ajustes para todos, Perfil a dos columnas, avatar ilustrado, foto en el alta y privacidad v3.

- [X] T022 [US4] Crear `src/routes/(app)/ajustes/+page.server.ts` y `+page.svelte` (plan D5): Apariencia (`ThemeToggle`, «Reducir transparencia»), Capsulito (mostrar, voz, ver la bienvenida), Avisos (mover `SeccionAvisos.svelte` y la acción `preferencia` desde Perfil) e Instalar. Estados vacío, cargando, error y sin conexión. Perfil conserva `?/preferencia` con `redirect(308, resolve('/(app)/ajustes'))` y un comentario con la versión en que se retira. Entrada `ajustes` en `src/lib/shared/ayuda/pantallas.ts`; actualizar `perfil`.
- [X] T023 [US4] Navegación: «Ajustes» (`Settings2`) tras Perfil en el carril y la barra lateral de `src/routes/(app)/+layout.svelte`; en móvil, Perfil activo en `/ajustes`; primera fila de Perfil enlaza a Ajustes. Añadir `/ajustes` a `e2e/acceso/rutas.ts` (`EV-111`) y a `a11y`.
- [X] T024 [US4] Perfil (`src/routes/(app)/perfil/+page.svelte`) en dos columnas a ≥ 1024 px: datos y foto | contraseña y sesiones; sin los ajustes movidos. E2E en `e2e/flujos/ajustes.spec.ts`: `CA-220` (miembro ve Ajustes y no Configuración; los ajustes funcionan y se guardan como antes), `CA-221`.
- [X] T025 [P] [US4] Ilustraciones del avatar: 8 componentes SVG de un trazo con `currentColor` en `src/lib/ui/avatares/` (taza, cápsula, grano, cafetera, molinillo, vaso para llevar, cruasán, cucharilla) e índice `src/lib/ui/avatares/index.ts`. `ilustracionAvatar(usuarioId)` en `src/lib/shared/avatar.ts` (FNV-1a con otra semilla, módulo 8) con prueba en `avatar.test.ts` (`CA-222`: estable y repartida). `Avatar.svelte` pinta la ilustración en lugar de las iniciales. Prueba de componente en `Avatar.svelte.test.ts` y página de muestra para la revisión de la persona usuaria en `/ayuda/capsulito` (laboratorio existente).
- [X] T026 [US4] Alta con foto (RF-223): `usuarios.darDeAlta` acepta `foto?: Uint8Array` (procesar con `procesarFoto` antes de la transacción, guardar, borrar si el alta falla); acción `alta` de `src/routes/(app)/admin/usuarios/+page.server.ts` con `multipart/form-data` y el esquema de foto de F10; `valores` sin el archivo; aviso sin JavaScript para volver a adjuntarla. Pruebas: integración (`CA-223`: alta con JPEG válido guarda la foto; 6 MB rechaza el alta y no crea la persona ni deja archivo), acción y `e2e/sin-js/alta-usuario.spec.ts` (`EV-107`).
- [X] T027 [P] [US4] Privacidad v3: `VERSION_PRIVACIDAD = 3` y el texto de `src/lib/shared/privacidad.ts` igual que el anexo A v3 de `historias.md` (responsable, gestor y el elemento de las frases ya dichas). Actualizar `src/lib/shared/privacidad.test.ts` (`CA-224`) y la E2E de relectura.

**Punto de control**: Ajustes y Perfil en `a11y` sin infracciones; ilustraciones enseñadas a la persona usuaria.

---

## Fase 7: Historia 5 — Capsulito en la pantalla de entrada (P2)

**Objetivo**: Capsulito mira, se tapa, se entristece y celebra. **Parada obligatoria** para revisar capturas antes de integrar (DEC-123).

- [ ] T028 [US5] Crear el proyecto RML en `docs/diseno/f11/rive/entrada/` con `~/.rive/bin/rive create` (no llamar al directorio `login`), consultar `rive docs` y `rive schema` y construir el artboard `Entrada` desde `static/mascota/svg/capsulito-*.svg` con la máquina de estados `Entrada` y las entradas `mirarX` (0–100), `taparOjos` (booleano), `fallo` y `exito` (disparadores) y `reducedMotion` (booleano). Compilar con `~/.rive/bin/rive ./docs/diseno/f11/rive/entrada --once` y `--verify`. Copiar el `.riv` a `static/mascota/riv/capsulito-entrada.riv`. Añadir un `LEEME.md` con los comandos.
- [ ] T029 [US5] Generar capturas de cada estado (`--screenshot --advance=1`: reposo, mirando a la izquierda y a la derecha, ojos tapados, triste, celebrando) en `docs/diseno/f11/rive/entrada/capturas/` y **detenerse para que la persona usuaria las revise**. Si el RML no permite alguna entrada, detenerse y proponer la alternativa SVG con CSS (research R10).
- [ ] T030 [US5] Tras la aprobación: `montarRiveEntrada()` en `src/lib/client/rive.ts` (único archivo que importa `@rive-app/canvas`), `src/lib/ui/CapsulitoEntrada.svelte` (props `mirarX`, `taparOjos`, `estado`, `reducido`; SVG estático hasta cargar; decorativo) y su uso en `src/routes/(auth)/login/+page.svelte` (cursor del correo, foco de la contraseña, resultado de `use:enhance`; en `redirect`, disparar `exito` y aplicar sin esperar). Pruebas de componente (`CA-225`) y E2E en `e2e/flujos/entrada.spec.ts` (estados y respaldo estático con `reducedMotion: 'reduce'` y sin JavaScript).

---

## Fase 8: Historia 6 — Pantallas de escritorio, saldos, estadísticas y agua (P2)

- [ ] T031 [P] [US6] Ficha de cápsula `src/routes/(app)/admin/capsulas/[capsulaId=ulid]/+page.svelte` y `nueva/+page.svelte` en dos columnas a ≥ 1024 px (`CA-230`).
- [ ] T032 [P] [US6] Detalle de compra `src/routes/(app)/compras/[compraId=ulid]/+page.svelte`: líneas y resumen en `lg:grid-cols-[2fr_1fr]`; motivo de anulación `max-w-md` y botón con su ancho (`CA-230`).
- [ ] T033 [P] [US6] Saldos `src/routes/(app)/saldos/+page.svelte`: filas en rejilla con importes alineados a la derecha y `tabular-nums`; columna derecha sobre `Section` con `border border-hairline bg-wall-raised` (`CA-231`).
- [ ] T034 [P] [US6] Estadísticas: `<details open>` en cada «Ver datos» (`CA-232`).
- [ ] T035 [US6] E2E en `e2e/flujos/maquetacion-f11.spec.ts` (`CA-230` a `CA-232`, 390 y 1440 px) y referencias de regresión visual de esas pantallas.

---

## Fase 9: Historia 7 — Errores con Capsulito y narración (P3)

- [ ] T036 [US7] Páginas de error (RF-226): `ErrorKind` con `peticion`; textos gamberros en `textos.errorPagina` (400, 403, 404, 500) con qué ha pasado y qué hacer; momentos `error.peticion`, `error.sin_permiso`, `error.no_encontrada`, `error.servidor` en `momentos.ts`; `src/routes/+error.svelte` con `ErrorPage` y la correspondencia de `contracts/formularios.md`; la 500 muestra `page.error.codigo`. E2E y `a11y` en `e2e/flujos/errores.spec.ts` (`CA-226`).
- [ ] T037 [US7] Narración (RF-227): `TourInicio.svelte` y `AyudaPanel.svelte` muestran `Capsulito` (pose por paso o pantalla) junto al texto y llaman a `hablar('tour_0N')` / `hablar('ayuda_<pantalla>')` con la voz activa. Pasos del tour con `id` estable y pose. Pruebas de componente (`CA-227`).

---

## Fase 10: Historia 8 — Microinteracciones (P3)

- [ ] T038 [P] [US8] Campos (RF-233): haz de foco, sacudida única al aparecer el error (clase que se reinicia con cada error nuevo) y entrada del mensaje en `TextField`, `MoneyField`, `PasswordField` y `SelectField` (este, solo sacudida y mensaje). Pruebas de componente (`CA-233`).
- [ ] T039 [P] [US8] Selección y navegación (RF-234): respuesta de `Switch`, casillas y radios; acción `src/lib/ui/movimiento/indicador.ts` (`ResizeObserver` + `MutationObserver`, variables CSS, desconecta al desmontar) en `SegmentedControl` y `ThemeToggle`; selección visible antes de hidratar. Pruebas de componente (`CA-234`).
- [ ] T040 [P] [US8] Brillo (RF-235): acción `src/lib/ui/movimiento/spotlight.ts` (solo con `(pointer: fine)`, `::before` con máscara, sin estado de Svelte por movimiento) en las tarjetas opacas (`Section` con borde, `ListRow` de tarjeta); nunca en `glass`. Prueba de componente (`CA-235`).
- [ ] T041 [P] [US8] Éxito y cifras (RF-236): prop `success` de `Button` con check de Lucide (`stroke-dashoffset`), activada por la página solo con `result.type === 'success'` y apagada a los 1,2 s (Perfil, Ajustes, Configuración, ficha de cápsula); `src/lib/ui/movimiento/cifra.svelte.ts` (interpolación de 240 ms con `requestAnimationFrame`, continúa desde el valor visible, valor accesible final) en `Money` de saldo y hucha y en `KpiTile`. Pruebas de componente (`CA-236`).
- [ ] T042 [US8] E2E `e2e/flujos/movimiento.spec.ts` con `reducedMotion: 'reduce'` (`EV-110`): ninguna animación de movimiento en curso en Inicio, entrada, Ajustes y compras (`document.getAnimations()`), y la selección, el foco y la confirmación siguen visibles.

---

## Fase 11: Voces (RF-237)

- [ ] T043 Catálogo de locuciones: `scripts/generar-voces.mjs` construye `LOCUCIONES` con las entradas actuales que siguen vigentes, las 160 de `src/lib/shared/mascota/frases.ts`, los 4 pasos del tour (`tour_01..04`) y el propósito de las 32 pantallas de ayuda (`ayuda_<pantalla>`, desde `src/lib/shared/ayuda/pantallas.ts`). Retirar `consumo_confirmado_*` y `consumo_invitado_*`. Ampliar `scripts/voces-interactivo.test.ts` (`CA-237`: ids únicos, 196 nuevas, grupos `registro`, `saludo`, `tour`, `ayuda` en el menú). No generar audios.

---

## Fase 12: Cierre

- [ ] T044 `ARCHITECTURE.md` (§2, §3: `frase_entregada`, `usuarios/dominio/`, `lib/ui/avatares/`, `lib/ui/movimiento/`, `/ajustes`, fuente RML), `docs/pruebas.md` (rutas en `acceso` y `a11y`, tiempo de Inicio en WebKit), `docs/diseno/` (tokens y uso del brillo y el indicador).
- [ ] T045 `a11y` completo de las pantallas tocadas en claro y oscuro (`EV-109`): Inicio con los tres estados, Ajustes, Perfil, alta de usuario, entrada y errores.
- [ ] T046 Pedir autorización y registrar en `historias.md` un CAMBIO (con respaldo en `.respaldos/`) para §10.4 (`frase_entregada`) y §10.5 (`/ajustes`, `?/saludo`).
- [ ] T047 Benchmark completo en serie (`scripts/benchmark.sh`) y Definition of Done de `docs/pruebas.md` §20.2. Revisión manual con TalkBack (Android) de Inicio, Ajustes, la entrada y una página de error; VoiceOver pendiente por falta de iPhone.

---

## Dependencias y orden

- Fase 1 → Fase 2 → resto. US2 (Fase 3) no depende de la Fase 2 y puede empezar tras la Fase 1.
- US1 (Fase 4) depende de T008 (código `CONFIRMAR_SIN_STOCK`). US3 (Fase 5) depende de US1 (bocadillo y acción `consumir`) y de T006.
- US4, US5, US6 y US8 son independientes entre sí. US7 depende de T001 solo para las poses.
- La Fase 11 depende de T001 y de T037 (ids del tour).
- T029 es una parada: T030 no empieza sin la aprobación de las capturas.

## Paralelismo

- Fase 1: T001, T002 y T003 a la vez.
- Fase 2: T005 en paralelo con T004.
- US6: T031 a T034 a la vez (archivos distintos).
- US8: T038 a T041 a la vez.
- US4, US5 y US6 pueden avanzar a la vez una vez cerrada US1.

## Estrategia

- **MVP**: Fases 1 a 4 (fallos + Inicio con stock 0 confirmable). Ya entrega valor sin frases.
- Después, US3 (frases), luego US4 a US6 y, al final, US7, US8, voces y cierre.
