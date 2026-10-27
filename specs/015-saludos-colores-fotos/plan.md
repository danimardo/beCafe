# Implementation Plan: Mensaje del día de Capsulito, colores y fotos de cápsula, encuadre de fotos y copias más claras (F15)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: `specs/015-saludos-colores-fotos/spec.md`, aprobada el 2026-10-27 y traspasada a `historias.md` v0.27.0 (CAMBIO-027). Constitución 1.9.0.

**Status**: Aprobado por la persona usuaria el 2026-10-27.

## Summary

F15 reúne cinco mejoras independientes. Ninguna toca datos económicos.

- **Mensaje del día**: una tabla nueva en `usuarios` (una fila por persona y día) y un catálogo tipado de 40 textos en `lib/shared`. Se asigna en el `load` de Inicio, para que funcione sin JavaScript.
- **Colores**: el color propio se guarda en la columna `color` que ya existe, como `#rrggbb`. Una función pura calcula el relleno, el límite y el texto para claro y oscuro.
- **Fotos**: `procesarFoto` aprende a recortar con una zona de encuadre o por el centro. Un componente nuevo de `lib/ui` permite encuadrar con puntero y teclado. «Quitar foto» de cápsula reutiliza el patrón de la foto de persona.
- **Copias**: cambio de presentación.

Hay una migración (tabla `mensaje_dia`). No hay dependencias nuevas.

## Technical Context

**Language/Version**: TypeScript 6 (estricto), Node 24, SvelteKit 3, Svelte 5 (runes)
**Primary Dependencies**: las de la constitución. Ninguna nueva: el recorte lo hace `sharp` (ya en `plataforma/imagenes.ts`); el selector de color es `<input type="color">`; el encuadre usa Pointer Events y CSS.
**Storage**: SQLite. Tabla nueva `mensaje_dia` (migración `0009_f15-mensaje-dia.sql`). `tipo_capsula.color` admite además `#rrggbb` (sin cambio de esquema: es `text` sin restricción).
**Testing**: Vitest (unitarias, propiedades con `fast-check`, integración con SQLite real y concurrencia con `worker_threads`), Vitest Browser Mode (componentes), Playwright (E2E, `sin-js`, `acceso`, axe).
**Target Platform**: Docker en Coolify, una instancia; móvil primero.
**Performance Goals**: asignar el mensaje del día añade menos de 50 ms al `load` de Inicio en p95 (RNF-F15-3): una lectura por clave primaria y, una vez al día, una inserción.
**Constraints**: constitución III, V, VI, X, XI, XVI, XVII y XVIII (1.9.0); todo funciona sin JavaScript.
**Scale/Scope**: unos 10 usuarios; fotos de hasta 5 MB.

## Constitution Check

| Principio | Cumplimiento |
| --- | --- |
| I. Trazabilidad | Cada decisión cita RN-091, RF-266 a RF-275 y DEC-135 a DEC-138 de `historias.md` v0.27.0. |
| II. Complejidad | Sin dependencias ni tareas programadas nuevas. Una tabla con un problema concreto (RN-091: el mismo mensaje en todos los dispositivos). Un componente nuevo (`EncuadreFoto`) para cinco formularios. |
| III. Módulos | El mensaje del día vive en `usuarios`, junto a las frases. El color y el encuadre son funciones puras de `lib/shared`. El recorte sigue en `plataforma/imagenes.ts`. «Quitar foto» de cápsula vive en `catalogo`. |
| IV. Integridad económica | No aplica: nada toca registros económicos. |
| V. Almacenamiento | La asignación del mensaje del día se guarda en la cuenta (servidor), no en el navegador. Fechas en UTC; el día se calcula en `Europe/Madrid`. |
| VI. Seguridad | El color propio y el encuadre se validan con Zod en la frontera (`z.strictObject`). La zona de encuadre se vuelve a comprobar contra el tamaño real de la foto en el servidor. |
| X. Usabilidad | «Otro color» y «Quitar foto» tienen etiqueta visible. Una acción primaria por pantalla. |
| XI. Accesibilidad | El encuadre se maneja con teclado, sus controles tienen nombre y el zoom se anuncia en una región `status`. Axe en claro y oscuro en las pantallas tocadas. |
| XVI. Registro | Eventos nuevos con identificadores y códigos: `mensaje_dia.asignado` (sin texto), `foto.recortada` (bytes y modo), `foto.rechazada` con motivo `encuadre`. Nunca el color ni el texto. |
| XVII. SvelteKit | Asignación en `load`; «Quitar foto» y el encuadre van en `<form method="post">` con *action*. Sin JavaScript: recorte central. |
| XVIII. Identidad visual | Color propio según la excepción cerrada de 1.9.0: texto y límite calculados (4,5:1 y 3:1) y tono oscuro determinista. Ningún otro color fuera de los tokens. El encuadre y las secciones de copias no usan cristal. |

Resultado: **supera la revisión** con la constitución 1.9.0, enmendada el 2026-10-27 para el color propio.

## Diseño por historia

### D1. Mensaje del día (US1, RN-091, RF-266 a RF-268, DEC-135)

**Catálogo** (`lib/shared/mascota/mensajes-dia.ts`): `MENSAJES_DIA: readonly { id: string; texto: string }[]`, con 40 entradas `dia_01` a `dia_40`, congelado. Los textos parten de la muestra de la spec, en forma neutra de género. Solo usan `{nombre}`; se formatean con `formatearTextoMascota`.

**Dominio** (`usuarios/dominio/mensaje-dia.ts`, puro): `elegirMensajeDia(ids, vistosEnVuelta, vuelta, azar) → { mensajeId, vuelta }`. Elige entre los no vistos y, si no queda ninguno, abre la vuelta siguiente. Ignora los vistos que ya no están en el catálogo. Reutiliza `siguienteFrase` si encaja sin cambiar su contrato; si no, es una función hermana.

**Tabla** `mensaje_dia` (ver [data-model.md](data-model.md)): clave primaria `(usuario_id, dia)`.

**Caso de uso** `asignarMensajeDia(ambiente, usuarioId, { hayAviso })` (`usuarios/mensaje-dia.ts`, exportado por `index.ts`):

1. Calcula `dia` (`FechaMadrid` de `ambiente.reloj.ahora()`).
2. Si ya hay fila para `(usuario, dia)`, devuelve su `mensajeId`. Solo lee.
3. Si `hayAviso`, devuelve `null` sin escribir (RN-091: un día con aviso no gasta mensaje).
4. Si no, dentro de `enTransaccion`: lee la vuelta actual y los vistos, elige, inserta con `ON CONFLICT DO NOTHING` y vuelve a leer la fila del día. Dos peticiones simultáneas reciben la misma (RF-268, EV-114). Borra las vueltas anteriores a la previa, como `frases.ts`.

**Qué es «aviso» en el servidor**: deuda (saldo por debajo del límite), stock bajo y aguador del mes, que el `load` de Inicio ya calcula. El rechazo y los pendientes viven en la cola del navegador y el servidor no los conoce. Si los hay, el mensaje ya asignado espera en el bocadillo hasta que se resuelven el mismo día. Ver research R1.

**Inicio**:

- `+page.server.ts` llama a `asignarMensajeDia` y devuelve `mensajeDia: { id, texto } | null`.
- `+page.svelte`: cuando `momentoInicio` devuelve `saludo-manana` o `saludo-tarde` y hay `mensajeDia`, pasa `mensaje={formatearTextoMascota(texto, { nombre })}` a `Capsulito`. La pose sigue siendo la del momento. Sin `mensajeDia`, queda el texto del momento como respaldo.
- El saludo rotativo (RF-214) no cambia: sale primero durante 6 s y después vuelve el bocadillo base, que ahora muestra el mensaje del día.
- El mensaje del día no se locuta: el bocadillo base ya no se decía, y así sigue.

**Privacidad** (RF-224, anexo A v4): `textos.ts` incorpora la versión 4 del texto, que añade «los mensajes del día que ya te ha mostrado». Al subir la versión, RF-160 pide a cada miembro que la vuelva a aceptar al entrar. Es lo que define RF-160 y lo recoge la spec.

### D2. Colores de cápsula (US2, RF-269 a RF-271, DEC-136)

**Contrato** (`lib/shared/contratos/capsulas.ts`):

- `COLORES_CAPSULA_ELEGIBLES`: los 7 tokens sin `cap-rosa`.
- `COLORES_CAPSULA` conserva los 8 para leer los tipos que ya existen.
- El campo `color` del esquema pasa a ser `z.union([z.enum(COLORES_CAPSULA_ELEGIBLES), z.literal('cap-rosa'), colorPropio])`, con `colorPropio = z.string().regex(/^#[0-9a-f]{6}$/i).transform(minúsculas)`.
- El rosa solo se acepta si es el color actual del tipo: lo comprueba `catalogo` al actualizar y lo rechaza con el código `COLOR_NO_ELEGIBLE` en el alta o si el tipo no era rosa.

**Cálculo** (`lib/shared/capsulas/color-propio.ts`, puro, con prueba de propiedades):

- `luminancia(hex)` y `contraste(a, b)` según WCAG 2.2.
- `coloresCapsula(hex) → { claro: { relleno, limite, texto }, oscuro: { relleno, limite, texto } }`:
  - **Relleno**: en claro, el color tal cual; en oscuro, el mismo tono con la luminosidad ajustada (en OKLCH, acotada a un intervalo fijo) para que no deslumbre ni desaparezca sobre `wall-base` oscuro.
  - **Límite**: el relleno, oscurecido o aclarado por pasos fijos hasta un contraste ≥ 3:1 con `wall-raised` de cada tema.
  - **Texto**: `ink` u `on-accent` del tema, el que da ≥ 4,5:1 sobre el relleno. Si ninguno llega, el relleno se ajusta hasta que uno llega.
  - Los colores de referencia de cada tema se importan de un módulo generado desde los tokens, no se escriben a mano (research R2).
- Es determinista: mismo color, mismo resultado (RF-270).

**Pintado** (`lib/ui/utils.ts`):

- `colorCapsulaCss(color)` sigue devolviendo `var(--cap-…)` para los tokens.
- Para `#rrggbb` devuelve `var(--cap-propio)`, y un nuevo `estiloColorCapsula(color)` genera `--cap-propio-claro`, `--cap-propio-oscuro`, `--cap-propio-limite-claro`, `--cap-propio-limite-oscuro`, `--cap-propio-texto-claro` y `--cap-propio-texto-oscuro`.
- Una regla de `app.css` elige `--cap-propio` y `--cap-propio-limite` según el tema, con los mismos selectores que los tokens (`prefers-color-scheme` y `[data-theme]`).
- Lo usan `CapsuleImage`, `CapsuleIllustration`, `CapsuleTile`, `SplitBar` (estadísticas) y `UndoToast`.

**Formulario** (`CapsuleColorField`):

- 7 radios con su muestra y su nombre, y un octavo «Otro color» con un `<input type="color">` asociado.
- Elegir en el selector marca «Otro color».
- Si el tipo es rosa, aparece un radio más, «Rosa (color actual)», marcado.
- Sin JavaScript, el `<input type="color">` funciona igual y el radio «Otro color» se marca a mano. Si llega «Otro color» sin valor, el servidor lo rechaza en el campo.
- La vista previa muestra la ilustración con los colores calculados del tema actual.

### D3. Quitar la foto de una cápsula (US3, RF-272)

- **`catalogo/fotos.ts`**: `quitarFotoTipo(ambiente, actor, tipoId)`.
  - `exigirAdministrador`.
  - En una transacción, pone `foto_ruta = null` y anota la auditoría `capsula.foto_quitada` (función pública de `usuarios`).
  - Fuera de la transacción, `borrarFoto`.
  - Sin foto, no hace nada.
- **Ruta `admin/capsulas/[capsulaId=ulid]`**: *action* `?/quitarFoto` y un `<form method="post">` aparte con «Quitar foto», solo si hay foto. La ayuda del formulario avisa de que guarde antes los cambios.

### D4. Encuadre de fotos (US4, RF-273, RF-274, DEC-137)

**Contrato** (`lib/shared/contratos/encuadre.ts`):

- `esquemaEncuadre = z.strictObject({ encuadreX, encuadreY, encuadreLado })`. Cada campo es `z.coerce.number().min(0).max(1)` y `encuadreLado` además `.gt(0)`.
- Todos opcionales y «todos o ninguno».
- Se incorpora a `esquemaCapsula`, al contrato de la foto de persona (`fotos-usuario.ts`) y al alta de persona.
- **Unidades**: `x` en fracción del ancho, `y` en fracción del alto y `lado` en fracción del lado menor, todas sobre la foto ya orientada.

**Servidor** (`plataforma/imagenes.ts`, sigue siendo el único archivo con `sharp`): `procesarFoto(original, recorte: 'ninguno' | 'centro' | Encuadre)`.

1. Valida el formato, como hoy.
2. Orienta: `sharp(original).rotate().toBuffer({ resolveWithObject: true })` da el ancho y el alto reales.
3. Con `Encuadre`, calcula la zona en píxeles. Si se sale de la foto (con tolerancia de 1 px por redondeo), lanza `FOTO_ENCUADRE_NO_VALIDO`. Si no, hace `extract` de la zona y `resize` a 512 × 512 sin ampliar.
4. Con `'centro'`, hace `resize` 512 × 512, `fit: 'cover'`, `position: 'centre'`, sin ampliar.
5. Con `'ninguno'` (ticket), hace lo de hoy: `fit: 'inside'`.

Las fotos de persona y de cápsula usan `'centro'` o `Encuadre`; el ticket de compra, `'ninguno'`.

**Componente `lib/ui/EncuadreFoto.svelte`**:

- Envuelve `PhotoField` y conserva el `<input type="file" name="foto">` real.
- Al elegir una foto, la muestra en un marco cuadrado con `object-fit: none`, transformada con `translate` y `scale`.
- `guia: 'redonda' | 'ninguna'`.
- **Puntero**: arrastrar mueve la foto y la rueda o el pellizco (dos punteros) la amplía.
- **Teclado**: el marco es enfocable; las flechas mueven 2 % (10 % con Mayús). Botones «Ampliar» y «Reducir» con nombre accesible.
- Una región `role="status"` anuncia el zoom (por ejemplo, «Zoom 150 %»).
- **Límites**: la foto siempre cubre el marco; el zoom va de «cubrir» a 4×, o hasta el tamaño original si la foto es pequeña.
- Escribe los tres campos ocultos `encuadreX`, `encuadreY` y `encuadreLado`. Sin JavaScript no hay campos ocultos y el servidor recorta el centro.
- La foto se muestra con su orientación EXIF aplicada, como hace el navegador por defecto, y coincide con `rotate()` del servidor (research R3).

**Uso**: alta y cambio de foto de persona en `admin/usuarios` y `admin/usuarios/[usuarioId]`, `FotoPersona.svelte` (Perfil) y `FormularioCapsula.svelte`.

### D5. Copias de seguridad (US5, RF-275, DEC-138)

`admin/copias/+page.svelte` envuelve cada sección en una superficie con su fondo, su borde y un icono de Lucide en el título:

| Sección | Superficie | Icono |
| --- | --- | --- |
| Estado de las copias | `bg-accent-soft border-accent/40` | `database-backup` |
| Copias en el bucket | `bg-wall-raised border-hairline` | `cloud` |
| Restaurar una copia | `bg-warning-soft border-warning/50` | `triangle-alert` |
| Anotar una prueba | `bg-wall-base border-hairline` | `clipboard-check` |

Si la tercera fila resulta ser parte de la lista, la zona de advertencia envuelve el texto de efecto y los enlaces «Restaurar». El contraste del texto sobre `accent-soft` y `warning-soft` se comprueba con axe en los dos temas. Si no llega, se usa `ink` en lugar de `ink-muted`.

## Project Structure

### Documentation (this feature)

```text
specs/015-saludos-colores-fotos/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/formularios.md
└── tasks.md            (/speckit-tasks)
```

### Source Code (repository root)

```text
drizzle/0009_f15-mensaje-dia.sql (+ meta)
src/lib/server/usuarios/{esquema,mensaje-dia,index}.ts, usuarios/dominio/mensaje-dia.ts (+ pruebas, concurrencia)
src/lib/server/catalogo/{fotos,datos,index}.ts (+ pruebas)
src/lib/server/plataforma/imagenes.ts (+ prueba)
src/lib/server/usuarios/fotos.ts, src/lib/server/auth/invitar.ts (pasan el recorte)
src/lib/shared/mascota/mensajes-dia.ts (+ prueba), src/lib/shared/capsulas/color-propio.ts (+ propiedades)
src/lib/shared/contratos/{capsulas,encuadre,fotos-usuario,…}.ts (+ pruebas), src/lib/shared/textos.ts
src/lib/ui/{EncuadreFoto,CapsuleColorField,CapsuleImage,CapsuleIllustration,CapsuleTile,SplitBar,UndoToast}.svelte, src/lib/ui/utils.ts, src/app.css
src/routes/(app)/{+page.server.ts,+page.svelte,FotoPersona.svelte}, admin/{capsulas,usuarios,copias}/
e2e/: mensaje-dia-f15, colores-f15, fotos-f15, copias-f15; sin-js/fotos-f15; a11y (pantallas tocadas)
ARCHITECTURE.md, docs/pruebas.md
```

## Verificación

- **Unitarias**:
  - `elegirMensajeDia` con propiedades: no repite en una vuelta y cubre el catálogo.
  - `coloresCapsula` con propiedades: para cualquier `#rrggbb`, el texto da ≥ 4,5:1 y el límite ≥ 3:1 en los dos temas, y el resultado es determinista (EV-115, CA-270).
  - `esquemaEncuadre` y el esquema del color (CA-271).
  - El catálogo: 40 o más, ids únicos y sin marcadores distintos de `{nombre}` (CA-267).
- **Integración** (SQLite real):
  - `asignarMensajeDia`: 40 días sin repetir, un día con aviso sin gasto y cambio de vuelta (EV-114, CA-266, CA-268).
  - Concurrencia con `worker_threads`: dos asignaciones simultáneas devuelven el mismo mensaje.
  - `quitarFotoTipo` (CA-272): borra el archivo, deja la auditoría y rechaza a un miembro.
  - `procesarFoto` con encuadre, con centro, con una zona fuera de la foto y con EXIF girado (CA-274).
  - El rosa solo para el tipo que ya lo tiene (CA-269).
- **Evento falso**: las *actions* de cápsula (color propio no válido, `quitarFoto`) y de foto de persona con encuadre.
- **Componentes**: `EncuadreFoto` (teclado, límites y campos ocultos) y `CapsuleColorField` (el selector marca «Otro color» y el rosa como actual).
- **E2E**:
  - CA-266: con el reloj del servidor de pruebas, si el entorno E2E lo permite; si no, solo la integración.
  - CA-269, CA-272, CA-273 (1280 y 390 px) y CA-275.
  - `sin-js`: quitar foto y foto sin encuadre (recorte central).
  - Axe en claro y oscuro de Cápsulas (alta y edición), Usuarios, Perfil y Copias.
- **Cierre**: `npm run verify` (hay migración y cambios de contratos). Sin benchmark completo salvo petición.

## Riesgos

- **Nueva aceptación de privacidad**: subir el anexo A a la versión 4 obliga a todos a aceptarla otra vez (RF-160). Es lo que dice la spec; se avisa a la persona usuaria antes de implementarlo.
- **Contraste en oscuro de colores extremos**: un color casi negro o casi blanco cambia de tono en oscuro. Es el efecto buscado («ajustar el tono») y la prueba de propiedades lo cubre.
- **Pellizco en iOS Safari**: el gesto de zoom de la página compite con el del marco. El marco usa `touch-action: none`, y los botones «Ampliar» y «Reducir» son la alternativa.
- **Fotos muy grandes en el navegador**: una foto de 40 Mpx puede ir lenta en un móvil antiguo. El navegador solo la muestra, sin decodificarla en un canvas.

## Complexity Tracking

Sin desviaciones de la constitución 1.9.0.
