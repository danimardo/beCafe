# Research: F12 — Pulido de Capsulito, celebración del café y gestión de personas y stock

Fecha: 2026-10-26. Fuente: `spec.md` (aprobada), `historias.md` v0.24.0 (CAMBIO-024), constitución 1.8.0 y el código de `main` (`6ebc28d` con los cambios sin commit de F11).

## R1. «Copiar enlace» sin conexión segura (RF-238)

- **Decision**: `CopyField` intenta primero `navigator.clipboard.writeText` solo si `window.isSecureContext` y la API existen. Si no existen o fallan, copia con una alternativa: selecciona el texto del campo de solo lectura y llama a `document.execCommand('copy')`. Si esa llamada devuelve `false` o lanza un error, el texto queda seleccionado y se muestra el mensaje actual. Antes de corregir, una prueba E2E sobre `http://<ip>` (contexto no seguro) reproduce el fallo.
- **Rationale**: la API del portapapeles solo existe en contextos seguros (https o `localhost`). Al abrir la aplicación por la IP de la red local con http, `navigator.clipboard` es `undefined` y el `try` cae en el mensaje de error. En un contexto no seguro no hay otra forma de copiar desde código. `execCommand('copy')` está desaconsejado, pero los navegadores objetivo (Safari iOS ≥ 16.4 y Chrome Android) lo siguen admitiendo. La constitución prohíbe las APIs obsoletas y las funciones experimentales del framework (SvelteKit), no las del navegador. Aquí la API desaconsejada solo se usa como respaldo, en un único archivo, y el camino principal sigue siendo `navigator.clipboard`.
- **Alternatives considered**:
  - Exigir https también en la red local. Se rechaza porque el fallo lo ve el administrador en el uso real y no depende del código.
  - Usar solo el mensaje de copiar a mano. Se rechaza porque es el fallo que se corrige.

## R2. El enlace generado aparece junto a su botón (RF-239)

- **Decision**: las acciones `alta` (listado), `generarEnlace` y `reactivar` (ficha) añaden a su respuesta `origen: 'alta' | 'generarEnlace' | 'reactivar'`. Cada página pinta `CopyField` dentro del bloque del formulario cuyo `origen` coincide, justo debajo de su botón, y lo quita del principio de la ficha. `CopyField` recibe `anunciar`:
  - Con JavaScript, un `$effect` desplaza la vista hasta el campo (`scrollIntoView({ block: 'center' })`, de forma instantánea con movimiento reducido) y escribe «Enlace listo para copiar» en su región `role="status"`.
  - Sin JavaScript, el campo lleva `autofocus`: el navegador lo enfoca y lo muestra al cargar la respuesta.
- **Rationale**: SvelteKit no indica qué acción produjo `form`, así que el dato tiene que venir en la respuesta. `autofocus` en un campo de solo lectura es la única forma de llevar la vista hasta él sin JavaScript. Desplazar la vista es sincronizar con el DOM, que es un uso permitido de `$effect` (XVII).
- **Alternatives considered**:
  - Una ancla `#enlace` en la URL. Se rechaza porque una respuesta POST sin JavaScript no puede fijar el fragmento de la URL.
  - Un diálogo con el enlace. Se rechaza porque la persona usuaria pidió verlo debajo del botón.

## R3. Qué Capsulito habla en el tour (RF-240)

- **Decision**: `Capsulito` recibe una propiedad nueva, `callado`. Con ella fija la boca en 0 y no reproduce los gestos de reposo. Inicio pasa `callado={tourActivo}` y `animar={!tourActivo}` a su Capsulito grande. La tarjeta del tour usa `modo="rive"` en su Capsulito `sm`, para que mueva la boca con `mascota.bocaActual`.
- **Rationale**: la boca es un estado global del contexto de la mascota (`bocaActual`). Todo Capsulito con Rive la sigue, y en modo `auto` el tamaño `sm` pinta SVG estático, sin boca. Por eso hoy solo se mueve el grande. El cambio no toca el contexto ni el audio.
- **Alternatives considered**: una boca por instancia, con un identificador de «quién habla» en el contexto. Se rechaza porque añade estado global para un solo caso (principio II).

## R4. Celebración y sonido (RF-243, RF-244)

- **Decision**:
  - **Confeti.** Componente nuevo `src/lib/ui/movimiento/Confeti.svelte`, solo con CSS:
    - Son 14 piezas con clases de tokens (`bg-accent`, `bg-positive`, `bg-warning` y `bg-caramel`) y duran 900 ms.
    - Lleva `pointer-events-none` y `aria-hidden="true"`, en una capa absoluta sobre la tarjeta.
    - Se vuelve a crear con `{#key disparo}` en cada confirmación.
    - No se pinta con `prefers-reduced-motion` ni con `mascota.animar === false`.
  - **Estado.** `CapsuleTile`, `CapsuleRow` y `WaterRefillCard` reciben `celebrar: number`, un contador que la página sube al confirmar el servidor.
  - **Sonido.**
    - El contexto de la mascota gana `celebrar(fraseId | null)`: con la voz activa reproduce `/mascota/sonidos/celebracion.mp3` y, al terminar, llama a `hablar(fraseId)`.
    - `detenerVoz()` también corta el sonido, así que una confirmación nueva corta la anterior.
    - La reproducción va en `src/lib/client/rive.ts`, con `reproducirSonido(ruta, onFin)` junto a `reproducirVozSincronizada`, porque ya es el único archivo que crea `Audio`.
    - Si el navegador bloquea la reproducción, la promesa rechazada se ignora y la frase se dice igual.
  - **Cuándo se llama.** La página llama a `celebrar` solo en la rama «el servidor confirmó» (`result.type === 'success'` con consumo nuevo, o relleno registrado). Nunca la llama en `encolar` ni en `sincronizar`.
- **Rationale**: es CSS sin dependencias, como pidió la persona usuaria. No bloquea porque la capa no recibe eventos. Es decorativa porque el mensaje con «Deshacer» ya se anuncia. Usa la misma ruta de audio que las voces y respeta el interruptor de voz (DEC-125). Separar las dos ramas de la página garantiza que no hay celebración para un café pendiente (RF-244, constitución X).
- **Alternatives considered**:
  - Una librería de confeti. Se rechaza porque la constitución prohíbe dependencias sin necesidad.
  - Web Audio para el sonido. Se rechaza porque un `Audio` basta.
  - Un ajuste propio para el sonido. Queda fuera de alcance (DEC-125).

## R5. El sonido de celebración (RF-243)

- **Decision**: un script nuevo, `scripts/generar-sonido.mjs`, llama una vez a `POST /v1/sound-generation` de ElevenLabs. Pide un sonido de 1,2 s con `prompt_influence` 0.6, «short cheerful cartoon celebration chime with a tiny party popper, bright, friendly, no voice». Usa `cargarDotEnv` de `generar-voces.mjs` y nunca muestra la clave. Después pasa el audio por `ffmpeg` (mono, 48 kbps, fundido de salida de 150 ms y silencio inicial recortado) y lo guarda en `static/mascota/sonidos/celebracion.mp3`, con 30 KB como máximo. El script admite `--intentos N`, que genera N candidatos en `.local/sonidos/` para que la persona usuaria elija uno. La generación es una operación aparte (ADR-0006, nota nueva).
- **Rationale**: lo decidió la persona usuaria. Un único archivo pequeño con fundido no tapa la locución que sigue.
- **Alternatives considered**: un sonido de una biblioteca libre. Se rechaza porque la licencia es incierta y la persona usuaria pidió ElevenLabs.

## R6. Orden de las cápsulas (RN-090, RF-245)

- **Decision**:
  - Una función pura, `ordenarTiposInicio(tipos, propios, departamento)`, en `src/lib/server/economia/dominio/orden-inicio.ts`. Ordena por consumos propios de mayor a menor si la persona tiene alguno en la ventana; si no tiene ninguno, por los del departamento; a igualdad, por `nombreNormalizado`.
  - Un caso de uso nuevo, `leerTiposInicio(db, actor, ahora)`, en `economia/consumos.ts`. Llama a `leerTiposRegistrables`, cuenta los consumos vigentes de la ventana con `contarConsumos` (los propios y los de invitado que registró la persona; los del departamento, todos) y ordena.
  - La ventana va de las 00:00 en Madrid del día `hoy − 29` hasta `ahora`, es decir, 30 días naturales con hoy incluido. Se calcula con una función nueva, `inicioDeVentanaDias(ahora, dias)`, en `lib/shared/fechas/meses.ts`.
  - Inicio usa `leerTiposInicio`. La comprobación de `consumir` sigue usando `leerTiposRegistrables`.
- **Rationale**: es una regla de negocio con empates, así que va en `dominio/` con prueba de propiedades. La cuenta reutiliza la consulta existente y no hace falta ningún índice nuevo con unas 10 personas.
- **Alternatives considered**:
  - Ordenar en la página. Se rechaza porque la constitución III prohíbe reglas en las rutas.
  - Guardar el orden. Se rechaza porque es un dato derivado sin necesidad.

## R7. Aviso de recuento (RF-246)

- **Decision**:
  - **Tipo nuevo.** El aviso `recuento` va al catálogo de `notificaciones`, para todas las personas y desactivable. Desactivarlo solo quita la entrega push; el aviso sigue en el panel, como el resto de los tipos (`registrarAviso`).
  - **Al registrar.** `confirmarRecuento` llama a `registrarAviso` dentro de su transacción, si alguna línea tiene diferencia distinta de 0. Los datos son las líneas con diferencia, el importe total repartido y el número de personas. También van el cargo mínimo y el máximo por persona, calculados de las partes que devuelve `repartirEnPersonas`, que ahora devuelve sus partes.
  - **Al anular.** `anularLineaRecuento` avisa con `accion: 'anulado'` y la línea anulada.
  - **En Inicio.** Su `load` lee el último aviso `recuento` no visto de la persona, con la función nueva `leerAvisoRecuentoPendiente`. Lo muestra en un `Banner` con «Entendido» (`?/verAviso`, un formulario que funciona sin JavaScript). Esa acción marca como visto solo ese aviso, con la función nueva `marcarVisto(ambiente, persona, avisoId)`. Abrir el panel de avisos también lo marca, como hoy.
- **Rationale**: `economia → notificaciones` ya existe (compras, aportaciones), así que no hay arista nueva. Un `load` no puede escribir (F11, R2): por eso «una vez en Inicio» significa que el aviso se ve hasta que la persona lo lee, en Inicio o en el panel. Con el repartidor actual, el cargo por persona puede variar en 1 céntimo, y el texto dice «0,13 € cada una» o «entre 0,13 y 0,14 € cada una». Los datos solo llevan nombres de tipos y cifras, no datos de personas (XVI).
- **Alternatives considered**:
  - Marcar el aviso como visto en el `load`. Se rechaza porque la precarga lo gastaría.
  - Un tipo distinto para la anulación. Se rechaza porque un campo `accion` basta.
  - Avisar por cada línea. Se rechaza porque la spec pide un único aviso por recuento.
- **Compatibilidad**: un service worker antiguo recibe un `tipo` que no conoce en la notificación push. El esquema de la carga lo rechaza y el SW muestra el título genérico de hoy. No hay datos en cola afectados (XIV).

## R8. Capsulito en el acceso con enlace (RF-241)

- **Decision**: `acceso/[token=token]/+page.svelte` reutiliza `CapsulitoEntrada` con el patrón del login: `taparOjos` mientras el foco está en un campo de contraseña, `estado='fallo'` cuando vuelve `form` con errores y `estado='exito'` en la rama de éxito de `use:enhance`, antes de aplicar la redirección (800 ms como máximo, lo mismo que en el login). `mirarX` se queda en 50 porque no hay campo de correo.
- **Rationale**: es el mismo componente, el mismo `.riv` y el mismo respaldo estático. No hay trabajo de Rive nuevo.

## R9. Fotos en el listado de personas (RF-242)

- **Decision**: el `load` de `/admin/usuarios` añade `fotoUrl` a cada persona, con el mismo ayudante que el layout. `ListRow` recibe un `leading` con `Avatar` (`size="sm"`) y la propiedad nueva `decorativo`, que pone `aria-hidden="true"`, porque el título de la fila ya dice el nombre.
- **Rationale**: es lo mismo que en Saldos (RF-209 y RF-222), sin componentes nuevos.

## R10. Escena «el dinero» (RF-247)

- **Decision**: la escena nueva usa el identificador `intro_09`, porque los identificadores de locución no se renumeran (los audios `intro_05` a `intro_08` ya existen). Se coloca en la posición 5 de `ESCENAS_BIENVENIDA` (`lib/shared/mascota/bienvenida.ts`) y en `MOMENTOS`. Lleva la pose `senalando`, el texto aprobado y la locución en `LOCUCIONES` de `generar-voces.mjs`, con etiquetas `[cheerful]`. `/ayuda` lee la misma lista, así que la escena sale también sin JavaScript. El audio lo genera la persona usuaria con `./voces.sh` (opción «Las que faltan»). Hasta entonces, `hablar()` ignora el audio que falta.
- **Rationale**: renumerar `intro_05` a `intro_08` obligaría a regenerar cuatro audios sin motivo.

## R11. Gestos de reposo (RF-248)

- **Decision**:
  - **Catálogo y tiempos.**
    - Un catálogo tipado nuevo, `lib/shared/mascota/reposo.ts`: `GESTOS_REPOSO = [{ segundo: 6, gesto: 'mirarLados' }, { segundo: 12, gesto: 'pie' }, { segundo: 16, gesto: 'reloj' }, { segundo: 21, gesto: 'bostezo' }]`, con la duración de cada gesto.
    - Una función pura, `gestoEn(segundosEnReposo)`, que devuelve el gesto que toca, si hay alguno.
    - El ciclo empieza otra vez cuando termina el bostezo.
  - **Animación.**
    - Un `.riv` nuevo, `static/mascota/riv/capsulito-reposo.riv`, con su fuente RML generada en `docs/diseno/f12/rive/reposo/`. Lo crea un generador derivado de `generar-entrada.mjs`, a partir de `static/mascota/svg/capsulito-saludando.svg`.
    - Su máquina de estados `Reposo` tiene la capa `Parpadeo`, un bucle de 3 s, y la capa `Gesto`, con los disparadores `mirarLados`, `pie`, `reloj`, `bostezo` y `cancelar`. Tiene también el booleano `reducedMotion`.
    - El reloj imaginario es un brazo levantado con la muñeca girada hacia la cara.
  - **Uso en `Capsulito`.**
    - `Capsulito` entra en reposo cuando no hay audio en curso (`mascota.audioEnCurso === null`), ha pasado la duración de la pose (`duration_seconds` del manifiesto, copiada a `POSES`) y no tiene `callado`. Con un tamaño de 112 px o más, cambia entonces el lienzo de la pose por el de reposo, con un fundido de 200 ms.
    - Un temporizador de 1 s en un `$effect`, que solo sincroniza con Rive, lanza el disparador de `gestoEn(t)`.
    - Hablar, cambiar de pose o hacer un gesto Rive de la pose vuelve al lienzo de la pose y pone `t = 0`.
    - El temporizador se para con `document.hidden` y con movimiento reducido. Con movimiento reducido no se monta el lienzo de reposo.
    - Con un tamaño `md`, el modo `auto` pasa a usar Rive solo para el reposo.
  - **Revisión.** Igual que en F11 (lote 5), hay una **parada para que la persona usuaria revise las capturas** de cada gesto antes de integrarlo.
- **Rationale**:
  - Las fuentes RML de las 9 poses no están en el repositorio (`/Apps/tmp/becafe-F10/…`, fuera de Git). Añadir 4 gestos a cada pose obligaría a montar 36 animaciones. Un único `.riv` de reposo, sobre la figura neutra, son 4 animaciones con una sola fuente versionada.
  - El orden fijo según el tiempo cumple el principio XVIII sin enmienda (DEC-128).
  - El temporizador en el cliente es una API externa, un uso permitido de `$effect`.
- **Alternatives considered**:
  - Gestos dentro de cada `.riv` de pose. Se rechaza por el coste y porque faltan las fuentes en Git.
  - Gestos con CSS sobre las capas SVG. Se rechaza porque mirar un reloj y bostezar necesitan mover el brazo y la boca de forma articulada, y la persona usuaria eligió Rive.
- **Riesgo**: el RML del CLI 1.7.0 puede no permitir el brazo articulado del reloj. Si no lo permite, se para y se propone a la persona usuaria un gesto parecido, como mirarse la muñeca solo con la cabeza y los ojos.
