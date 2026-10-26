# Implementation Plan: Pulido de Capsulito, celebración del café y gestión de personas y stock (F12)

**Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9) | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/012-pulido-capsulito-celebracion/spec.md` (aprobada el 2026-10-26), `historias.md` v0.24.0 (CAMBIO-024) y constitución 1.8.0.

**Status**: Aprobado por la persona usuaria el 2026-10-26.

## Summary

F12 no añade módulos, aristas, dependencias, tablas ni migraciones. Cambia sobre todo la interfaz y añade un tipo de aviso:

1. **Correcciones** (RF-238 a RF-240):
   - «Copiar enlace» funciona también por http.
   - El enlace generado aparece debajo de su botón.
   - En el tour habla el Capsulito de la tarjeta.
2. **Celebración** (RF-243, RF-244): confeti con CSS sobre la tarjeta y un sonido corto generado con ElevenLabs. Después llega la frase de registro.
3. **Orden de Inicio** (RN-090, RF-245): una regla pura en `economia/dominio/orden-inicio.ts`.
4. **Aviso de recuento** (RF-246): el tipo de aviso `recuento`, para todas las personas, con «Entendido» en Inicio.
5. **Capsulito en el acceso con enlace** (RF-241) y **fotos en el listado** (RF-242), con componentes que ya existen.
6. **Escena «el dinero»** (RF-247): `intro_09`, en la posición 5.
7. **Gestos de reposo** (RF-248): un `.riv` nuevo de reposo con fuente RML versionada y un catálogo tipado de tiempos.

## Technical Context

- **Language/Version**: TypeScript 6.x estricto, Node.js 24.x.
- **Primary Dependencies**: SvelteKit 3 + adapter-node 6, Svelte 5 (runes), Tailwind CSS 4, Bits UI 2, Drizzle ORM 0.45, Zod 4 y `@rive-app/canvas` 2.x. Sin dependencias nuevas.
  - Herramientas externas fuera del proyecto: el Rive CLI 1.7.0 (`~/.rive/bin/rive`), la API de efectos de sonido de ElevenLabs y `ffmpeg`, que solo se usan para generar los recursos estáticos.
- **Storage**: SQLite, sin migración. El tipo de aviso nuevo es un valor más de un `text`.
- **Testing**:
  - Vitest: unidad, propiedades con `fast-check` para RN-090 e integración con SQLite real.
  - Vitest Browser Mode para los componentes.
  - Playwright: `flujos`, `sin-js`, `a11y` y `acceso`, en los proyectos móvil y escritorio.
- **Target Platform**: PWA en Safari iOS ≥ 16.4 y Chrome Android; también escritorio.
- **Project Type**: una aplicación web SvelteKit.
- **Performance Goals**: un consumo confirmado en 1 s o menos en el percentil 95 (RNF-002). La celebración no añade espera. El sonido ocupa 30 KB como máximo y el `.riv` de reposo, 40 KB como máximo.
- **Constraints**:
  - Acciones sin JavaScript (XVII).
  - Lista cerrada de datos en el navegador (V).
  - Logs sin nombres ni importes (XVI).
  - Movimiento desactivado con `prefers-reduced-motion` (XI y XVIII).
  - Tokens de color, sin hexadecimales.
- **Scale/Scope**: unas 10 personas; 11 RF y 1 RN.

## Constitution Check (v1.8.0)

| Principio | Cumplimiento |
| --- | --- |
| I. Fuente vigente | Todo procede de la spec aprobada y de `historias.md` v0.24.0. Hay detalles que elige el agente y revisa la persona usuaria: el texto del sonido, la pose de `intro_09` y el dibujo de los gestos. |
| II. Complejidad | Sin módulos, tablas ni dependencias nuevas. Un `.riv` nuevo en lugar de 36 animaciones (research R11). Un script de una sola vez para el sonido (R5). |
| III. Módulos | RN-090 está en `economia/dominio/`. El aviso se registra en la transacción del recuento con la arista `economia → notificaciones`, que ya existe. Las rutas solo validan, llaman y traducen. |
| IV. Integridad económica | El recuento y su reparto no cambian. El aviso se escribe en la misma transacción y no modifica movimientos. La prueba compara el texto del aviso con los movimientos del reparto. |
| V. Almacenamiento | Sin claves nuevas en el navegador ni datos derivados guardados. |
| VI. Seguridad | `?/verAviso` usa `z.strictObject` y solo marca avisos de la propia persona (comprobado en el caso de uso). El script de sonido nunca muestra la clave. |
| VII. Tipado | Sin aserciones ni escapes. Los catálogos usan tipos literales. |
| VIII. Pruebas | Cada CA-238 a CA-248 tiene su prueba (ver «Pruebas previstas»). RN-090 tiene pruebas de propiedades. Los umbrales no cambian. |
| IX. Verificación | Cada lote pasa sus comprobaciones afectadas. `npm run verify` se ejecuta porque cambia el contrato `push.ts`. El cierre se hace con `scripts/benchmark.sh`. |
| X. Usabilidad | La celebración no tapa ni retrasa «Deshacer». Un café «pendiente de enviar» no tiene celebración. Las pantallas tienen como máximo una acción primaria: «Entendido» es secundaria. |
| XI. Accesibilidad | El confeti es decorativo. El enlace se anuncia con `role="status"`. El aviso de recuento es un `Banner` con texto. El avatar del listado es decorativo y el nombre está en la fila. Axe se pasa en claro y oscuro. |
| XIII. Errores | Si el sonido o el `.riv` fallan, no se bloquea ni se deshace nada. |
| XIV. Compatibilidad | `/api/consumos` no cambia. Un SW antiguo ignora el tipo de aviso nuevo (R7). |
| XVI. Registro | Sin datos personales. Hay un código nuevo, `aviso.visto`, con `avisoId`. |
| XVII. SvelteKit | Todo funciona sin JavaScript salvo el sonido, el confeti y los gestos, que son acompañamientos. El enlace generado usa `autofocus` sin JavaScript. Ningún `load` escribe: «Entendido» es una *action*. |
| XVIII. Identidad | Los gestos siguen un catálogo tipado con orden fijo según el tiempo (DEC-128), sin azar. El confeti usa tokens y no es cristal. Capsulito sigue siendo decorativo. Con movimiento reducido, todo queda quieto. |

**Uso a revisar**: `document.execCommand('copy')` (R1). Es una API del navegador desaconsejada que se usa solo como respaldo, en un único archivo. La constitución prohíbe las APIs obsoletas del framework. Si la persona usuaria prefiere no usarla, la alternativa es dejar el mensaje de copiar a mano por http (RF-238 no se cumpliría por http).

**Resultado**: sin infracciones. No hace falta ADR. ADR-0006 recibe una nota sobre el sonido y el `.riv` de reposo.

## Architecture Check (`ARCHITECTURE.md` §15)

1. **Constitución**: la tabla anterior.
2. **Ubicación**:
   - `economia/dominio/orden-inicio.ts`.
   - `lib/shared/mascota/reposo.ts`.
   - `lib/ui/movimiento/Confeti.svelte`.
   - `docs/diseno/f12/rive/reposo/` (fuente y generador).
   - `static/mascota/riv/capsulito-reposo.riv`.
   - `static/mascota/sonidos/celebracion.mp3`.
   - `scripts/generar-sonido.mjs`.
3. **Grafo**: sin aristas nuevas. `economia → notificaciones` ya existe (compras, aportaciones).
4. **Reutilización**: `CopyField`, `ListRow`, `Avatar`, `CapsulitoEntrada`, `Banner`, `Capsulito`, `TourInicio`, `registrarAviso`, `contarConsumos`, `repartirEnPersonas` y `cargarDotEnv`.
5. **Abstracciones nuevas**:
   - `Confeti`.
   - `reproducirSonido` en `lib/client/rive.ts`, el único archivo que ya crea `Audio`.
   - `montarRiveReposo` en el mismo archivo.
   - `celebrar` en el contexto de la mascota.
6. **Reglas e invariantes**:
   - RN-090 → `orden-inicio.ts` (propiedades) y `leerTiposInicio` (integración con reloj simulado).
   - RF-246 → `control.ts` (integración: el texto cuadra con los movimientos).
7. **Repetición y fallos**:
   - `?/verAviso` es idempotente.
   - Un consumo duplicado (`clienteId`) no vuelve a celebrar, porque la respuesta trae `duplicado`.
   - Un recuento que falla por `CAMBIO_CONCURRENTE` no emite aviso, porque el aviso va en la misma transacción.
8. **Contratos**: `contracts/formularios-y-avisos.md`.
9. **Autorización**:
   - `?/verAviso`: sesión, y solo avisos propios.
   - Recuento: administrador reautenticado, como hoy.
   - `/admin/usuarios`: administrador, como hoy.
10. **Afectados**: F1 (alta, acceso con enlace), F3 (Inicio), F5 y F6 (avisos, recuento), F8 (agua), F9 (Capsulito, bienvenida) y F11 (tour, `CapsulitoEntrada`, frases).
11. **Migraciones**: ninguna.
12. **SvelteKit**: ver la fila XVII.
13. **Registro**: `aviso.visto`, comprobado con el registrador falso.
14. **Estados y a11y**: el aviso de recuento tiene un estado vacío (no se muestra). Inicio, `/admin/usuarios`, `acceso/[token]`, la bienvenida y Ajustes entran en `a11y`.

## Decisiones de diseño

Las alternativas y sus motivos están en [research.md](./research.md).

### D1. Copiar y mostrar el enlace (RF-238, RF-239)

- `CopyField.copy()`:
  1. Si hay `isSecureContext` y `navigator.clipboard`, usa la API del portapapeles.
  2. Si no, selecciona el campo y llama a `execCommand('copy')`.
  3. Si falla, deja el texto seleccionado y muestra el mensaje actual.
- Las acciones devuelven `origen`. Cada formulario pinta su `CopyField anunciar` debajo de su botón. La ficha deja de pintarlo arriba.

### D2. Tour (RF-240)

`Capsulito` recibe `callado`. Inicio lo pasa mientras `tourActivo`. La tarjeta del tour usa `modo="rive"`.

### D3. Celebración (RF-243, RF-244)

- **Contador.** Al confirmar el servidor un café nuevo o un relleno de agua, la página sube el contador `celebrar[tipoId]` o `celebrarAgua`.
- **Sonido y frase.** Llama a `mascota.celebrar(fraseId)` en lugar de `decirFrase` y `hablar`. El bocadillo se actualiza enseguida y el audio de la frase espera al sonido.
- **Avisos que mandan.** El descuadre (`stock.negativo`) sigue mandando: celebra con el confeti, pero la frase es la del aviso. Así el aviso no queda tapado.
- **Ramas sin celebración.** `encolar`, `sincronizar` y los rechazos no llaman a `celebrar`.

### D4. Orden de Inicio (RN-090, RF-245)

El `load` de `/` usa `leerTiposInicio`. El contador de cafés de la tarjeta sigue contando todo el historial (F11).

### D5. Aviso de recuento (RF-246)

- **Registro.** `confirmarRecuento` acumula las líneas con diferencia y las partes de cada reparto. Al final de la transacción llama a `registrarAviso(tx, { tipo: 'recuento', … })`. `anularLineaRecuento` hace lo mismo con `accion: 'anulado'`.
- **Inicio.** Muestra el `Banner` sobre las cápsulas, después de Capsulito, con «Entendido». La acción `?/verAviso` llama a `marcarVisto`.
- **Ajustes.** Muestra el interruptor «Recuentos de stock».

### D6. Acceso con enlace (RF-241)

Usa `CapsulitoEntrada` con `taparOjos`, `fallo` y `exito`, con el mismo patrón que `login/+page.svelte`.

### D7. Listado de personas (RF-242)

El `load` añade `fotoUrl`. `ListRow` recibe `leading` con `Avatar decorativo size="sm"`.

### D8. Escena «el dinero» (RF-247)

`intro_09` va en la posición 5 de `ESCENAS_BIENVENIDA`, con la pose `senalando`. Su locución se añade a `LOCUCIONES`. Las pruebas de Bienvenida y de `/ayuda` pasan de 8 a 9 escenas.

### D9. Reposo (RF-248)

- **Catálogo.** `GESTOS_REPOSO` y `gestoEn` en `lib/shared/mascota/reposo.ts`.
- **Animación.** `capsulito-reposo.riv`, con el contrato de `contracts/formularios-y-avisos.md`.
- **Comportamiento.** `Capsulito` cambia al lienzo de reposo con un tamaño de 112 px o más y cuando no habla, no está callado y ha terminado la pose. El temporizador es de 1 s y se para con la pestaña oculta y con movimiento reducido.
- **Revisión.** Hay una parada para que la persona usuaria revise las capturas antes de integrarlo.

## Pruebas previstas (`docs/pruebas.md` §14)

| Regla | Nivel | Prueba |
| --- | --- | --- |
| CA-238 | Componente (`CopyField`, sin `navigator.clipboard`) + E2E con `http://127.0.0.1` y contexto no seguro | Copia con el respaldo; mensaje si los dos fallan |
| CA-239 | E2E + `sin-js` | Enlace debajo del botón en alta, `generarEnlace` y `reactivar`; `role="status"`; `autofocus` sin JavaScript |
| CA-240 | Componente (`TourInicio`) + E2E | `data-boca` del Capsulito de la tarjeta cambia; el de Inicio se queda en 0 |
| CA-241 | E2E + `sin-js` + `a11y` | Ojos tapados con el foco en la contraseña; estado `fallo`; estático con `reducedMotion` |
| CA-242 | E2E + `a11y` | Foto y avatar en el listado; el avatar no tiene nombre accesible propio |
| CA-243, CA-244, SC-001, SC-002 | Componente (`Confeti`, `CapsuleTile`) + E2E | Confeti y sonido solo en la rama confirmada; 10 toques seguidos sin pérdidas; sin confeti con `reducedMotion`; sin celebración en modo avión |
| CA-245, RN-090 | Propiedades (`orden-inicio`) + integración con reloj simulado + E2E | Orden propio, respaldo del departamento, empates, ventana de 30 días |
| CA-246 | Unidad (`construirMensaje`) + integración (`control.test.ts`) + acción + E2E + `sin-js` | Faltante, sobrante, mixto, sin diferencias, anulación; texto que cuadra con los movimientos; «Entendido» |
| CA-247 | Unidad (`bienvenida.test.ts`) + E2E + `sin-js` (`/ayuda`) | 9 escenas; `intro_09` en la posición 5 |
| CA-248, SC-006 | Unidad (`gestoEn`) + componente con reloj falso + E2E con `reducedMotion` | Gestos a los 6, 12, 16 y 21 s; reinicio al hablar; sin gestos a 64 px ni con movimiento reducido |
| Voces | Unidad (`voces-interactivo.test.ts`) | `intro_09` en el catálogo con etiquetas v3 |
| Sonido | Unidad (`generar-sonido.test.ts` con servidor falso) | Petición correcta, clave nunca impresa, tamaño ≤ 30 KB |

## Lotes de implementación

1. **Correcciones**: `CopyField`, enlace junto al botón y tour. Pruebas en rojo primero.
2. **Orden de Inicio**: dominio, caso de uso y `load`.
3. **Aviso de recuento**: catálogo, `control.ts`, Inicio, Ajustes y panel.
4. **Acceso con enlace y listado de personas**.
5. **Escena «el dinero»**: catálogos, locución y pruebas.
6. **Celebración**: el script de sonido y la generación, con **parada para que la persona usuaria elija el sonido**; después `Confeti`, el contexto y la página.
7. **Reposo**: generador RML, compilación y capturas, con **parada para la revisión de la persona usuaria**; después la integración en `Capsulito`.
8. **Cierre**:
   - `ARCHITECTURE.md`, `docs/pruebas.md`, `docs/diseno/` y la nota de ADR-0006.
   - Regenerar `intro_09`, que hace la persona usuaria con `./voces.sh`.
   - Benchmark completo y TalkBack.

## Cambios en otros documentos

- `ARCHITECTURE.md` §2: `economia/dominio/orden-inicio.ts`, `lib/ui/movimiento/Confeti.svelte`, `static/mascota/sonidos/` y `docs/diseno/f12/rive/`.
- `docs/adr/0006-rive-y-sincronizacion-voz-capsulito.md`: una nota sobre el sonido de celebración y el `.riv` de reposo.
- `docs/pruebas.md`: el proyecto `sin-js` cubre `?/verAviso` y el enlace con `autofocus`.
- `historias.md`: ningún cambio más. CAMBIO-024 ya recoge los requisitos. Si al cerrar cambian §10.4 o §10.5, se pide un CAMBIO nuevo con autorización.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| La causa del fallo al copiar no es el contexto no seguro | La prueba en rojo por http va antes de tocar el código (R1). |
| El RML del CLI 1.7.0 no permite el brazo del reloj ni el bostezo | Parar y proponer un gesto parecido (R11). |
| Más lienzos Rive (`md` en reposo) agravan la deuda de WebKit (`docs/pruebas.md` §12.3) | El lienzo de reposo se monta solo después de 3 s en reposo. Se mide el E2E de WebKit antes y después. |
| El sonido tapa o retrasa la frase | El sonido dura 1,2 s como máximo y tiene un fundido. Una confirmación nueva corta el anterior. |
| El navegador bloquea el audio sin interacción previa | La celebración siempre nace de un toque. Si se bloquea, se ignora. |
| Falta el audio de `intro_09` hasta que se regenera | `hablar()` ignora el audio que falta y el texto se ve igual. |

## Complexity Tracking

Sin infracciones de la constitución que justificar.
