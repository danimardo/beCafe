# Implementation Plan: Inicio centrado en el café, Capsulito gamberro y pulido de la interfaz (F11)

**Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9) | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/011-inicio-cafe-capsulito/spec.md` (aprobada el 2026-10-25), `historias.md` v0.22.0 (CAMBIO-022) y constitución 1.8.0.

**Status**: Aprobado por la persona usuaria el 2026-10-25.

## Summary

F11 no añade módulos, aristas ni dependencias. Cambia sobre todo la interfaz y añade una tabla:

1. **Inicio centrado en el café** (RF-216 a RF-219): Capsulito grande con un bocadillo que muestra el último mensaje (saludo, frase de registro, agua, stock bajo); cápsulas con «Sin stock» confirmable y «Quedan pocas»; resto en columna estrecha.
2. **Frases sin repetición** (RF-213 a RF-215, RN-088, RN-089): tabla `frase_entregada` en `usuarios`, regla pura en `usuarios/dominio/ciclo-frases.ts`, catálogo de 160 frases en `lib/shared/mascota/frases.ts`.
3. **Fallos** (RF-211, RF-212, RF-228, RF-229): compras, diálogo que tapa errores, tour y navegación, cada uno con su prueba en rojo primero.
4. **Ajustes, Perfil, avatar, alta con foto y privacidad v3** (RF-220 a RF-224).
5. **Capsulito en la entrada, los errores y la ayuda** (RF-225 a RF-227): `.riv` nuevo con fuente RML versionada.
6. **Maquetación** (RF-230 a RF-232) y **microinteracciones** (RF-233 a RF-236).
7. **Voces** (RF-237): 196 locuciones nuevas que genera la persona usuaria.

## Technical Context

**Language/Version**: TypeScript 6.x estricto, Node.js 24.x
**Primary Dependencies**: SvelteKit 3 + adapter-node 6, Svelte 5 (runes), Tailwind CSS 4, Bits UI 2, Drizzle ORM 0.45, Zod 4, `@rive-app/canvas` 2.x, `sharp` 0.35. Sin dependencias nuevas. Herramienta externa no instalada en el proyecto: Rive CLI 1.7.0 (`~/.rive/bin/rive`), solo para compilar el `.riv`.
**Storage**: SQLite, migración `0008_f11-frases.sql` (tabla `frase_entregada`).
**Testing**: Vitest (unidad, propiedades, integración con SQLite real y concurrencia), Vitest Browser Mode (componentes), Playwright (`flujos`, `sin-js`, `a11y`, `acceso`, regresión visual).
**Target Platform**: PWA en Safari iOS ≥ 16.4 y Chrome Android; escritorio.
**Project Type**: aplicación web SvelteKit única.
**Performance Goals**: consumo confirmado ≤ 1 s p95 con frase incluida (RNF-002); ninguna animación retrasa una respuesta.
**Constraints**: acciones sin JavaScript (XVII), lista cerrada del navegador (V), sin texto de frases en los logs (XVI), movimiento desactivado con `prefers-reduced-motion` (XI, XVIII).
**Scale/Scope**: unas 10 personas; 160 frases; 196 locuciones nuevas.

## Constitution Check (v1.8.0)

| Principio | Cumplimiento |
| --- | --- |
| I. Fuente vigente | Todo procede de la spec aprobada, `frases.md` y `historias.md` v0.22.0. Las poses de cada frase las elige el agente y las revisa la persona usuaria (supuesto de la spec). |
| II. Complejidad | Una tabla para una regla concreta (RN-088). Sin módulos ni dependencias nuevas. Tres acciones internas de movimiento, cada una para un requisito (RF-234 a RF-236). |
| III. Módulos | Ciclo de frases en `usuarios`; confirmación de stock 0 en `economia` (`registrarConsumo`). La acción `consumir` llama a `economia` y después a `usuarios`; no hay aristas nuevas entre módulos. |
| IV. Integridad económica | El consumo confirmado con stock ≤ 0 sigue RF-017 sin cambios. La frase va fuera de la transacción del consumo y su fallo no lo deshace. |
| V. Almacenamiento | Ciclo y último saludo en el servidor. Las preferencias movidas a Ajustes conservan sus claves de `localStorage`. |
| VI. Seguridad | Campos nuevos con `z.strictObject`; la foto del alta con el esquema de F10; permisos en el caso de uso (alta: administrador; frases y saludo: la propia sesión). |
| VII. Tipado | Sin aserciones ni escapes. `frases.ts` con tipos literales. |
| VIII. Pruebas | Cada CA-211 a CA-237 y EV-107 a EV-111 tiene prueba (tabla «Pruebas previstas»). Propiedades de RN-088. Umbrales sin cambios. |
| IX. Verificación | Lotes con comprobaciones afectadas; cierre con `scripts/benchmark.sh`. |
| X. Usabilidad | Un toque salvo stock ≤ 0, con confirmación (enmienda 1.8.0). «Deshacer» tras la confirmación. «Pendiente de enviar» sin frase. Estados vacío, cargando, error y sin conexión en Ajustes. |
| XI. Accesibilidad | «Sin stock» y «Quedan pocas» con icono y texto; bocadillo con `aria-live="polite"`; diálogo con foco; avatar ≥ 3:1; axe en las pantallas nuevas en claro y oscuro (EV-109). |
| XIII. Errores | Páginas de error con el identificador de operación en la 500 y sin detalles internos. |
| XIV. Compatibilidad | `/api/consumos` sin cambios. `?/preferencia` de Perfil redirige una versión a Ajustes. |
| XVI. Registro | Códigos nuevos sin texto ni nombres (contrato). |
| XVII. SvelteKit | Acciones con nombre y `use:enhance`; paso intermedio sin JavaScript para stock 0; el saludo es un acompañamiento solo con JavaScript, como la voz (research R2). Cargas sin escrituras. |
| XVIII. Identidad | Capsulito en la entrada, los errores y la ayuda (enmienda 1.8.0), siempre decorativo y con el texto completo al lado. Sin cristal nuevo bajo formularios; el bocadillo de Inicio usa la excepción ya cerrada. Cada movimiento confirma, orienta o explica un cambio. |

**Resultado**: sin infracciones tras la enmienda 1.8.0. No hace falta ADR.

## Architecture Check (`ARCHITECTURE.md` §15)

1. **Constitución**: tabla anterior.
2. **Ubicación**: `frase_entregada` en `usuarios/esquema.ts`; `usuarios/frases.ts` (casos de uso) y `usuarios/dominio/ciclo-frases.ts`; `lib/shared/mascota/frases.ts`; `src/routes/(app)/ajustes/`; `src/lib/ui/avatares/`; `src/lib/ui/movimiento/`; `docs/diseno/f11/rive/entrada/` (fuente RML) y `static/mascota/riv/capsulito-entrada.riv`.
3. **Grafo**: sin aristas nuevas. Las rutas ya importan `economia` y `usuarios`.
4. **Reutilización**: `ConfirmDialog`, `CapsuleTile`, `Capsulito`, `Avatar`, `PhotoField`, `PanelGrid`, `ErrorPage`, `Sheet`, `TourInicio`, `AyudaPanel`, `SegmentedControl`, `ThemeToggle`, `Button`, `Money`, `KpiTile`.
5. **Abstracciones nuevas**: `indicador.ts`, `spotlight.ts`, `cifra.svelte.ts` (guía de microinteracciones), `montarRiveEntrada()` en `lib/client/rive.ts`, `CapsulitoEntrada.svelte`.
6. **Reglas e invariantes**: RN-088 → `dominio/ciclo-frases.ts` (propiedades) y `usuarios/frases.ts` (integración y concurrencia, EV-108). RF-217 → `economia/consumos.ts` (`CONFIRMAR_SIN_STOCK`).
7. **Repetición y fallos**: un consumo duplicado (`clienteId`) no entrega otra frase; `?/saludo` vuelve a comprobar las 2 horas; un fallo de la frase no afecta al consumo.
8. **Contratos**: `contracts/formularios.md`.
9. **Autorización**: `/ajustes` entra en la suite `acceso` (EV-111) para cualquier rol con sesión.
10. **Afectados**: F1 (alta, privacidad), F3 (Inicio, consumo), F4 (compras), F6 (saldos, estadísticas), F8 (agua), F9 (Capsulito, apariencia, bienvenida), F10 (ayuda, tour, avatar, compras).
11. **Migraciones**: solo crea una tabla.
12. **SvelteKit**: todas las acciones nuevas funcionan sin JavaScript salvo `?/saludo` (acompañamiento, R2).
13. **Registro**: códigos de `contracts/formularios.md`, comprobados con el registrador falso.
14. **Estados y a11y**: Ajustes define vacío, cargando, error y sin conexión; todas las pantallas tocadas entran en `a11y`.

## Decisiones de diseño

Las alternativas y motivos están en [research.md](./research.md).

### D1. Inicio (RF-216 a RF-219)

- Nuevo orden en `+page.svelte`: cabecera → `CapsulitoInicio` (Capsulito `size="lg"` sobre la excepción de cristal del bocadillo, con el mensaje actual) → cápsulas → `AlertsPanel`, agua, visitantes y últimos consumos. En `PanelGrid`, las cápsulas pasan a `principal` y el resto a `secundario`; `resumen` desaparece en Inicio. El tour mantiene sus anclas `data-tour`.
- Mensaje de Capsulito: estado local `mensaje = { momento | fraseId, texto, pose }`, con prioridad saludo → stock bajo → reposo; cada evento (frase de registro, agua, sincronización, sin conexión) lo sustituye. El bocadillo tiene `aria-live="polite"`. Así el agua se ve en pantalla (RF-219).
- `CapsuleTile`: `level === 'out'` → tarjeta atenuada (opacidad del fondo, no del texto, para mantener 4,5:1), icono `PackageX` y «Sin stock»; `level === 'low'` → `TriangleAlert` y «Quedan pocas». `sinStock=1` oculto si `out`. Prop nueva `onconfirmar?` para abrir `ConfirmDialog` desde la página.
- Sin JavaScript, el `fail(409, { confirmarSinStock })` pinta un panel con la pregunta, «Sí, registrar» (mismo formulario con `confirmarSinStock=si` y `clienteId`) y «Cancelar» (enlace a Inicio).

### D2. Frases y saludo (RF-213 a RF-215, RN-088, RN-089)

- `usuarios.entregarFrase(ambiente, usuarioId, lista)` → `{ fraseId } `: transacción que lee el ciclo actual, llama a `siguienteFrase`, inserta y borra ciclos antiguos.
- `usuarios.leerSaludoDisponible(db, usuarioId, ahora)` → `boolean`; `usuarios.entregarSaludo(ambiente, usuarioId)` → `{ fraseId } | null` (comprueba las 2 horas dentro de la transacción).
- Cliente: `mascota.mostrarFrase(fraseId)` busca el texto en `frases.ts`, actualiza el bocadillo y llama a `hablar(fraseId)`. Las variantes antiguas de café apuntado e invitado se retiran del cliente.

### D3. Compras y diálogo (RF-211, RF-212)

Según research R5: regla en el esquema de compra (`contratos/economia.ts`), validación previa en el cliente y cierre del diálogo con cualquier resultado. `ConfirmDialog` recibe `onresultado` o la página lo cierra en el callback de `use:enhance`; el foco va al resumen (`role="alert"`, `tabindex="-1"`).

### D4. Navegación y tour (RF-228, RF-229)

Según research R6 y R7: primero las pruebas E2E en rojo, después la corrección. La etiqueta corta de Configuración pasa a «Config.».

### D5. Ajustes y Perfil (RF-220, RF-221)

- `src/routes/(app)/ajustes/+page.server.ts` y `+page.svelte`: secciones Apariencia (`ThemeToggle`, «Reducir transparencia»), Capsulito (mostrar, voz, «Ver la bienvenida de nuevo»), Avisos (`SeccionAvisos` movido) e Instalar.
- Navegación: `nav` añade «Ajustes» (`Settings2`) tras Perfil en tableta y escritorio; en móvil, Perfil activo en `/ajustes` y primera fila de Perfil «Ajustes» (research R8).
- Perfil en `PanelGrid` de dos columnas: datos y foto | contraseña y sesiones; el bloque de administración sigue al final.
- Ayuda: entrada `ajustes` en `pantallas.ts`; `perfil` actualizada.

### D6. Avatar, alta con foto y privacidad (RF-222 a RF-224)

- `Avatar` sin foto pinta `<IlustracionAvatar indice>` en vez de las iniciales; mismas tallas y color.
- Alta: `enctype="multipart/form-data"` y `PhotoField`; `usuarios.darDeAlta` acepta `foto?: Uint8Array`, la procesa con `procesarFoto` antes de la transacción, guarda el archivo y, si el alta falla, lo borra.
- `privacidad.ts` v3 y su prueba.

### D7. Entrada con Capsulito (RF-225)

- Lote con capturas para la persona usuaria **antes** de integrar (DEC-123). Entradas de la máquina de estados según research R10.
- `CapsulitoEntrada.svelte` en `lib/ui`: SVG estático hasta que carga el `.riv`; recibe por props `mirarX`, `taparOjos`, `estado: 'reposo' | 'fallo' | 'exito'` y `reducido`. La página de entrada calcula `mirarX` con la posición del cursor del correo (`selectionStart` / longitud) y `taparOjos` con el foco de la contraseña. `PasswordField` con «Mostrar» visible: Capsulito destapa un ojo (detalle opcional de la animación).
- Sin JavaScript o con movimiento reducido: SVG estático `capsulito-saludando.svg`.

### D8. Errores y narración (RF-226, RF-227)

- `+error.svelte` con `ErrorPage` y cuatro tipos (research R13). Textos gamberros nuevos en `textos.errorPagina` y momentos `error.*`.
- `AyudaPanel` y `TourInicio` muestran `Capsulito` (`size="sm"`, pose del paso) a la izquierda del texto y llaman a `hablar('ayuda_<pantalla>')` o `hablar('tour_0n')` al abrirse cada paso, si la voz está activa.

### D9. Maquetación (RF-230 a RF-232)

- Ficha de cápsula: `grid gap-4 lg:grid-cols-2`, con nombre y foto a ancho completo.
- Detalle de compra: líneas y resumen en `lg:grid-cols-[2fr_1fr]`; motivo de anulación `max-w-md` y botón con ancho propio.
- Saldos: filas con `grid` de columnas fijas (`tabular-nums`, importes alineados a la derecha); columna derecha en `Section` con `border border-hairline` y una superficie más clara. Latte no tiene hoy ese token (solo `bg-wall-base`): se añade `--wall-raised` en claro y oscuro a los tokens, con contraste medido.
- Estadísticas: `<details open>`.

### D10. Microinteracciones (RF-233 a RF-236)

Según research R11. Todas bajo `@media (prefers-reduced-motion: no-preference)`; con movimiento reducido el estado final aparece sin transición. El `success` de `Button` lo activa la página solo con `result.type === 'success'` y se apaga a los 1,2 s.

### D11. Voces (RF-237)

Según research R12. `scripts/generar-voces.mjs` construye `LOCUCIONES` con las entradas actuales más `frases.ts`, el tour y la ayuda; `scripts/voces-interactivo.test.ts` comprueba que el catálogo tiene las 196 entradas nuevas con id único. Los audios no se generan en esta funcionalidad (fuera de alcance).

## Pruebas previstas (`docs/pruebas.md` §14)

| Regla | Nivel | Prueba |
| --- | --- | --- |
| CA-211, CA-212 | Unidad (esquema) + acción + E2E + `sin-js` | Línea sin importe; diálogo cerrado y foco en el error |
| CA-213, CA-215, RN-088, EV-108 | Propiedades (`ciclo-frases`) + integración + concurrencia (`worker_threads`) + E2E | 80 sin repetir; ciclo nuevo; dos entregas simultáneas; sin frase sin conexión ni con mascota oculta |
| CA-214, RN-089 | Integración con reloj simulado + E2E | 2 horas; prioridad sobre stock bajo |
| CA-216, CA-218, CA-219 | Componente (`CapsuleTile`) + E2E + regresión visual (390 y 1440 px) | Orden, marcas, bocadillo con el agua |
| CA-217, EV-107 | Integración (`CONFIRMAR_SIN_STOCK`) + acción + E2E + `sin-js` | Diálogo, cancelar, confirmar, paso intermedio, stock cambiado |
| CA-220, CA-221, EV-111 | E2E + `acceso` + `a11y` | Ajustes por rol, Perfil a dos columnas |
| CA-222 | Unidad (`ilustracionAvatar`) + componente + `a11y` | Ilustración estable y contraste |
| CA-223 | Integración + acción + `sin-js` | Alta con foto válida y con 6 MB |
| CA-224 | Unidad (`privacidad.test.ts`) + E2E | Texto v3 y relectura |
| CA-225 | Componente (`CapsulitoEntrada`) + E2E | Estados y respaldo estático |
| CA-226 | E2E + `a11y` | 400, 403, 404 y 500 con código |
| CA-227, CA-228 | Componente (`AyudaPanel`, `TourInicio`) + E2E + `sin-js` | Capsulito por paso; repetir el tour en Inicio |
| CA-229 | E2E | Un enlace por destino con el diálogo abierto y tras el envío |
| CA-230 a CA-232 | E2E + regresión visual | Columnas y `details` abiertos |
| CA-233 a CA-236, EV-110 | Componente (Browser Mode) + E2E con `reducedMotion: 'reduce'` | Sacudida, indicador, brillo solo con puntero fino, check solo con éxito, cifra final accesible |
| CA-237 | Unidad (`frases.test.ts`, `voces-interactivo.test.ts`) | Textos idénticos al anexo; mismas palabras en `textoVoz` sin etiquetas |
| EV-109 | `a11y` | Pantallas nuevas en claro y oscuro |

## Lotes de implementación

1. **Datos y núcleo**: migración 0008, `ciclo-frases`, `usuarios/frases.ts`, `CONFIRMAR_SIN_STOCK`, `frases.ts`. Pruebas de propiedades, integración y concurrencia.
2. **Fallos**: compras, diálogo, navegación y tour (pruebas en rojo primero).
3. **Inicio**: orden, `CapsuleTile`, confirmación con y sin JavaScript, bocadillo, frases y saludo, agua.
4. **Ajustes, Perfil, avatar, alta, privacidad**.
5. **Entrada con Rive**: proyecto RML, compilación, capturas → **parada para revisión de la persona usuaria** → integración.
6. **Errores y narración**.
7. **Maquetación** de cápsula, compra, saldos y estadísticas.
8. **Microinteracciones**.
9. **Voces**: catálogo del script y pruebas.
10. **Cierre**: `ARCHITECTURE.md`, `docs/pruebas.md`, `historias.md` §10.4 y §10.5 (CAMBIO con autorización), regresión visual actualizada, benchmark completo, TalkBack.

## Cambios en otros documentos

- `ARCHITECTURE.md` §2 y §3: `frase_entregada`, `usuarios/dominio/`, `lib/ui/avatares/`, `lib/ui/movimiento/`, `/ajustes`, `docs/diseno/f11/rive/`.
- `docs/pruebas.md`: `/ajustes` en `acceso` y `a11y`; páginas de error en `a11y`.
- `docs/diseno/`: tokens `--motion-*` y uso del brillo y el indicador.
- `historias.md` §10.4 (tabla) y §10.5 (`/ajustes`, `?/saludo`): un CAMBIO con autorización al cerrar F11.
- `e2e/acceso/rutas.ts`: `/ajustes`.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| El RML del CLI 1.7.0 no permite seguir el cursor o los disparadores | Consultar `rive docs`/`rive schema`; si no se puede, parar y proponer la alternativa SVG con CSS (research R10). |
| Inicio con muchas tarjetas y Capsulito grande empeora la deuda de WebKit (`docs/pruebas.md` §12.3) | Medir el tiempo de Inicio en el E2E de WebKit antes y después; Capsulito de Inicio con `.riv` solo si la mascota es visible y sin movimiento reducido. |
| Las frases con tacos llegan a alguien que no las espera | Decisión de la persona usuaria (DEC-119); se pueden ocultar desactivando a Capsulito en Ajustes. |
| El texto de privacidad v3 obliga a todos a releerlo | RF-160 lo exige; un solo paso. |
| La causa real del «Compras» duplicado no es la hipótesis | Prueba en rojo antes de tocar el código (R6). |
| Faltan los audios hasta que la persona usuaria los genere | `hablar()` ignora el audio que falta; la frase se ve igual. |

## Complexity Tracking

Sin infracciones de la constitución que justificar.
