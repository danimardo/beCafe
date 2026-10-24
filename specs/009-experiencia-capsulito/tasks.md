# Tareas: Experiencia visual, navegación y mascota Capsulito (F9)

**Entrada**: [plan.md](plan.md) (aprobado el 2026-10-24), [spec.md](spec.md) (aprobada el 2026-10-24, Clarifications 1 a 11), [`docs/adr/0006-rive-y-sincronizacion-voz-capsulito.md`](../../docs/adr/0006-rive-y-sincronizacion-voz-capsulito.md) y [`docs/diseno/f9/`](../../docs/diseno/f9/).

**Requisito previo**: F1 a F8 terminadas; activos gráficos (`.webp`, `.svg`, `.riv`) ya copiados en `static/mascota/` y `static/ilustraciones/capsula.svg`; `ELEVENLABS_API_KEY` y `ELEVENLABS_VOICE_ID=TfkjFyM0u8G2kDTCi1Qi` disponibles en `.env`.

**Pruebas**: obligatorias (constitución VIII). Cada criterio `CA-180` a `CA-188` y escenario `EV-101`, `EV-102`, `EV-050` debe quedar cubierto por al menos una prueba automatizada que lo cite.

## Formato: `[ID] [P?] [Historia] Descripción`

---

## Fase 1: Lote F9-L1 — Contratos, catálogo de Capsulito, lip-sync y generación de voces

- [X] T001 Instalar `@rive-app/canvas` (`^2.x`), añadir el script `"voces:generar": "node scripts/generar-voces.mjs"` en `package.json` y añadir la regla `rive-solo-en-adaptador` en `.dependency-cruiser.cjs` para que solo `src/lib/client/rive.ts` pueda importar `@rive-app/canvas`.
- [X] T002 [P] [US5] Ampliar `src/lib/shared/contratos/apariencia.ts` con `CLAVE_MASCOTA` (`becafe-mascota`: `'visible' | 'oculta'`), `CLAVE_VOZ` (`becafe-voz`: `'activa' | 'silenciada'`), `CLAVE_BIENVENIDA` (`becafe-bienvenida`: `'pendiente' | 'vista'`), sus intérpretes (`interpretarMascota`, `interpretarVoz`, `interpretarBienvenida`) y el esquema `esquemaPistaLipSync` para validar los JSON de `static/mascota/voces/*.json`. Añadir pruebas unitarias `CA-180`, `CA-181`, `CA-185` en `src/lib/shared/contratos/apariencia.test.ts`.
- [X] T003 [P] [US3] Crear `src/lib/shared/mascota/lip-sync.ts` con `construirCuesLipSync(alignment)` (mapea caracteres a formas de boca `1..7` ignorando etiquetas expresivas `[...]` de ElevenLabs v3 salvo risas `[laughs]`/`[chuckles]`) y `bocaEnInstante(cues, segundos)` (`0..7`). Añadir pruebas unitarias `CA-187` en `src/lib/shared/mascota/lip-sync.test.ts`.
- [X] T004 [P] [US3] [US4] Crear `src/lib/shared/mascota/momentos.ts` y `src/lib/shared/mascota/bienvenida.ts`: las 8 poses (`saludo`, `celebrando`, `pensando`, `dormido`, `alerta`, `triste`, `cafetera`, `hucha`) y sus alias de plantilla, las 6 expresiones (`feliz`, `orgulloso`, `pensando`, `sorprendido`, `triste`, `dormido`), todos los momentos y los 14 eventos operativos con variantes `{ id, texto, textoVoz }`, las 8 escenas de bienvenida (`intro_01` a `intro_08`), `momentoInicio()`, `elegirVariante()` (rotación sin repetir la misma frase dos veces seguidas), `srcPose()`, `srcSvg()` y `srcRiv()`. Añadir pruebas unitarias `CA-185`, `CA-186` en `src/lib/shared/mascota/momentos.test.ts`.
- [X] T005 [US3] [US4] Crear `scripts/generar-voces.mjs` y ejecutarlo contra ElevenLabs (`eleven_v3`, voz `TfkjFyM0u8G2kDTCi1Qi`) para generar los archivos `.mp3` y `.json` de sincronización labial en `static/mascota/voces/`. Actualizar `src/service-worker.ts` (plan D12) para excluir `*-1024.webp` y `/mascota/voces/*` de la precarga obligatoria manteniendo los SVG, `.webp` (128/256/512) y `.riv`.

---

## Fase 2: Lote F9-L2 — Adaptador Rive, contexto `EstadoMascota` y componentes de interfaz (`src/lib/ui/`)

- [X] T006 [US3] [US5] Actualizar `src/app.html` para aplicar `data-mascota` (`visible` | `oculta`) antes del primer pintado, crear `src/lib/client/rive.ts` (adaptador único de `@rive-app/canvas` y reproductor de voz con lip-sync `reproducirVozSincronizada`) y crear `src/lib/ui/contextos/mascota.svelte.ts` (`EstadoMascota`, `crearContextoMascota`, `usarMascota`). Ampliar `src/lib/ui/contextos/avisos.svelte.ts` con `momento` y `celebrar()`.
- [X] T007 [P] [US1] Crear `src/lib/ui/PanelGrid.svelte` y actualizar `src/lib/ui/types.ts`, `src/lib/ui/AppNav.svelte` (píldora móvil, carril `768–1023 px` con `short` y barra lateral `≥ 1024 px`) y `src/lib/ui/AppShell.svelte` (soporte `width?: 'normal' | 'panel' | 'wide'` y eliminación del segundo `ToastRegion` duplicado).
- [X] T008 [P] [US2] Crear `src/lib/ui/CapsuleIllustration.svelte`, actualizar `src/lib/ui/CapsuleImage.svelte` (`size="xl"` y respaldo con `CapsuleIllustration` si no hay foto o falla `onerror`), actualizar `src/lib/ui/AlertsPanel.svelte` (iconos `PiggyBank` y `Wallet`, avisos agrupados) y crear `src/lib/ui/CapsuleTile.svelte` con formulario `<form method="post" action="?/consumir">` y dos botones `type="submit"` (`invitado="0"` e `invitado="1"`), contadores `User`/`Users` cuando `> 0`, `StockBadge` y precio.
- [X] T009 [P] [US3] [US4] Crear `src/lib/ui/Capsulito.svelte` (imagen SVG/WebP decorativa `alt=""` como base inmediata + `<canvas>` Rive superpuesto, bocadillo `glass-strong`, respeto a `prefers-reduced-motion` y `mascota.visible` con `fallback`), crear `src/lib/ui/Bienvenida.svelte` (diálogo de 8 escenas `intro_01..08` con controles «Saltar», «Anterior / Siguiente» y «Activar voz / Silenciar»), actualizar `EmptyState.svelte`, `ErrorPage.svelte` y `UndoToast.svelte` con la prop `momento`, y exportar todo en `src/lib/ui/index.ts`.
- [X] T010 [US1] [US2] [US3] [US4] Añadir pruebas de componentes en Vitest Browser Mode: `src/lib/ui/PanelGrid.svelte.test.ts`, `src/lib/ui/CapsuleTile.svelte.test.ts` (`CA-183`), `src/lib/ui/Capsulito.svelte.test.ts` (`CA-185`, `CA-187`) y `src/lib/ui/Bienvenida.svelte.test.ts` (`CA-185`).

---

## Fase 3: Lote F9-L3 — Layout `(app)`, Inicio, Perfil, Ayuda, laboratorio `/ayuda/capsulito` y pantallas autenticadas

- [X] T011 [US1] [US4] Actualizar `src/routes/+layout.svelte` (`crearContextoMascota()` e `iniciar()`), ampliar `src/routes/(app)/+layout.server.ts` con `usuario: { nombre, rol }` y crear `src/routes/(app)/+layout.svelte` con `AppShell`, `AppNav`, `NotificationBell` y `Bienvenida`.
- [X] T012 [US1] [US2] [US3] Actualizar `src/routes/(app)/+page.server.ts` (contadores `propios` e `invitados` por tipo de cápsula y límite de deuda) y `src/routes/(app)/+page.svelte` (`PageHeader`, `PanelGrid`, `Capsulito` contextual, `AlertsPanel`, cuadrícula de `CapsuleTile`, `WaterRefillCard`, últimos consumos, reacciones de Capsulito en consumos/agua/cola y eliminación del bloque inferior de perfil/logout). Actualizar `src/routes/(app)/page.server.test.ts`.
- [X] T013 [US1] [US5] Actualizar `src/routes/(app)/perfil/+page.svelte` con los interruptores «Mostrar a Capsulito» (`becafe-mascota`), «Voz de Capsulito» (`becafe-voz`), botón «Ver la bienvenida otra vez», enlaces a `/admin` (si es administrador), `/ayuda` y `/ayuda/capsulito`, y el formulario `POST /logout` («Cerrar sesión»).
- [X] T014 [US4] Actualizar `src/routes/(app)/ayuda/+page.svelte` (las 8 escenas de «Cómo funciona beCafé» fijas sin JS, botón «Ver la bienvenida» con JS y enlace a `/ayuda/capsulito`) y crear el laboratorio interactivo en `src/routes/(app)/ayuda/capsulito/+page.server.ts` y `+page.svelte` (`CA-188`).
- [X] T015 [US1] [US3] Revisar el resto de páginas bajo `src/routes/(app)/` (`saldos`, `compras`, `aportaciones`, `historial`, `estadisticas`, `avisos`, `privacidad`, `consumos`, `rellenos`, `admin/*`) para sustituir `<main>` envolventes duplicados por `<div>`, incorporar `momento` en los `EmptyState` y celebraciones en compras/aportaciones.

---

## Fase 4: Lote F9-L4 — Pruebas E2E, `sin-js`, `acceso`, `a11y`, documentación y verificación final

- [X] T016 [US1] [US2] [US3] [US4] [US5] Añadir `/ayuda/capsulito` al manifiesto de `e2e/acceso/rutas.ts` (`EV-050`), actualizar las pruebas E2E existentes afectadas por el nuevo layout y `CapsuleTile`, y crear las pruebas E2E de F9 (`CA-180` a `CA-188`, `EV-101`, `EV-102`) en `e2e/flujos/`, `e2e/sin-js/` y `e2e/a11y/`.
- [X] T017 Actualizar `ARCHITECTURE.md` (§2 `src/lib/shared/mascota/` y `src/lib/client/rive.ts`, §7 preferencias de mascota en `localStorage`, §11 `@rive-app/canvas` en dependencias aisladas).
- [X] T018 Ejecutar `npm run verify` y las suites E2E de Playwright (`chromium-movil`, `chromium-escritorio`, `sin-js`, `acceso`, `a11y`), registrar en `.local/verification/runs.jsonl` y comprobar `git status`.
