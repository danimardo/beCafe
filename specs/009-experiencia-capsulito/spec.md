# Feature Specification: Experiencia visual, navegación y mascota Capsulito (F9)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-24

**Status**: Aprobada por la persona usuaria el 2026-10-24.

**Input**: User description: "F9 — Experiencia visual (navegación, escritorio, tarjetas de cápsula con ilustración, limpieza visual y ajustes de apariencia) y mascota interactiva Capsulito estilo Duolingo (animaciones Rive, sincronización labial y voces TTS con ElevenLabs, historia animada de bienvenida de 8 escenas y laboratorio de demostración), según historias.md v0.18.0 §15 y docs/diseno/f9/"

**Fuente**: `historias.md` v0.18.0 (CAMBIO-018, §3, §7.15, §9, §10.3, §11 DEC-105 a DEC-115, §12.1, §13 HALL-017/HALL-018 y §15), `docs/adr/0006-rive-y-sincronizacion-voz-capsulito.md` y `docs/diseno/f9/`. Los IDs se conservan. Las decisiones de la sesión del 2026-10-24 están en Clarifications.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegación persistente y contenedor de pantalla en móvil y escritorio (Priority: P1)

Un miembro autenticado puede moverse entre las 5 secciones principales (`Inicio`, `Saldos`, `Compras`, `Estadísticas`, `Perfil`) desde cualquier pantalla de la aplicación sin depender del botón «Atrás» del navegador: en móvil mediante la píldora inferior flotante y en escritorio (`≥ 768 px`) mediante la barra lateral de cristal con el grupo «Administración» para administradores y ancho ampliado (`wide`) en las pantallas de datos y gestión.

**Why this priority**: Corrige HALL-017 (ausencia de `src/routes/(app)/+layout.svelte` con `AppShell` y `AppNav`), que impedía cambiar de sección en la aplicación desplegada y estrechaba las pantallas de escritorio a `672 px`.

**Independent Test**: Ana abre `/`, `/saldos` o `/compras` en móvil (`390 × 844`) y ve la píldora inferior con 5 destinos; en escritorio (`1280 × 800`) ve la barra lateral de cristal y la cuadrícula de dos columnas en Inicio (`lg:grid-cols-12`).

**Acceptance Scenarios**:

1. **Dado** un miembro autenticado en móvil (`< 768 px`), **cuando** abre cualquier pantalla de `(app)`, **entonces** ve la píldora inferior flotante con las 5 secciones (`Inicio`, `Saldos`, `Compras`, `Estadísticas`, `Perfil`) y la sección activa marcada con `aria-current="page"` (CA-182; RF-182, DEC-105).
2. **Dado** un miembro o administrador en escritorio (`≥ 768 px`), **cuando** abre cualquier pantalla de `(app)`, **entonces** ve la barra lateral izquierda de cristal (sin píldora inferior), con el grupo «Administración» visible para administradores y enlaces a `/historial` y `/ayuda`; y en Inicio (`≥ 1024 px`) las cápsulas y la columna de agua, actividad y avisos se reparten en dos columnas (`7 + 5`) sin solapamiento (CA-182; RF-182, DEC-105, DEC-106).
3. **Dado** un miembro en `/perfil`, **entonces** puede cerrar su sesión (`POST /logout`) y, si es administrador, acceder a `/admin`, sin depender del bloque inferior que antes duplicaba estos enlaces en Inicio (Clarifications, punto 3).

---

### User Story 2 - Tarjetas de cápsula con ilustración, precio, estadísticas e invitado a un toque (Priority: P1)

En la pantalla de Inicio, cada tipo de cápsula se muestra como una tarjeta `CapsuleTile` sobre superficie `glass` con la ilustración vectorial coloreada con el color identificativo del tipo (`cap-*`), precio unitario, pastilla de stock, contadores de uso con icono (`User` para propios y `Users` para invitados, ocultos cuando ambos son `0`) y botón secundario `+1 invitado` integrado en la propia tarjeta mediante un único formulario `<form method="post" action="?/consumir">`.

**Why this priority**: Corrige HALL-018 (sustitución de `CapsuleTile` por una tarjeta plana sin ilustración y con una fila repetida «Registrar cápsula para invitado» debajo de cada cápsula) y mantiene el funcionamiento íntegro con y sin JavaScript (constitución XVII).

**Independent Test**: Ana ve la cuadrícula de cápsulas con ilustración SVG, precio, stock y botón `+1 invitado`; pulsa la tarjeta para registrar su consumo o `+1 invitado` para un invitado, con y sin JavaScript.

**Acceptance Scenarios**:

1. **Dado** un catálogo con tipos de cápsula activos, **cuando** Ana abre Inicio, **entonces** cada tarjeta `CapsuleTile` muestra la ilustración vectorial (`CapsuleIllustration`) con el color del tipo (`cap-*`), el nombre, el precio en `tabular-nums`, la pastilla de stock («Quedan N», «Stock bajo · N» o «Agotado · N»), los contadores con icono y número si ha consumido alguna, la superficie principal para registrar consumo propio (`invitado="0"`) y el botón `+1 invitado` (`invitado="1"`), sin filas adicionales debajo (CA-183; RF-183, DEC-107).
2. **Dado** el navegador con JavaScript desactivado (proyecto `sin-js`), **cuando** Ana pulsa el botón principal de la tarjeta o el botón `+1 invitado`, **entonces** el formulario `POST ?/consumir` envía `tipoCapsulaId`, `clienteId` e `invitado` (`0` o `1`) y registra el consumo en un toque (CA-183; RF-183, constitución XVII).
3. **Dado** el panel de alertas de Inicio y la campana de avisos, **entonces** el panel agrupa los avisos sin repetir el prefijo «Stock bajo:» en cada línea y la campana conserva su formulario `POST /avisos?/abrir` (RF-184, Clarifications, puntos 4 y 5).

---

### User Story 3 - Mascota Capsulito en bienvenida, estados vacíos, avisos y reacciones estilo Duolingo (Priority: P1)

La mascota del departamento («Capsulito») acompaña la experiencia diaria con sus 8 poses animadas en Rive (`.riv`), 6 expresiones faciales, respaldo estático SVG y frases con personalidad (guiños al café y al día a día informático en momentos positivos o cotidianos; tono 100 % serio y directo en deuda personal, errores, rechazos o seguridad). Al registrar un consumo, una compra, una aportación o un relleno de agua, Capsulito reacciona con una celebración breve o bocadillo contextual sin retrasar la confirmación (`≤ 1 s`) ni tapar el botón «Deshacer», rotando las frases del catálogo para no repetir la misma en dos toques seguidos.

**Why this priority**: Aporta la identidad visual y el acompañamiento interactivo estilo Duolingo (RF-185, RF-186, RF-187), respetando el orden de prioridad de la constitución (rapidez y accesibilidad por encima de estética).

**Independent Test**: Ana registra dos consumos seguidos: en cada uno aparece la confirmación inmediata con «Deshacer» y Capsulito celebrando con una frase distinta; cuando el catálogo está vacío o su saldo está al día, Capsulito aparece con la pose y expresión correspondientes del catálogo.

**Acceptance Scenarios**:

1. **Dado** un estado del sistema o un evento de operación (`consumo.confirmado`, `consumo.invitado_confirmado`, `consumo.pendiente`, `consumo.sincronizado`, `consumo.anulado`, `stock.bajo`, `stock.negativo`, `compra.confirmada`, `aportacion.confirmada`, `agua.confirmada`, `agua.rechazada_reciente`, `aguador.determinado`, `conexion.perdida`, `catalogo.vacio`), **cuando** se muestra Capsulito, **entonces** su pose, expresión y frase proceden del catálogo tipado (`lib/ui/mascota/catalogo.ts`), su imagen tiene `alt=""` o `aria-hidden="true"`, el mensaje completo está en texto visible y, si el evento se repite de forma consecutiva con varias frases disponibles, no repite la misma frase dos veces seguidas (CA-185, CA-186; RF-185, RF-186, DEC-112).
2. **Dado** un problema económico personal (saldo deudor), un error, un rechazo de negocio o un aviso de seguridad, **cuando** aparece Capsulito, **entonces** usa una pose sobria (`alerta`, `triste` o `pensando`) y un mensaje directo en español sin chistes ni culpabilización (CA-186; RF-186, DEC-113, constitución X).
3. **Dado** que Ana registra un consumo o un relleno de agua, **entonces** la confirmación con «Deshacer» aparece en `≤ 1 s` y la animación de Capsulito no intercepta el toque sobre «Deshacer» ni las tarjetas de cápsula (CA-186; RF-186, constitución X y XVIII).
4. **Dado** que un archivo `.riv` aún no ha cargado, falla o el navegador se ejecuta sin WebAssembly/Canvas (o sin JavaScript), **entonces** `Mascota` muestra de inmediato el SVG estático equivalente de `static/mascota/svg/` con el mismo texto visible (CA-187; RF-187, ADR-0006).

---

### User Story 4 - Historia animada de bienvenida de 8 escenas, guía en `/ayuda` y laboratorio `/ayuda/capsulito` (Priority: P2)

En el primer acceso de un miembro en un dispositivo (tras haber aceptado la información de privacidad de RF-133), la aplicación ofrece una invitación opcional a ver la historia animada de bienvenida de 8 escenas (`intro_01` a `intro_08`) en la que Capsulito presenta cómo funciona el café del departamento, con controles «Saltar», «Anterior / Siguiente» y «Activar voz / Silenciar», además de su versión estática siempre disponible en `/ayuda` (incluso sin JavaScript) y un laboratorio interactivo en `/ayuda/capsulito` donde cualquier miembro puede probar todas las poses, expresiones, eventos y locuciones.

**Why this priority**: Permite conocer el funcionamiento de beCafé de forma amena sin bloquear el uso inmediato de la cafetera, y facilita verificar todas las poses, animaciones Rive, bocas y voces de Capsulito en un solo lugar (RF-185, RF-188, DEC-114).

**Independent Test**: En un dispositivo sin `becafe-bienvenida="1"`, Ana ve la invitación a la historia de 8 escenas, avanza o la salta, y no vuelve a salir sola; en `/ayuda` puede volver a abrirla o leer las 8 escenas sin JavaScript; en `/ayuda/capsulito` puede reproducir cualquier escena, pose, expresión o evento con o sin voz.

**Acceptance Scenarios**:

1. **Dado** un dispositivo donde `becafe-bienvenida` no vale `"1"` y el miembro ya ha aceptado la privacidad (RF-133), **cuando** entra en Inicio, **entonces** ve la invitación para recorrer la historia de 8 escenas (`intro_01` a `intro_08`) con los controles «Saltar», «Anterior / Siguiente» y «Activar voz / Silenciar»; al terminarla o cerrarla, se guarda `becafe-bienvenida="1"` en `localStorage` y no vuelve a abrirse sola (CA-185; RF-185, DEC-110).
2. **Dado** un miembro en `/ayuda`, **entonces** ve la guía estática con las 8 escenas de Capsulito (legible con y sin JavaScript), un botón «Ver bienvenida» para reproducir la historia interactiva y un enlace al laboratorio `/ayuda/capsulito` (CA-185, CA-188; RF-185, RF-188).
3. **Dado** cualquier miembro autenticado en `/ayuda/capsulito`, **cuando** selecciona una pose (`8`), una expresión (`6`), una escena de la historia (`intro_01..08`) o un evento del catálogo y pulsa reproducir (con o sin voz), **entonces** Capsulito ejecuta la animación Rive y, si la voz está activa, reproduce el `.mp3` sincronizando las formas de boca `0..7` según su archivo `.json` de tiempos (CA-187, CA-188; RF-187, RF-188, DEC-111, DEC-114).

---

### User Story 5 - Preferencias de apariencia, mascota y voz por dispositivo en `/perfil` (Priority: P2)

En `/perfil`, cualquier miembro puede elegir en su dispositivo el tema (`Automático`, `Claro`, `Oscuro`), activar o desactivar «Reducir transparencia», ocultar o mostrar a Capsulito («Mostrar mascota») y activar o silenciar las locuciones («Voz de Capsulito»). Todos los ajustes se validan con un esquema Zod al leerse de `localStorage`, surten efecto de inmediato sin recargar la página ni perder foco, y respetan siempre las preferencias de accesibilidad del sistema (`prefers-reduced-motion`, `prefers-reduced-transparency`).

**Why this priority**: Completa RF-180 y RF-181 junto con los nuevos ajustes de mascota y voz (RF-185, RF-187, DEC-110), garantizando que ninguna animación o locución sea intrusiva.

**Independent Test**: Ana cambia el tema a Oscuro, activa «Reducir transparencia», desactiva «Mostrar mascota» en `/perfil`, vuelve a Inicio y comprueba que Capsulito no aparece y que las superficies son opacas; al recargar la página, las preferencias se mantienen sin destello inicial.

**Acceptance Scenarios**:

1. **Dado** un miembro en `/perfil`, **cuando** cambia el tema (`Automático`, `Claro`, `Oscuro`) o «Reducir transparencia», **entonces** `<html>` actualiza `data-theme` y `data-transparencia="reducida"` al instante sin perder foco, y la preferencia persiste en `localStorage` validada con Zod (CA-180, CA-181; RF-180, RF-181, DEC-110).
2. **Dado** un miembro en `/perfil`, **cuando** desactiva «Mostrar mascota» (`becafe-mascota="0"`), **entonces** `<html>` recibe `data-mascota="oculta"` y Capsulito no se renderiza en ninguna pantalla ni lanza la bienvenida ni reproduce voz; cuando está activa y cambia «Voz de Capsulito» (`becafe-voz="1"` o `"0"`), activa o silencia las locuciones pregeneradas (CA-185, CA-187; RF-185, RF-187, DEC-110).
3. **Dado** el sistema operativo con `prefers-reduced-motion: reduce` activo, **entonces** las animaciones Rive de Capsulito permanecen en pose estática (`reducedMotion = true` o respaldo SVG) y no se ejecutan transiciones de celebración, con independencia de los ajustes de la aplicación (CA-187, EV-101, EV-102; RF-187, constitución XI y XVIII).

---

### Edge Cases

- Un valor corrupto o desconocido en `localStorage` (`becafe-theme`, `becafe-transparencia`, `becafe-mascota`, `becafe-voz`, `becafe-bienvenida`) no rompe la página: el esquema Zod lo descarta y aplica el valor seguro por defecto (`auto`, `"0"`, `"1"`, `"0"`, `"0"`).
- Si el usuario activa «Ocultar mascota» mientras se está reproduciendo una locución de Capsulito, el audio se detiene de inmediato y la boca vuelve a reposo (`0`).
- Si se dispara una nueva locución antes de que termine la anterior, la anterior se cancela limpiamente (`Audio.pause()`, limpieza de `requestAnimationFrame` y `mouth = 0`) antes de iniciar la nueva.
- Si el navegador bloquea la reproducción automática de audio (`NotAllowedError`) o falta un archivo `.mp3`/`.json`, Capsulito muestra la animación y el bocadillo de texto sin lanzar un error no controlado.
- Si todas las variantes de un evento en el catálogo tienen una sola frase, se muestra esa frase; si tiene 2 o más, nunca se elige la misma que en la aparición inmediatamente anterior de ese evento.
- Durante el primer acceso de un miembro que aún debe aceptar la privacidad (RF-133), la invitación a la historia de bienvenida de Capsulito no se superpone ni compite con la pantalla `/privacidad`: solo aparece tras llegar a `(app)` con la privacidad aceptada.

## Requirements *(mandatory)*

### Functional Requirements

**Apariencia, navegación, tarjetas de cápsula y mascota Capsulito** (`historias.md` §7.15)

- **RF-180**: El cliente deberá permitir elegir en `/perfil` el tema (`Automático`, `Claro`, `Oscuro`), con `Automático` por defecto, guardado por dispositivo en `localStorage` (`becafe-theme`) y aplicado en `<html>` antes del primer pintado.
- **RF-181**: El cliente deberá permitir activar o desactivar en `/perfil` el ajuste «Reducir transparencia», desactivado por defecto, guardado por dispositivo en `localStorage` (`becafe-transparencia`) y aplicado junto con `prefers-reduced-transparency: reduce`.
- **RF-182**: Todas las pantallas autenticadas de `(app)` deberán compartir el contenedor de aplicación (`AppShell`) y la navegación principal (`AppNav`): píldora inferior flotante de 5 secciones (`Inicio`, `Saldos`, `Compras`, `Estadísticas`, `Perfil`) en móvil (`< 768 px`) y barra lateral izquierda de cristal en escritorio (`≥ 768 px`) con el grupo «Administración» para administradores y enlaces a `/historial` y `/ayuda`. En escritorio, Inicio deberá distribuirse en dos columnas (`7 + 5` en `≥ 1024 px`) y las pantallas de datos y administración usarán contenedor ancho (`wide`). En `/perfil` deberán estar disponibles el cierre de sesión (`POST /logout`) y el acceso a `/admin` para administradores, eliminando el bloque duplicado al pie de Inicio.
- **RF-183**: En Inicio, cada tipo de cápsula activo deberá mostrarse con el componente `CapsuleTile` sobre superficie `glass` (con alternativa opaca), incluyendo la ilustración vectorial `CapsuleIllustration` coloreada según el tipo (`cap-*`), el nombre, el precio unitario, la pastilla de stock (`StockPill`), los contadores de uso con icono (`User` y `Users`, ocultos cuando ambos son `0`) y la acción secundaria `+1 invitado` integrada dentro de la propia tarjeta mediante un formulario `<form method="post" action="?/consumir">` funcional con y sin JavaScript.
- **RF-184**: Los paneles de alertas (`AlertsPanel`), cabeceras y fechas deberán eliminar textos redundantes: agrupar avisos de stock bajo bajo un único título sin repetir «Stock bajo:» por línea, usar iconos con número en las tarjetas de cápsula y mostrar fechas cortas en minúscula (`20 oct`).
- **RF-185**: La aplicación deberá incorporar la mascota «Capsulito» con 8 poses (`saludo`, `celebrando`, `pensando`, `dormido`, `alerta`, `triste`, `cafetera`, `hucha`) y 6 expresiones faciales (`feliz`, `orgulloso`, `pensando`, `sorprendido`, `triste`, `dormido`), su historia de bienvenida opcional de 8 escenas (`intro_01` a `intro_08`) en el primer acceso por dispositivo (`becafe-bienvenida`), la guía estática e interactiva en `/ayuda` y el ajuste «Mostrar mascota» en `/perfil` (`becafe-mascota`, activo por defecto).
- **RF-186**: Capsulito deberá reaccionar a los estados y eventos del catálogo tipado (`consumo.confirmado`, `consumo.invitado_confirmado`, `consumo.pendiente`, `consumo.sincronizado`, `consumo.anulado`, `stock.bajo`, `stock.negativo`, `compra.confirmada`, `aportacion.confirmada`, `agua.confirmada`, `agua.rechazada_reciente`, `aguador.determinado`, `conexion.perdida`, `catalogo.vacio`) sin retrasar la confirmación (`≤ 1 s`) ni tapar el botón «Deshacer», rotando las frases disponibles sin repetir la misma dos veces seguidas, con tono alegre y guiños cafeteros/informáticos en eventos positivos o cotidianos y tono serio y directo en deuda personal, errores, rechazos o seguridad.
- **RF-187**: El componente `Mascota` deberá animar las poses mediante archivos Rive (`.riv`, máquina de estados `Capsulito` con capas `Movimiento` y `Boca` y `ViewModel` `Default`: `play`, `cancel`, `autoPlay`, `reducedMotion`, `mouth` `0..7`, `speechDemo`) a través del adaptador único `src/lib/client/rive.ts`, con respaldo estático SVG inmediato (`static/mascota/svg/`), locuciones pregeneradas opcionales (`static/mascota/voces/<id>.mp3`) generadas con ElevenLabs (`eleven_v3`) y sincronización labial mediante pistas de tiempos (`static/mascota/voces/<id>.json`, bocas `1..7`), respetando `prefers-reduced-motion` y el ajuste «Voz de Capsulito» en `/perfil` (`becafe-voz`, desactivado por defecto en reacciones cotidianas).
- **RF-188**: La ruta `/ayuda/capsulito` deberá ofrecer a cualquier miembro autenticado un laboratorio interactivo de demostración para inspeccionar y reproducir las 8 poses, las 6 expresiones, las 8 escenas de la historia de bienvenida y todos los eventos del catálogo, conmutando animación Rive, respaldo SVG, movimiento reducido y voz con sincronización labial.

### Non-Functional Requirements

- **RNF-001 / RNF-015**: Todas las pantallas modificadas y `/ayuda/capsulito` cumplen WCAG 2.2 nivel AA, mantienen contraste compuesto `≥ 4,5:1` en claro y oscuro y superan `axe` sin infracciones en ambos temas. La imagen de Capsulito es siempre decorativa (`alt=""` o `aria-hidden="true"`) y el texto adyacente contiene el mensaje íntegro.
- **RNF-002**: El registro de un consumo o de un relleno de agua se confirma en `≤ 1 s` sin que la animación ni la carga de `.riv` o `.mp3` bloqueen la respuesta ni el botón «Deshacer».
- **Constitución VI y XVI**: `ELEVENLABS_API_KEY` y `ELEVENLABS_VOICE_ID` solo se leen en el script local de generación de activos (`scripts/generar-voces.mjs`) desde `.env`; nunca se incluyen en `src/`, en el código compilado, en el contenedor de producción ni en los logs.
- **Constitución XVII**: Los formularios de consumo (`CapsuleTile`), avisos (`NotificationBell`), perfil y cierre de sesión funcionan sin JavaScript (`sin-js`).

### Out of Scope

- Sistema de gamificación por niveles de café, rachas, insignias o puntos (`PEND-037`, pospuesto a una funcionalidad futura; véase Clarifications, punto 2).
- Modificaciones al esquema de base de datos SQLite o nuevas tablas en el servidor (todas las preferencias de apariencia y mascota son por dispositivo en `localStorage`).
- Llamadas en tiempo de ejecución desde el navegador o desde el servidor de producción a la API de ElevenLabs (todos los `.mp3` y `.json` se pregeneran en `static/mascota/voces/`).

### Key Entities

- **Momento o evento de Capsulito (`MomentoMascota` / `EntradaCatalogoMascota`)**: identificador tipado, pose (`saludo | celebrando | pensando | dormido | alerta | triste | cafetera | hucha`), expresión (`feliz | orgulloso | pensando | sorprendido | triste | dormido`), tono (`alegre | neutro | serio`), variantes de frase con `id` de audio, `texto` limpio (mostrado en pantalla y leído por lectores de pantalla) y `textoVoz` expresivo (con etiquetas de ElevenLabs v3 para generar la locución).
- **Pista de sincronización labial (`PistaLipSync`)**: archivo JSON estático (`static/mascota/voces/<id>.json`) con la duración y la lista de `cues` (`start`, `end`, `value` `1..7`) que mapean cada fonema/carácter pronunciado a las 8 formas de boca del `.riv` (`0` cerrada a `7` M/B/P).
- **Preferencias de apariencia y mascota (`PreferenciasDispositivo`)**: valores por dispositivo en `localStorage` validados con esquemas Zod en `src/lib/shared/contratos/apariencia.ts` (`becafe-theme`, `becafe-transparencia`, `becafe-mascota`, `becafe-voz`, `becafe-bienvenida`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **CA-180 a CA-188**: cada criterio tiene al menos una prueba automatizada que lo nombra en su descripción (`CA-180`, `CA-181`, `CA-182`, `CA-183`, `CA-185`, `CA-186`, `CA-187`, `CA-188`) y pasa.
- **EV-101 y EV-102**: superan las pruebas E2E y de accesibilidad (`axe` en claro y oscuro, `prefers-reduced-motion`, `prefers-reduced-transparency` y proyecto `sin-js`).
- **Verificación completa**: `npm run verify` y la suite E2E pasan sin errores ni advertencias, manteniendo los umbrales de cobertura de la constitución (Principio VIII).

## Traceability Matrix

Niveles previstos según `docs/pruebas.md` §14.1. El plan los concreta.

| Regla y fuente | Riesgo o invariante | Escenario o contraejemplo | Nivel | Evidencia |
| --- | --- | --- | --- | --- |
| CA-180, CA-181, EV-101 (RF-180, RF-181) | Pérdida de foco o destello al cambiar tema/transparencia; valor inválido en `localStorage` | Cambio de tema y transparencia en `/perfil`; lectura con Zod de valores corruptos | Unidad + Componente + E2E | Prevista |
| CA-182 (RF-182, DEC-105, DEC-106) | Pantallas sin navegación o solapadas en escritorio; falta de logout/admin en `/perfil` | Móvil (`390×844`) con píldora inferior; escritorio (`1280×800`) con barra lateral y 2 columnas; `/perfil` con logout y enlace `/admin` | E2E + `acceso` + `axe` | Prevista |
| CA-183 (RF-183, RF-184, DEC-107) | Registro de consumo o invitado roto sin JS; texto redundante en tarjetas y alertas | Tap en tarjeta y en `+1 invitado` con y sin JS; contadores `0` ocultos; `StockPill` | Componente + E2E + `sin-js` | Prevista |
| CA-185 (RF-185, DEC-108, DEC-110) | Bienvenida intrusiva o repetida; mascota visible tras desactivarla en `/perfil` | Primer acceso muestra bienvenida de 8 escenas; tras saltar/cerrar no repite; ajuste `becafe-mascota="0"` la oculta; `/ayuda` funciona sin JS | Unidad + Componente + E2E + `sin-js` | Prevista |
| CA-186 (RF-186, DEC-112, DEC-113) | Frase repetida en toques seguidos; chiste en deuda/error; animación tapa «Deshacer» | Dos consumos consecutivos eligen distinta frase; saldo negativo usa tono serio; «Deshacer» sigue clicable en `≤ 1 s` | Unidad + Componente + E2E | Prevista |
| CA-187, EV-102 (RF-187, DEC-111, ADR-0006) | Fallo de `.riv` o `.mp3` rompe la pantalla; movimiento o voz activos con `prefers-reduced-motion` / mascota oculta | Respaldo SVG inmediato; sincronización de boca `0..7` con `.json`; congelación con `prefers-reduced-motion: reduce`; `axe` en claro y oscuro | Unidad + Componente + E2E + `axe` | Prevista |
| CA-188 (RF-188, DEC-114) | Laboratorio `/ayuda/capsulito` inaccesible o sin controles de prueba | Miembro autenticado abre `/ayuda/capsulito`, conmuta poses, expresiones, escenas y voz | E2E + `acceso` + `axe` | Prevista |

## Assumptions

- Los activos vectoriales (`.svg`, `.webp`) y las animaciones compiladas de Rive (`.riv`, versión 0.2.0 con máquina de estados `Capsulito` y `ViewModel` `Default`) ya están depositados en `static/mascota/` y `static/ilustraciones/capsula.svg`.
- Las locuciones `.mp3` y sus archivos de tiempos `.json` para las 8 escenas de la historia y las frases del catálogo se generan con `scripts/generar-voces.mjs` usando la voz `TfkjFyM0u8G2kDTCi1Qi` y el modelo `eleven_v3` de ElevenLabs, y se versionan en `static/mascota/voces/` para que la aplicación no dependa de ElevenLabs en producción ni en CI.

## Clarifications

### Session 2026-10-24

1. **Unificación de F9 y F10 en una sola funcionalidad (`specs/009-experiencia-capsulito/`).** Se unifican en F9 tanto la corrección visual del sistema Latte (navegación, escritorio, `CapsuleTile` con ilustración, limpieza de textos, ajustes de apariencia) como la experiencia interactiva completa de Capsulito estilo Duolingo (Rive `.riv` v0.2.0, sincronización labial y voces con ElevenLabs, historia animada de 8 escenas y laboratorio `/ayuda/capsulito`).
2. **Gamificación (`PEND-037`) fuera de alcance.** El sistema de niveles, rachas o puntos de café mencionado como idea futura en las notas de F10 queda pospuesto fuera de F9 para no mezclar reglas de negocio no cerradas.
3. **Cierre de sesión y enlace a Administración en `/perfil`.** Al eliminar el bloque redundante «Mi perfil / Cerrar sesión» del pie de Inicio (`src/routes/(app)/+page.svelte`), se añaden en `src/routes/(app)/perfil/+page.svelte` tanto el formulario `POST /logout` («Cerrar sesión») como la tarjeta de enlace a `/admin` («Administración», visible para administradores).
4. **Mejora progresiva (`sin-js`) intacta.** Se adaptan los componentes de referencia del diseñador para cumplir el principio XVII de la constitución: `CapsuleTile` usa un único `<form method="post" action="?/consumir">` con dos botones `type="submit"` (`name="invitado" value="0"` y `name="invitado" value="1"`), los formularios de `/perfil` permanecen en la propia página (sin exigir un modal `Sheet` con JS) y `NotificationBell` conserva su `<form method="post" action="/avisos?/abrir">`.
5. **Limpieza de textos y actualización de pruebas existentes.** Se aplica la limpieza visual (`AlertsPanel` sin repetir «Stock bajo:» en cada línea, iconos con número en `CapsuleTile`, fechas cortas) y se actualizan las pruebas de ruta y E2E existentes cuyas aserciones de texto cambien por esta mejora.
6. **Reacciones estilo Duolingo en operaciones diarias.** Capsulito acompaña las operaciones cotidianas (consumo propio e invitado, consumo en cola y sincronizado, anulación, compra, aportación, relleno de agua, aguador del mes, stock bajo/negativo) mediante un aviso o celebración no bloqueante que nunca tapa el botón «Deshacer» ni retrasa la confirmación (`≤ 1 s`), rotando frases sin repetir la misma dos veces seguidas.
7. **Personalidad de Capsulito.** Alegre, cómplice y con guiños al café y a la informática en momentos positivos o cotidianos; 100 % serio, claro y sin bromas cuando informa de deuda personal, errores, rechazos de negocio o cuestiones de seguridad.
8. **Historia de bienvenida de 8 escenas y laboratorio `/ayuda/capsulito`.** La historia de 8 escenas (`intro_01` a `intro_08`) se ofrece como invitación opcional en el primer acceso por dispositivo (tras aceptar privacidad), tiene versión estática e interactiva en `/ayuda` y cuenta con el laboratorio de demostración en `/ayuda/capsulito` accesible para cualquier miembro autenticado.
9. **Persistencia de preferencias en `localStorage`.** Los ajustes de tema (`becafe-theme`), transparencia (`becafe-transparencia`), mostrar mascota (`becafe-mascota`), voz (`becafe-voz`) y bienvenida vista (`becafe-bienvenida`) se guardan por dispositivo en `localStorage`, validados con esquemas Zod en `src/lib/shared/contratos/apariencia.ts`, sin cambios en SQLite.
10. **Generación de voces expresivas con ElevenLabs (`eleven_v3`).** El catálogo separa `texto` (texto limpio visible y accesible) y `textoVoz` (con etiquetas expresivas de ElevenLabs como `[excited]`, `[chuckles]`, `[sighs]`, etc.). El script `scripts/generar-voces.mjs` usa `ELEVENLABS_API_KEY` y `ELEVENLABS_VOICE_ID=TfkjFyM0u8G2kDTCi1Qi` desde `.env` contra `/v1/text-to-speech/{voiceId}/with-timestamps` para generar los `.mp3` y los `.json` de sincronización labial (`cues` `1..7`, ignorando los caracteres entre corchetes `[...]` de las etiquetas expresivas salvo risas), versionados en `static/mascota/voces/`.
11. **Enmienda constitucional `v1.7.0` y `CAMBIO-018` (`historias.md` `v0.18.0`).** Aprobados y aplicados junto con el `ADR-0006` para amparar `@rive-app/canvas` en `src/lib/client/rive.ts`, las preferencias de mascota en `localStorage` y las dos excepciones cerradas de superficie `glass` (`CapsuleTile` de Inicio y bocadillo/tostada de Capsulito).
