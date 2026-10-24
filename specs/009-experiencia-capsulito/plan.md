# Implementation Plan: Experiencia visual, navegación y mascota Capsulito (F9)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md) (aprobada el 2026-10-24)

**Estado**: Plan aprobado por la persona usuaria el 2026-10-24.

**Artefactos**: decisiones D1 a D12 en este archivo; referencia de diseño en [`docs/diseno/f9/`](../../docs/diseno/f9/); contrato de animación y sincronización labial en [`docs/diseno/f9/rive/integracion/CONTRATO.md`](../../docs/diseno/f9/rive/integracion/CONTRATO.md) y [`docs/adr/0006-rive-y-sincronizacion-voz-capsulito.md`](../../docs/adr/0006-rive-y-sincronizacion-voz-capsulito.md).

**Depende de**: F1–F8 completadas (autenticación, catálogo, economía y cola sin conexión, compras y control, notificaciones, historial y estadísticas, operación, relleno de agua y aguador del mes).

## Summary

F9 alinea todas las pantallas autenticadas con el sistema de diseño Latte (navegación persistente `AppShell` + `AppNav` en móvil, tableta y escritorio, rejilla de dos columnas `PanelGrid` con ancho `panel`, tarjeta gráfica `CapsuleTile` con ilustración vectorial e invitado en un toque, limpieza de textos en alertas y tarjetas) e incorpora la experiencia interactiva completa de la mascota **Capsulito** estilo Duolingo:

1. **Animaciones vectoriales Rive (`.riv` v0.2.0)** con máquina de estados `Capsulito` (capas `Movimiento` y `Boca`, `ViewModel` `Default`: `play`, `cancel`, `autoPlay`, `reducedMotion`, `mouth` `0..7`, `speechDemo`) a través del adaptador único `src/lib/client/rive.ts`, con respaldo inmediato en SVG/WebP estático (`static/mascota/`) cuando Rive aún no ha cargado, falla o hay `prefers-reduced-motion: reduce`.
2. **Locuciones expresivas pregeneradas con ElevenLabs (`eleven_v3`) y sincronización labial (`lip-sync`)**: script local `scripts/generar-voces.mjs` que consume `/v1/text-to-speech/{voiceId}/with-timestamps` usando `textoVoz` (con etiquetas expresivas `[excited]`, `[chuckles]`, `[sighs]`, etc.) y guarda en `static/mascota/voces/` los `.mp3` y los `.json` de tiempos (`cues` de bocas `1..7`), mientras la interfaz muestra siempre el `texto` limpio accesible.
3. **Catálogo tipado de momentos, eventos y rotación de frases** (`src/lib/shared/mascota/`): acompaña bienvenida (8 escenas `intro_01..08`), estados vacíos, errores, avisos y celebraciones diarias (consumo propio/invitado, agua, compra, aportación, deuda saldada, aguador del mes) sin repetir la misma frase dos veces seguidas, con humor cafetero/informático en lo positivo y tono 100 % serio en deuda personal, errores, rechazos o seguridad, sin tapar nunca «Deshacer» ni retrasar la confirmación (`≤ 1 s`).
4. **Historia animada de bienvenida de 8 escenas, guía en `/ayuda` y laboratorio en `/ayuda/capsulito`**: diálogo de bienvenida opcional en el primer acceso por dispositivo (`becafe-bienvenida`), versión estática e interactiva en `/ayuda` (funcional sin JavaScript) y laboratorio interactivo en `/ayuda/capsulito` para probar las 8 poses, 6 expresiones, 8 escenas y todos los eventos con Rive, SVG y voz.

No modifica el esquema de SQLite ni ninguna regla económica del servidor.

## Technical Context

**Language/Version**: TypeScript 6 estricto; Node 24 LTS; Svelte 5 (runes); SvelteKit 3.

**Primary Dependencies**: las existentes más `@rive-app/canvas` (`^2.x`, ADR-0006, constitución v1.7.0), importada únicamente en `src/lib/client/rive.ts`.

**Storage**: Sin cambios en SQLite. Preferencias por dispositivo en `localStorage` (`becafe-tema`, `becafe-transparencia`, `becafe-mascota`, `becafe-voz`, `becafe-bienvenida`), validadas con esquemas Zod en `src/lib/shared/contratos/apariencia.ts`. Activos estáticos en `static/ilustraciones/`, `static/mascota/` (`.webp`, `.svg`, `riv/*.riv`, `voces/*.mp3` y `voces/*.json`).

**Testing**:
- **Vitest (unidad)**: selección de momento en Inicio (`momentoInicio`), rotación sin repetición inmediata (`elegirVariante`), conversión de alineación de caracteres a bocas `1..7` ignorando etiquetas `[...]` (`construirCuesLipSync`), validación Zod de preferencias de dispositivo (`apariencia.test.ts`).
- **Vitest (rutas)**: carga de `(app)/+layout.server.ts`, `(app)/+page.server.ts` y `/ayuda/capsulito/+page.server.ts`.
- **Vitest Browser Mode (componentes)**: `Capsulito` (visible/oculta con `fallback`, bocadillo, `alt=""`, respeto a `prefers-reduced-motion` y respaldo SVG), `CapsuleTile` (dos botones submit `invitado="0"` e `invitado="1"`, nombres accesibles y descripción, `≥ 44 px`), `Bienvenida` (8 escenas, navegación, saltar y marcado como vista), `PanelGrid` (orden del DOM).
- **Playwright (E2E)**: navegación móvil y escritorio (`CA-182`), `CapsuleTile` con y sin JS (`CA-183`), preferencias en `/perfil` (`CA-180`, `CA-181`, `CA-185`, `EV-101`), bienvenida, reacciones y laboratorio `/ayuda/capsulito` (`CA-185`, `CA-186`, `CA-187`, `CA-188`, `EV-102`), suite `acceso` (`EV-050`), suite `a11y` con `axe` en claro y oscuro y proyecto `sin-js`.

**Target Platform**: PWA móvil y escritorio (Safari iOS ≥ 16.4, Chrome Android y navegadores de escritorio).

**Performance Goals**: Confirmación de consumo y relleno en `≤ 1 s` p95 (RNF-002); carga perezosa de `@rive-app/canvas` en el cliente sin bloquear el SSR ni el primer pintado; precarga en el service worker limitada a los tamaños pequeños/medios para no penalizar la instalación.

**Constraints**: Cero llamadas a ElevenLabs en tiempo de ejecución; mejora progresiva intacta en todos los formularios (`sin-js`); contraste compuesto `≥ 4,5:1` en claro y oscuro.

**Scale/Scope**: ~15 pantallas autenticadas dentro de `(app)`, 5 componentes nuevos en `src/lib/ui/`, 7 componentes mejorados, 1 adaptador Rive/lip-sync en `src/lib/client/rive.ts`, 1 ruta nueva `/ayuda/capsulito` y 1 script de generación de voces `scripts/generar-voces.mjs`.

## Constitution Check (v1.7.0)

| Principio | Cumplimiento en F9 | Estado |
| --- | --- | --- |
| I. Fuente vigente | `historias.md` v0.18.0 (CAMBIO-018), `ADR-0006` y `specs/009-experiencia-capsulito/spec.md` aprobada | Cumple |
| II. Complejidad | `@rive-app/canvas` aislada en un único archivo (`lib/client/rive.ts`); voces y `cues` pregenerados como estáticos sin backend adicional (ADR-0006) | Cumple |
| III. Separación | Sin lógica de negocio en `lib/ui` ni `routes`; `lib/shared/mascota/` es puro; `@rive-app/canvas` en `lib/client/rive.ts` | Cumple |
| IV. Integridad | No toca cálculos económicos, saldos, stock ni transacciones | Cumple |
| V. Almacenamiento | Solo claves permitidas en `localStorage` (`becafe-tema`, `becafe-transparencia`, `becafe-mascota`, `becafe-voz`, `becafe-bienvenida`); sin datos personales | Cumple |
| VI. Seguridad y validación | Esquemas Zod en `lib/shared/contratos/apariencia.ts` y para los JSON de lip-sync; `ELEVENLABS_API_KEY` solo en `.env` local para `scripts/generar-voces.mjs` | Cumple |
| VII. Tipado estricto | Cero `any`, cero `!`, cero `as Tipo` (solo `as const` y estrechadores) | Cumple |
| VIII y IX. Pruebas y verificación | Cada `CA-180..188` y `EV-101..102` con prueba automatizada; verificación completa al cierre | Cumple |
| X. Usabilidad | Un toque por cápsula (`CapsuleTile`); «Deshacer» nunca tapado; tono serio en deuda/error/seguridad | Cumple |
| XI. Accesibilidad | Mascota decorativa (`alt=""` / `aria-hidden="true"`); mensaje completo en texto; respeta `prefers-reduced-motion` y `prefers-reduced-transparency`; supera `axe` | Cumple |
| XVI. Registro técnico | Sin `console.*` en `src/`; un valor inválido en `localStorage` emite `dato.invalido` con el nombre de la clave y nunca el valor | Cumple |
| XVII. SvelteKit | `CapsuleTile`, `NotificationBell`, `/perfil` y `/logout` usan `<form method="post">` + `use:enhance` y funcionan en `sin-js`; estado de mascota en contexto (`setContext`/`getContext`), nunca en módulo | Cumple |
| XVIII. Identidad visual | Excepciones cerradas de `glass` (`CapsuleTile` y bocadillo/tostada de Capsulito) con alternativa opaca; mascota ocultable y silenciable en `/perfil` | Cumple |

**Resultado:** la puerta constitucional se supera sin violaciones.

## Architecture Check (`ARCHITECTURE.md` §15)

1. **Constitución:** sí (v1.7.0).
2. **Ubicaciones:**
   - Catálogo puro y lógica de selección/rotación/lip-sync: `src/lib/shared/mascota/momentos.ts`, `src/lib/shared/mascota/bienvenida.ts`, `src/lib/shared/mascota/lip-sync.ts`.
   - Esquemas de preferencias y pista de lip-sync: `src/lib/shared/contratos/apariencia.ts`.
   - Adaptador aislado de Rive y reproducción sincronizada de voz: `src/lib/client/rive.ts`.
   - Contexto de mascota: `src/lib/ui/contextos/mascota.svelte.ts`.
   - Componentes en `src/lib/ui/`: `Capsulito.svelte`, `Bienvenida.svelte`, `CapsuleIllustration.svelte`, `CapsuleTile.svelte`, `PanelGrid.svelte` (más mejoras en `AppShell.svelte`, `AppNav.svelte`, `CapsuleImage.svelte`, `EmptyState.svelte`, `ErrorPage.svelte`, `UndoToast.svelte`, `AlertsPanel.svelte`), todos exportados en `src/lib/ui/index.ts`.
   - Layout autenticado: `src/routes/(app)/+layout.svelte` y ampliación de `src/routes/(app)/+layout.server.ts`.
   - Laboratorio de demostración: `src/routes/(app)/ayuda/capsulito/+page.server.ts` y `+page.svelte`.
   - Script de generación de voces: `scripts/generar-voces.mjs`.
3. **Grafo:** respeta todas las reglas de `ARCHITECTURE.md` §4. `lib/shared` solo depende de sí mismo y de Zod; `@rive-app/canvas` se aísla en `src/lib/client/rive.ts` y se añade la regla `rive-solo-en-adaptador` en `.dependency-cruiser.cjs` y `ARCHITECTURE.md` §11.
4. **Reutilización:** reutiliza `AppShell`, `AppNav`, `Glass`, `Button`, `Switch`, `ThemeToggle`, `Banner`, `UndoToast`, `ToastRegion`, `EmptyState`, `ErrorPage`, `WaterRefillCard`, `AlertsPanel` y `NotificationBell`.
5. **Piezas nuevas:** `@rive-app/canvas` (justificada en §Dependencias nuevas y en `ADR-0006`), `src/lib/client/rive.ts`, `src/lib/shared/mascota/*` y los 5 componentes de `src/lib/ui/`.
6. **Reglas:** `RF-180` a `RF-188`, `CA-180` a `CA-188`, `EV-101` y `EV-102` con pruebas unitarias, de componente y E2E.
7. **Repetición y fallos:** si falla la carga de `.riv`, WebAssembly o `.mp3`, `Capsulito` mantiene el SVG/WebP estático y el bocadillo de texto sin bloquear nada; si se dispara una locución encima de otra, la anterior se cancela limpiamente (`Audio.pause()`, `cancelAnimationFrame`, `mouth = 0`).
8. **Fuentes:** `spec.md` aprobada y `historias.md` v0.18.0. Los contratos de la cola sin conexión no cambian.
9. **Autorización:** `(app)/+layout.server.ts` lee el usuario autenticado de `locals.actor`; `/ayuda/capsulito/+page.server.ts` comprueba `locals.actor` (redirige a `/login` sin sesión) y entra en el manifiesto de la suite `acceso` (`EV-050`). Cada página hija sigue comprobando su sesión y permiso en su propio caso de uso.
10. **Afectados:** todas las pantallas bajo `src/routes/(app)/` pasan a renderizarse dentro de `AppShell` + `AppNav` (se elimina el `<main>` envolvente duplicado de las páginas hijas para no anidar `<main>` dentro del `<main id="contenido">` de `AppShell`).
11. **Migraciones:** ninguna.
12. **Datos y formularios:** `CapsuleTile` usa `<form method="post" action="?/consumir">` con dos botones `type="submit"` (`name="invitado" value="0"` y `name="invitado" value="1"`); funciona sin JavaScript (`sin-js`).
13. **Eventos:** reutiliza `dato.invalido` (`origen: 'apariencia'`, `campo: 'becafe-mascota' | 'becafe-voz' | 'becafe-bienvenida'`) en el cliente cuando `localStorage` contiene un valor fuera de la lista cerrada.
14. **Pantallas:** `/ayuda/capsulito` y todas las pantallas modificadas definen sus estados en claro y oscuro, con alternativa opaca y entran en `e2e/a11y/`.

## Dependencias nuevas (`ARCHITECTURE.md` §13)

| Paquete | Versión | Justificación | Alternativa descartada | Licencia y seguridad | Impacto |
| --- | --- | --- | --- | --- | --- |
| `@rive-app/canvas` | `^2.31.0` (línea `2.x`) | Ejecutar las máquinas de estado `.riv` v0.2.0 compiladas de Capsulito (`Movimiento` + `Boca` `0..7` y Data Binding `ViewModel` `Default`) según `ADR-0006` y constitución v1.7.0 | CSS/WAAPI sobre SVG o Lottie: no ejecutan el archivo `.riv` ni su máquina de estados con `ViewModel` `mouth` `0..7` (`ADR-0006`) | MIT; `0` vulnerabilidades en `npm audit` | Se importa de forma dinámica en el navegador (`if (browser)`) desde `src/lib/client/rive.ts`, sin impacto en SSR |

## Decisiones de diseño

### D1. Layout autenticado `src/routes/(app)/+layout.svelte` y `+layout.server.ts` (RF-182, CA-182, HALL-017)

1. **`src/routes/(app)/+layout.server.ts`**:
   - Además de `avisosNuevos`, devuelve los datos básicos de navegación del miembro autenticado (`usuario: { nombre, rol }` leyendo `buscarUsuarioPorId(locals.ambiente.db, actor.usuarioId)`).
   - No sustituye la comprobación de sesión de cada `+page.server.ts` (constitución XVII).
2. **`src/routes/(app)/+layout.svelte`**:
   - Monta `AppShell` con los 5 destinos principales (`Inicio`, `Saldos`, `Compras`, `Estadísticas`, `Perfil`) resueltos con `resolve()`, y `adminNav` (`Cápsulas`, `Usuarios`, `Arqueos y recuentos` con `short: 'Arqueos'`, `Configuración` con `short: 'Ajustes'`, `Copias de seguridad` con `short: 'Copias'`) cuando `data.usuario?.rol === 'administrador'`.
   - Calcula `width` según la ruta activa:
     - `'wide'` en `/admin/*`;
     - `'panel'` (`max-w-[75rem]`) en `/`, `/saldos`, `/historial`, `/compras` y `/estadisticas`;
     - `'normal'` (`max-w-2xl`) en `/perfil`, `/ayuda`, `/privacidad`, `/avisos` y páginas de detalle/formulario.
   - Pasa el snippet `campana` con `NotificationBell` (que conserva su formulario `<form method="post" action="/avisos?/abrir">` para funcionar con y sin JavaScript).
   - Monta `<Bienvenida nombre={primerNombre} />` al pie del layout autenticado (como en `(app)` solo entran miembros que ya han superado la puerta `/aceptar-privacidad` en `hooks.server.ts`, la bienvenida nunca compite con la aceptación de privacidad).
3. **Eliminación de `<main>` anidado y de `ToastRegion` duplicado**:
   - `AppShell` ya renderiza `<main id="contenido">`. Las páginas hijas de `(app)` sustituyen su etiqueta raíz `<main class="...">` por `<div class="...">` (o fragmento con su espaciado) para que cada documento tenga un único `<main>` semántico (`axe` `landmark-no-duplicate-main` / `landmark-main-is-top-level`).
   - `ToastRegion` se mantiene una sola vez en `src/routes/+layout.svelte` (se quita el segundo `<ToastRegion />` interno de `AppShell.svelte` para no duplicar la región `aria-live`).

### D2. `AppShell`, `AppNav` y `PanelGrid` en móvil, tableta y escritorio (RF-182, DEC-105, DEC-106)

- **`AppNav.svelte`**:
  - `< 768 px` (`md:hidden`): píldora flotante inferior con los 5 destinos (`min-h-[54px]`).
  - `768–1023 px` (`md:flex lg:w-60`, carril `w-24`): barra lateral compacta de 96 px con icono arriba y etiqueta corta debajo (`item.short ?? item.label`).
  - `≥ 1024 px` (`lg+`): barra lateral completa de 240 px (`w-60`) con marca completa, grupo «Administración» e información de cuenta (`Avatar`, nombre y rol) enlazada a `/perfil`, además de enlaces rápidos a `/historial` y `/ayuda`.
- **`AppShell.svelte`**:
  - Soporta `width?: 'normal' | 'panel' | 'wide'` (`max-w-2xl`, `max-w-[75rem]`, `max-w-5xl`) y margen lateral `md:pl-[8rem] lg:pl-[16.5rem]`.
- **`PanelGrid.svelte`**:
  - Recibe los snippets `resumen`, `principal` y `secundario`.
  - Mantiene el orden del DOM `resumen → principal → secundario` y en `≥ 1024 px` coloca `principal` en la columna izquierda (`minmax(0,1fr)`) y `resumen` + `secundario` en la columna derecha (`22rem` / `24rem`).

### D3. Cierre de sesión y enlace a Administración en `/perfil` (RF-182, Clarifications 3)

- En `src/routes/(app)/+page.svelte` se elimina el bloque inferior `<Glass>` que contenía el enlace a `/perfil` y el formulario `POST /logout`.
- En `src/routes/(app)/perfil/+page.svelte` se añaden:
  - Si `data.rol === 'administrador'`, una sección/tarjeta con enlaces directos a `/admin` (y subsecciones de administración) y a `/ayuda`, facilitando el acceso a la administración desde móvil.
  - El botón/enlace a `/ayuda` y `/ayuda/capsulito`.
  - El formulario `<form method="post" action="/logout" use:enhance>` con el botón «Cerrar sesión» (`textos.inicio.cerrarSesion`), operativo con y sin JavaScript.

### D4. `CapsuleIllustration`, `CapsuleImage` y `CapsuleTile` con mejora progresiva (RF-183, RF-184, CA-183, Clarifications 4 y 5)

1. **`CapsuleIllustration.svelte`**:
   - SVG vectorial en línea (`viewBox="0 0 100 100"`, `aria-hidden="true"`) con degradados de cuerpo, cúpula y aro crema e identificadores únicos por instancia (`$props.id()`), coloreado mediante `style="color:{color}"`.
2. **`CapsuleImage.svelte`**:
   - Añade el tamaño `'xl'` (`size-[88px]`) y `onerror={() => (failed = true)}`: si el tipo tiene foto y carga bien, la muestra recortada en círculo con aro `border-color:{color}`; si no tiene foto o falla la carga, muestra `<CapsuleIllustration {color} />`.
3. **`CapsuleTile.svelte` adaptado a constitución XVII (`sin-js`)**:
   - A diferencia de la plantilla de diseño (que usaba `onclick`), en producción `CapsuleTile` envuelve sus acciones en el formulario `<form method="post" action="?/consumir" use:enhancer>` con los `<input type="hidden">` de `tipoCapsulaId` y `clienteId`:
     - El botón principal de la tarjeta es `<button type="submit" name="invitado" value="0">` (toda la tarjeta registra consumo propio `+1`, con animación `capsule-pop` cuando hay movimiento activo).
     - El botón secundario superior derecho (`min-h-11 min-w-11`, `44 × 44 px`) es `<button type="submit" name="invitado" value="1">` con icono `UserPlus` y `aria-label="Registrar {name} para un invitado"`.
   - Muestra como iconos con cifra (`tabular-nums`): stock (`Package`), días estimados (`CalendarClock`), precio unitario (`formatMoney`) y, cuando el miembro ha consumido cápsulas de ese tipo (`propios > 0 || invitados > 0`), los contadores con icono `User` (propios) y `Users` (invitados). Si ambos son `0`, no se pintan para no meter ruido.
   - `src/routes/(app)/+page.server.ts` calcula y pasa por cada tipo registrable los contadores `propios` e `invitados` del miembro activo (o los deriva de sus consumos vigentes).

### D5. Limpieza visual de `AlertsPanel` y orden de Inicio (RF-184, DEC-107, DEC-111)

- **`AlertsPanel.svelte`**:
  - Muestra la hucha (con icono `PiggyBank`) y el saldo propio (con icono `Wallet`), la lista de avisos de stock bajo agrupada bajo un solo encabezado sin repetir «Stock bajo:» en cada línea, y las personas por debajo del límite de deuda.
- **Orden en Inicio (`src/routes/(app)/+page.svelte`)**:
  - Usa `<PanelGrid>`:
    - `resumen`: `<Capsulito>` contextual (en escritorio siempre visible; en móvil solo cuando el tono no es `'neutro'` para no empujar las cápsulas hacia abajo) + `<AlertsPanel>`.
    - `principal`: cuadrícula de `<CapsuleTile>` (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]`), o `<EmptyState momento="vacio-capsulas">` si el catálogo está vacío.
    - `secundario`: `<WaterRefillCard>` y la sección «Tus últimos consumos» (`recientes`).

### D6. Catálogo unificado de momentos, eventos, rotación de frases e historia de 8 escenas (`src/lib/shared/mascota/`) (RF-185, RF-186, DEC-108, DEC-112, DEC-113)

Se organiza en tres módulos puros dentro de `src/lib/shared/mascota/` (importables desde cliente, servidor, pruebas y `scripts/generar-voces.mjs`):

1. **`src/lib/shared/mascota/momentos.ts`**:
   - Define las **8 poses Rive/SVG** (`POSES_RIV`: `'saludo' | 'celebrando' | 'pensando' | 'dormido' | 'alerta' | 'triste' | 'cafetera' | 'hucha'`), las **6 expresiones faciales** (`EXPRESIONES`: `'feliz' | 'orgulloso' | 'pensando' | 'sorprendido' | 'triste' | 'dormido'`) y el mapa de correspondencia con los nombres de archivo WebP/SVG (`srcPose`, `srcSvg`, `srcRiv`).
   - Define todos los momentos de pantalla y los **14 eventos operativos** (`consumo.confirmado`, `consumo.invitado_confirmado`, `consumo.pendiente`, `consumo.sincronizado`, `consumo.anulado`, `stock.bajo`, `stock.negativo`, `compra.confirmada`, `aportacion.confirmada`, `agua.confirmada`, `agua.rechazada_reciente`, `aguador.determinado`, `conexion.perdida`, `catalogo.vacio`, más saludos, vacíos y errores).
   - Cada entrada tiene:
     - `pose`: pose de Capsulito;
     - `expresion`: expresión facial (`feliz`, `orgulloso`, `pensando`, `sorprendido`, `triste`, `dormido`);
     - `tono`: `'neutro' | 'celebracion' | 'aviso' | 'problema'`;
     - `variantes`: lista no vacía de `{ id: string; texto: string; textoVoz: string }`, donde `texto` es el mensaje limpio en español (mostrado en el bocadillo y anunciado al lector de pantalla) y `textoVoz` incluye las etiquetas expresivas de ElevenLabs v3 (`[excited]`, `[chuckles]`, `[sighs]`, etc.) para generar el `.mp3`.
   - **Personalidad (DEC-113)**:
     - En momentos positivos o cotidianos (`consumo.confirmado`, `consumo.invitado_confirmado`, `agua.confirmada`, `compra.confirmada`, `aportacion.confirmada`, `aguador.determinado`, saludos): frases alegres y cómplices con guiños cafeteros e informáticos.
     - En deuda personal (`aviso-deuda`), errores (`servidor`, `no-encontrada`, `sin-permiso`), rechazos (`consumo-rechazado`, `agua.rechazada_reciente`) o alertas de stock negativo (`stock.negativo`): tono 100 % serio, directo y respetuoso, sin chistes ni reproches (`textoVoz` sin risas ni bromas).
   - **Rotación sin repetición inmediata (`elegirVariante(momentoId, ultimoId, indiceAzar?)`)**:
     - Función pura que, si un momento/evento tiene `≥ 2` variantes y se conoce `ultimoId`, filtra `ultimoId` antes de elegir la siguiente variante, garantizando que dos toques seguidos nunca repitan la misma frase (CA-186).
2. **`src/lib/shared/mascota/bienvenida.ts`**:
   - Define las **8 escenas de la historia de bienvenida** (`ESCENAS_BIENVENIDA`: `intro_01` a `intro_08`), con `id`, `momento`, `pose`, `expresion`, `titulo`, `texto` (visible), `textoVoz` (con etiquetas expresivas de ElevenLabs v3) e `icono` de respaldo.
3. **`src/lib/shared/mascota/lip-sync.ts`**:
   - Funciones puras para:
     - Convertir la alineación de caracteres devuelta por ElevenLabs (`characters`, `character_start_times_seconds`, `character_end_times_seconds`) en una lista compacta de `cues` `{ start: number; end: number; value: 1..7 }`, **descartando los tramos entre corchetes `[...]`** de las etiquetas expresivas (salvo `[laughs]` / `[chuckles]` / `[giggles]`, que generan pulsos vocálicos abiertos `2`/`3`).
     - Dado un instante `t` en segundos y una lista de `cues`, devolver la forma de boca `0..7` (`bocaEnInstante(cues, t)`).

### D7. Adaptador Rive y sincronización labial en `src/lib/client/rive.ts` (RF-187, CA-187, ADR-0006)

- Único archivo de todo el repositorio que importa `@rive-app/canvas` (regla `rive-solo-en-adaptador` en `.dependency-cruiser.cjs`).
- Carga `@rive-app/canvas` de forma dinámica en el navegador (`await import('@rive-app/canvas')`) para no afectar al SSR ni al tiempo de arranque inicial.
- Expone `montarCapsulitoRive(canvas, opciones)`:
  - Instancia `new Rive({ src: `/mascota/riv/capsulito-${pose}.riv`, canvas, stateMachines: 'Capsulito', autoBind: true, autoplay: true, onLoad, onLoadError })`.
  - Conecta con la instancia `Default` del `ViewModel` (`rive.viewModelInstance`):
    - `reducedMotion` (`boolean`): se sincroniza con `prefers-reduced-motion: reduce` o `!animar`.
    - `autoPlay` (`boolean`): `true` cuando `animar` está activo.
    - `play` / `cancel` (`trigger`): para disparar o detener la animación de la pose.
    - `mouth` (`number` `0..7`): propiedad entera gobernada por la pista de voz o a `0` en reposo.
    - `speechDemo` (`boolean`): `false` cuando hay lip-sync por audio o en reposo; `true` cuando se solicita demostración de habla sin audio en el laboratorio.
  - Devuelve un controlador `{ dispararPlay(), dispararCancel(), fijarReducedMotion(v), fijarBoca(0..7), fijarSpeechDemo(v), destruir() }` que limpia el bucle y llama a `rive.cleanup()` al desmontar.
- Expone `reproducirVozSincronizada(audioId, onBoca, onFin)`:
  - Cancela cualquier locución en curso antes de empezar otra.
  - Carga en paralelo `/mascota/voces/${audioId}.json` (validado con `esquemaPistaLipSync` de Zod) y `new Audio('/mascota/voces/${audioId}.mp3')`.
  - Mientras el audio suena, un bucle `requestAnimationFrame` lee `audio.currentTime` y actualiza `onBoca(bocaEnInstante(pista.cues, audio.currentTime))`; en `pause`, `ended` o `error`, restablece `onBoca(0)` y libera recursos.

### D8. Componente `<Capsulito>` con Rive + respaldo SVG y contexto `EstadoMascota` (RF-185, RF-187, DEC-109, DEC-110)

1. **Esquemas en `src/lib/shared/contratos/apariencia.ts`**:
   - Añade a `CLAVE_TEMA` y `CLAVE_TRANSPARENCIA`:
     - `CLAVE_MASCOTA = 'becafe-mascota'` (`esquemaMascota = z.enum(['visible', 'oculta'])`, por defecto `'visible'`);
     - `CLAVE_VOZ = 'becafe-voz'` (`esquemaVoz = z.enum(['activa', 'silenciada'])`, por defecto `'silenciada'`);
     - `CLAVE_BIENVENIDA = 'becafe-bienvenida'` (`esquemaBienvenida = z.enum(['pendiente', 'vista'])`, por defecto `'pendiente'`);
     - `esquemaPistaLipSync` para validar los JSON de `static/mascota/voces/*.json`.
2. **Script inicial en `src/app.html`**:
   - Lee `becafe-mascota` de `localStorage` (lista cerrada `'visible' | 'oculta'`) y fija `data-mascota` en `<html>` antes del primer pintado para evitar cualquier parpadeo si la persona ocultó la mascota.
3. **Contexto `src/lib/ui/contextos/mascota.svelte.ts`**:
   - Clase `EstadoMascota` instanciada por petición en `src/routes/+layout.svelte` (`crearContextoMascota()`):
     - `visible = $state(true)`, `vozActiva = $state(false)`, `animar = $state(true)`, `bienvenidaVista = $state(true)` (en SSR y sin JS vale `true` para no abrir el diálogo modal; en `iniciar()` lee `localStorage` validado con Zod y registra `dato.invalido` si había basura).
     - Guarda el mapa `ultimasVariantes` por momento/evento para rotar frases sin repetir dos veces seguidas (`elegirFrase(momentoId, vars)`).
     - Métodos `cambiarVisible(v)`, `cambiarVoz(v)`, `marcarBienvenidaVista()`, `repetirBienvenida()`, `hablar(audioId)` y `detenerVoz()`.
4. **Componente `src/lib/ui/Capsulito.svelte`**:
   - Siempre renderiza la imagen estática (`<img>` con `alt=""` y `aria-hidden="true"`, usando el SVG de la variante `pose + expresion` o el WebP correspondiente) como base inmediata SSR/sin-JS, y superpone el `<canvas aria-hidden="true">` de Rive cuando `browser && mascota.animar` y el `.riv` ha terminado de cargar (`riveListo = true`).
   - Si `prefers-reduced-motion: reduce` está activo (`!mascota.animar`) o Rive falla al cargar, se muestra únicamente la ilustración estática SVG/WebP sin parpadeo.
   - Si `mascota.visible === false`, no renderiza nada (o renderiza el snippet `fallback` si se le pasó, como el icono original en `EmptyState`, `ErrorPage` y `UndoToast`).

### D9. Reacciones estilo Duolingo en operaciones diarias (RF-186, CA-186, Clarifications 6)

- En `EstadoAvisos` (`src/lib/ui/contextos/avisos.svelte.ts`):
  - `AvisoDeshacer` admite `momento?: MomentoId` y `expresion?: Expresion`.
  - Se añade `celebrar(momento, datos)`: muestra el `UndoToast` con `Capsulito` asomando a la izquierda (o con el icono de la cápsula + frase rotada de Capsulito en el detalle), reproduciendo la locución solo si `mascota.vozActiva` está activada.
- Operaciones conectadas:
  - **Consumo propio e invitado (`src/routes/(app)/+page.svelte`)**: al confirmar `?/consumir`, `UndoToast` muestra la confirmación inmediata con el botón «Deshacer» (5 s) y la frase rotada de `consumo.confirmado` o `consumo.invitado_confirmado` (o `stock.negativo` con tono serio si hubo descuadre); si se encola sin red, reacciona con `consumo.pendiente`; al sincronizar la cola, con `consumo.sincronizado`; al deshacer, con `consumo.anulado`.
  - **Relleno de agua (`src/routes/(app)/+page.svelte`)**: al confirmar `?/rellenar`, celebra con `agua.confirmada` manteniendo el botón «Deshacer» de 5 s; si se rechaza por intervalo, muestra `agua.rechazada_reciente` en tono serio.
  - **Aportación (`src/routes/(app)/aportaciones/+page.svelte` / `saldos`)** y **Compra (`src/routes/(app)/compras/+page.svelte`)**: al completarse la acción, muestran la celebración de `aportacion.confirmada` (o `deuda-saldada` si el saldo pasa de negativo a `≥ 0`) y `compra.confirmada`.

### D10. Historia de bienvenida de 8 escenas, `/ayuda` y laboratorio `/ayuda/capsulito` (RF-185, RF-188, CA-185, CA-188)

1. **`src/lib/ui/Bienvenida.svelte`**:
   - Diálogo accesible (`Dialog` de `bits-ui`) con las **8 escenas** (`ESCENAS_BIENVENIDA`: `intro_01` a `intro_08`), indicador de paso (`Paso N de 8`), conmutador «Activar voz / Silenciar» en la cabecera del diálogo, botones «Saltar», «Anterior / Siguiente» y en la última escena «¡A por el café!».
   - Si la persona activa la voz en el diálogo (o ya tenía `mascota.vozActiva`), cada escena reproduce su `.mp3` (`intro_01..08`) sincronizando la boca `0..7` del `.riv`. Al cerrar o saltar, detiene la voz y marca `becafe-bienvenida = 'vista'`.
2. **`src/routes/(app)/ayuda/+page.svelte`**:
   - Muestra las 8 escenas de «Cómo funciona beCafé» en una cuadrícula estática legible con y sin JavaScript, un botón «Ver la bienvenida animada» (visible con JS) y una tarjeta destacada que enlaza al laboratorio `/ayuda/capsulito`.
3. **Laboratorio `/ayuda/capsulito` (`src/routes/(app)/ayuda/capsulito/+page.server.ts` y `+page.svelte`)**:
   - `+page.server.ts` verifica `locals.actor` (redirige a `/login` sin sesión) para cumplir `EV-050`.
   - `+page.svelte` ofrece controles interactivos para:
     - Elegir cualquiera de las **8 poses** (`saludo`, `celebrando`, `pensando`, `dormido`, `alerta`, `triste`, `cafetera`, `hucha`) y **6 expresiones** (`feliz`, `orgulloso`, `pensando`, `sorprendido`, `triste`, `dormido`).
     - Reproducir cualquiera de las **8 escenas de bienvenida** (`intro_01..08`) o cualquiera de los **eventos del catálogo**, viendo el texto limpio, las etiquetas expresivas de voz (`textoVoz`), la forma de boca actual (`0..7`) y probando los botones `Play`, `Cancel`, `Habla demo`, `Movimiento reducido`, `Modo Rive / SVG` y `Reproducir con voz`.

### D11. Generación de voces expresivas y lip-sync con ElevenLabs (`scripts/generar-voces.mjs`) (DEC-115, Clarifications 10)

- Script ejecutable con `node scripts/generar-voces.mjs` (y script npm `"voces:generar": "node scripts/generar-voces.mjs"` en `package.json`).
- Lee `ELEVENLABS_API_KEY` y `ELEVENLABS_VOICE_ID` (`TfkjFyM0u8G2kDTCi1Qi`) de `.env` (fuera de `src/`, conforme a `ARCHITECTURE.md` §8.5).
- Recorre todas las locuciones del catálogo (`intro_01..08` y frases de eventos) y, para cada archivo que no exista en `static/mascota/voces/` (o todos si se pasa `--force`), llama a `POST https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps` con `model_id: 'eleven_v3'` y el `textoVoz` con etiquetas expresivas (`[excited]`, `[chuckles]`, `[sighs]`, etc.).
- Guarda:
  - `static/mascota/voces/<id>.mp3` (audio MP3 decodificado de `audio_base64`);
  - `static/mascota/voces/<id>.json` (`{ version: 1, audio: "<id>.mp3", texto, duration, cues }` generado con `construirCuesLipSync`).

### D12. Caché del service worker (`src/service-worker.ts`)

- Para no inflar la precarga inicial del service worker con los `.webp` de `1024 px` ni con todos los `.mp3` de voz, `src/service-worker.ts` excluye de la lista de precarga obligatoria los archivos `*-1024.webp` y `/mascota/voces/*` (que se cargan bajo demanda cuando la voz está activa), manteniendo en precarga los SVG, los `.webp` de 128/256/512 px y los `.riv` para que Capsulito funcione incluso sin conexión.

## Pruebas previstas (`docs/pruebas.md` §14)

| Regla o escenario | Nivel | Archivo previsto |
| --- | --- | --- |
| CA-180, CA-181 (tema, transparencia, mascota, voz y bienvenida en `localStorage` con Zod) | Unidad + Componente + E2E | `src/lib/shared/contratos/apariencia.test.ts`, `e2e/flujos/apariencia.spec.ts` |
| CA-182 (navegación móvil y barra lateral de escritorio, 2 columnas en Inicio, logout y `/admin` en `/perfil`) | Ruta + Componente + E2E (`chromium-movil`, `chromium-escritorio`) | `src/routes/(app)/layout.server.test.ts`, `src/lib/ui/PanelGrid.svelte.test.ts`, `e2e/flujos/navegacion-f9.spec.ts` |
| CA-183 (`CapsuleTile` con ilustración, stock, contadores y `+1 invitado` con y sin JS) | Componente + E2E + `sin-js` | `src/lib/ui/CapsuleTile.svelte.test.ts`, `e2e/flujos/consumos.spec.ts`, `e2e/sin-js/flujos-criticos.spec.ts` |
| CA-185 (historia de bienvenida de 8 escenas, `/ayuda` sin JS, ocultar mascota en `/perfil`) | Unidad + Componente + E2E + `sin-js` | `src/lib/ui/Bienvenida.svelte.test.ts`, `src/lib/ui/Capsulito.svelte.test.ts`, `e2e/flujos/capsulito.spec.ts` |
| CA-186 (momentos, rotación de frases sin repetir en toques seguidos, tono serio en deuda/error, no tapa «Deshacer») | Unidad + E2E | `src/lib/shared/mascota/momentos.test.ts`, `e2e/flujos/capsulito.spec.ts` |
| CA-187, EV-101, EV-102 (Rive con respaldo SVG, lip-sync `0..7` ignorando `[...]`, respeto a `prefers-reduced-motion`, `axe` claro y oscuro) | Unidad + Componente + E2E + `a11y` | `src/lib/shared/mascota/lip-sync.test.ts`, `src/lib/ui/Capsulito.svelte.test.ts`, `e2e/a11y/accesibilidad.spec.ts` |
| CA-188, EV-050 (laboratorio `/ayuda/capsulito` y control de acceso) | Ruta + E2E + `acceso` + `a11y` | `src/routes/(app)/ayuda/capsulito/page.server.test.ts`, `e2e/acceso/manifiesto.ts`, `e2e/flujos/capsulito.spec.ts` |

## Lotes de implementación

| Lote | Contenido | CA / EV cubiertos | Verificación al cerrar el lote |
| --- | --- | --- | --- |
| **F9-L1: Contratos, catálogo de Capsulito, lip-sync y generación de voces** | `@rive-app/canvas`, `.dependency-cruiser.cjs`, `apariencia.ts`, `src/lib/shared/mascota/{momentos,bienvenida,lip-sync}.ts`, `scripts/generar-voces.mjs` y generación de `.mp3`/`.json` en `static/mascota/voces/`, `src/service-worker.ts` | CA-180, CA-181, CA-186, CA-187 (unidad) | Pruebas unitarias (`apariencia.test.ts`, `momentos.test.ts`, `lip-sync.test.ts`), `npm run arch`, `npm run check` |
| **F9-L2: Adaptador Rive, contexto `EstadoMascota` y componentes de Capsulito y cápsulas** | `src/app.html`, `src/lib/client/rive.ts`, `src/lib/ui/contextos/mascota.svelte.ts`, `Capsulito.svelte`, `Bienvenida.svelte`, `CapsuleIllustration.svelte`, `CapsuleImage.svelte`, `CapsuleTile.svelte`, `PanelGrid.svelte`, mejoras en `AppShell`, `AppNav`, `EmptyState`, `ErrorPage`, `UndoToast`, `AlertsPanel` y exportaciones en `src/lib/ui/index.ts` | CA-183, CA-185, CA-187 (componentes) | `npm run test:componentes`, `npm run check`, `npm run lint:changed` |
| **F9-L3: Layout `(app)`, Inicio, Perfil, Ayuda, laboratorio `/ayuda/capsulito` y resto de pantallas** | `src/routes/+layout.svelte`, `src/routes/(app)/+layout.server.ts`, `src/routes/(app)/+layout.svelte`, rediseño de `(app)/+page.svelte` y `+page.server.ts`, `/perfil`, `/ayuda`, `/ayuda/capsulito`, estados vacíos con `momento` en saldos/compras/historial/estadísticas/avisos y limpieza de `<main>` duplicados en `(app)` | CA-182, CA-183, CA-185, CA-186, CA-188 | Pruebas de ruta, `npm run check`, `npm run lint:changed` |
| **F9-L4: Pruebas E2E, `sin-js`, `acceso`, `a11y` y verificación completa** | Actualización de pruebas E2E existentes afectadas por la limpieza de textos/layout, nuevas pruebas E2E de navegación, Capsulito y `/ayuda/capsulito`, manifiesto `EV-050`, `axe` claro/oscuro y `npm run verify` | CA-180 a CA-188, EV-101, EV-102, EV-050 | `npm run verify` y suite E2E de Playwright |

## Cambios en otros documentos

| Documento | Cambio | Lote |
| --- | --- | --- |
| `ARCHITECTURE.md` | §2: `src/lib/shared/mascota/` y `src/lib/client/rive.ts`; §7: preferencias de mascota y bienvenida en `localStorage`; §11: `@rive-app/canvas` en la tabla de dependencias aisladas | F9-L4 |
| `.dependency-cruiser.cjs` | Regla `rive-solo-en-adaptador` (`@rive-app/canvas` solo en `src/lib/client/rive.ts`) | F9-L1 |
| `docs/diseno/design-principles.md` | Excepciones cerradas de cristal y sección «Mascota» (aplicado junto con la enmienda v1.7.0) | Hecho |

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Etiquetas expresivas `[...]` de ElevenLabs v3 aparecen en `alignment.characters` y desfasan la boca | `construirCuesLipSync` detecta y omite los rangos entre `[` y `]` (salvo `[laughs]`/`[chuckles]`, que mapea a vocal abierta), probado con Vitest |
| Montar `AppShell` en `(app)/+layout.svelte` duplica `<main>` en las páginas hijas y rompe `axe` | En F9-L3 se revisan todas las páginas bajo `src/routes/(app)/` para que su contenedor interno sea `<div>` o `<section>` dentro del `<main id="contenido">` de `AppShell` |
| `@rive-app/canvas` requiere WebAssembly/Canvas2D que puede tardar o no estar disponible en entornos sin GPU | Carga dinámica en cliente y respaldo inmediato `<img src="/mascota/svg/...">` que permanece visible si Rive no está listo o con `prefers-reduced-motion` |
| Pruebas E2E existentes buscan textos antiguos de Inicio o tarjetas de cápsula | En F9-L3 y F9-L4 se mantienen los nombres accesibles y se actualizan los selectores afectados |

## Complexity Tracking

| Pieza | Problema concreto | Alternativa más simple descartada porque… |
| --- | --- | --- |
| `src/lib/client/rive.ts` (`@rive-app/canvas`) | Ejecutar los `.riv` compilados con su máquina de estados `Capsulito` y la propiedad `mouth` (`0..7`) del `ViewModel` `Default` | Animar SVG con CSS no permite usar los `.riv` entregados ni sincronizar las 8 bocas (`ADR-0006`) |
| `scripts/generar-voces.mjs` + `.json` estáticos | Generar locuciones expresivas con ElevenLabs y pistas de lip-sync sin exponer `ELEVENLABS_API_KEY` ni depender de una API externa en producción | Llamar a ElevenLabs en vivo o analizar el audio con Web Audio API en el cliente añadiría latencia, coste y menor precisión fonética (`ADR-0006`) |
