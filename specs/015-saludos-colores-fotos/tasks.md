# Tareas: F15 — Mensaje del día de Capsulito, colores y fotos de cápsula, encuadre de fotos y copias más claras

**Fuente:** [spec.md](spec.md) y [plan.md](plan.md), aprobados en la sesión del 2026-10-27. Constitución 1.9.0. Sin benchmark completo al cerrar, salvo que la persona usuaria lo pida.

Las fases son independientes entre sí. Dentro de cada fase, las tareas van en orden. [P] = puede hacerse en paralelo con la anterior (archivos distintos).

## Fase 1: Mensaje del día (US1) — P1

- [x] T001 [US1] **Parada**: escribir los 40 mensajes en `src/lib/shared/mascota/mensajes-dia.ts` (`MENSAJES_DIA`, ids `dia_01` a `dia_40`, `Object.freeze`, forma neutra de género, solo `{nombre}`). Prueba CA-267 en `mensajes-dia.test.ts`. La persona usuaria revisa la lista antes de seguir.
- [x] T002 [US1] Tabla `mensaje_dia` en `src/lib/server/usuarios/esquema.ts` (clave primaria `(usuario_id, dia)`, `CHECK (vuelta >= 1)`, `CHECK (length(dia) = 10)` e índice `(usuario_id, vuelta)`) y migración `drizzle/0009_f15-mensaje-dia.sql` generada con drizzle-kit.
- [x] T003 [US1] Se reutiliza `siguienteFrase` de `src/lib/server/usuarios/dominio/ciclo-frases.ts` (mismo contrato; ya tiene su prueba de propiedades). Sin función nueva.
- [x] T004 [US1] Caso de uso `asignarMensajeDia(ambiente, usuarioId, { hayAviso })` en `src/lib/server/usuarios/mensaje-dia.ts` (día de Madrid, `ON CONFLICT DO NOTHING`, sin escribir con aviso, limpieza de vueltas y evento `mensaje_dia.asignado` sin texto), exportado en `index.ts`. Integración EV-114, CA-266 y CA-268 en `mensaje-dia.test.ts` y concurrencia con `worker_threads` en `mensaje-dia-concurrencia.test.ts`.
- [x] T005 [US1] Inicio: `src/routes/(app)/+page.server.ts` devuelve `mensajeDia` (con `hayAviso` = deuda, stock bajo o aguador). `+page.svelte` pasa el texto formateado a `Capsulito` cuando el momento es `saludo-manana` o `saludo-tarde`. E2E `e2e/flujos/mensaje-dia-f15.spec.ts` (el bocadillo muestra un texto del catálogo, el mismo tras recargar y en `sin-js`).
- [x] T006 [US1] Privacidad versión 4: `VERSION_PRIVACIDAD = 4` en `src/lib/shared/privacidad.ts` y texto del anexo A v4 («los mensajes del día que ya te ha mostrado») en `textos.ts`. Ajustar las pruebas de privacidad afectadas (CA-224).

## Fase 2: Colores de cápsula (US2) — P2

- [x] T007 [US2] `src/lib/shared/capsulas/color-propio.ts`: `luminancia`, `contraste` y `coloresCapsula(hex)` con los colores de referencia de los tokens (research R2: módulo generado junto a `src/tokens.css`). Prueba de propiedades EV-115 y CA-270 en `color-propio.test.ts`.
- [x] T008 [US2] Contrato en `src/lib/shared/contratos/capsulas.ts`: `COLORES_CAPSULA_ELEGIBLES` (7), `cap-rosa` heredado, `colorPropio` `#rrggbb` en minúsculas y la combinación `color=otro` + `colorPropio`. Pruebas CA-271.
- [x] T009 [US2] `catalogo`: rechazar `cap-rosa` en el alta o si el tipo no era rosa (`COLOR_NO_ELEGIBLE`). Leer un color no válido con evento `dato.no_valido` y `cap-intenso`. Pruebas CA-269 de integración. Textos de error en `textos.ts`.
- [x] T010 [US2] Pintado: `estiloColorCapsula` y `colorCapsulaCss` en `src/lib/ui/utils.ts`, y regla de `--cap-propio*` por tema en `src/app.css`. Uso en `CapsuleImage`, `CapsuleIllustration`, `CapsuleTile`, `SplitBar` y `UndoToast`.
- [x] T011 [US2] `CapsuleColorField.svelte`: 7 radios, «Otro color» con `<input type="color">`, «Rosa (color actual)» solo para el tipo rosa y vista previa. Prueba de componente. Uso en `FormularioCapsula.svelte`. E2E `e2e/flujos/colores-f15.spec.ts` (CA-269) y axe en claro y oscuro de alta y edición.

## Fase 3: Quitar la foto de una cápsula (US3) — P2

- [ ] T012 [US3] `quitarFotoTipo` en `src/lib/server/catalogo/fotos.ts` (administrador, transacción con auditoría `capsula.foto_quitada` y `borrarFoto` fuera), exportado en `index.ts`. Integración CA-272.
- [ ] T013 [US3] *Action* `?/quitarFoto` y formulario «Quitar foto» en `src/routes/(app)/admin/capsulas/[capsulaId=ulid]/` (solo con foto; ayuda «guarda antes los cambios»). Prueba con evento falso. E2E y `sin-js` en `e2e/flujos/fotos-f15.spec.ts` y `e2e/sin-js/fotos-f15.spec.ts`.

## Fase 4: Encuadre de fotos (US4) — P2

- [ ] T014 [US4] Contrato `src/lib/shared/contratos/encuadre.ts` (`esquemaEncuadre`, todos o ninguno), incorporado a `capsulas.ts`, `fotos-usuario.ts` y al alta de persona. Pruebas.
- [ ] T015 [US4] `procesarFoto(original, recorte)` en `src/lib/server/plataforma/imagenes.ts` (`'ninguno' | 'centro' | Encuadre`; orientación, comprobación de la zona y `FOTO_ENCUADRE_NO_VALIDO`). Pasar el recorte desde `catalogo`, `usuarios/fotos.ts` y `auth/invitar.ts`; el ticket usa `'ninguno'`. Integración CA-274 (encuadre, centro, zona fuera y JPEG con orientación 6).
- [ ] T016 [US4] Componente `src/lib/ui/EncuadreFoto.svelte` (puntero, rueda, pellizco, flechas, «Ampliar» y «Reducir», `role="status"` con el zoom, `guia` redonda o ninguna, campos ocultos), exportado en `index.ts`. Textos en `textos.ts`. Prueba de componente (teclado, límites y campos ocultos).
- [ ] T017 [US4] Usar `EncuadreFoto` en `admin/usuarios` (alta), `admin/usuarios/[usuarioId]`, `FotoPersona.svelte` (Perfil) y `FormularioCapsula.svelte`. E2E CA-273 (1280 y 390 px) en `e2e/flujos/fotos-f15.spec.ts`; `sin-js` con recorte central; axe en Usuarios y Perfil.

## Fase 5: Copias de seguridad (US5) — P3

- [ ] T018 [US5] Superficies e iconos por sección en `src/routes/(app)/admin/copias/+page.svelte` (plan D5). E2E CA-275 y axe en claro y oscuro en `e2e/a11y/copias-f15.spec.ts`.

## Fase 6: Cierre

- [ ] T019 Documentación: `ARCHITECTURE.md` (tabla `mensaje_dia` en `usuarios`, `color-propio` y `encuadre` en `lib/shared`, `EncuadreFoto`, recorte en `imagenes.ts`) y `docs/pruebas.md` (cómo se prueba F15).
- [ ] T020 `npm run verify` y E2E afectados; anotar en `.local/verification/runs.jsonl`; revisar `git status`.

## Dependencias

- T001 → T004 → T005. T002 → T004. T003 → T004.
- T007 → T010 → T011. T008 → T009 → T011.
- T012 → T013.
- T014 → T015 → T017. T016 → T017.
- T020 después de todas.

## Estrategia

MVP: Fase 1 (lo que más se ve). Después, las fases 2 a 5 en el orden de la lista; cada una se puede entregar y probar por separado.
