# Plan propuesto: corto vertical «El misterio de la última cápsula»

**Rama:** `cortometraje/capsulito-vertical`  
**Fecha:** 2026-10-26  
**Estado:** Aprobado por la persona usuaria en la sesión del 2026-10-26.  
**Especificación:** [spec.md](spec.md), aprobada por la persona usuaria en esta sesión.

## Resultado previsto

Un corto autónomo 9:16 que pueda verse fuera de la aplicación: vídeo MP4 con voz, efectos y subtítulos; versión sin sonido igualmente comprensible; portada, transcripción, fuentes editables RML/SVG, `.riv` de las escenas y pistas de voz con sus tiempos de boca. No se añade una ruta ni un reproductor a beCafé en este alcance. La ubicación final se decidirá tras ver el corto.

La animática decide la duración final. El guion apunta a 65–75 s, con margen para pausas y remates; el sonido no se generará hasta aprobar el texto de locución que quede tras revisar la animática. Si ese texto cambiara el comportamiento explicado en la `spec.md`, se volvería a revisar la especificación antes de producirlo.

## Decisiones de producción

### 1. Composición y dirección

- Lienzo maestro: **1080 × 1920**, 9:16, 30 fps para la entrega de vídeo. Titulares, contador y subtítulos dentro de una zona central segura; comprobar recorte y lectura también en 360 × 640.
- Siete bloques del guion, pero los chistes visuales pueden respirar entre locuciones. No habrá pantalla de datos densos ni información personal. El móvil enseñará una tarjeta reconocible, un registro confirmado, el aviso de pocas unidades, el saldo personal y la aportación en momentos separados.
- Humor físico sobre los apuntes perdidos, la lupa y los granos rechazados por la hucha. La deuda personal y los errores reales no reciben bromas (RF-186; diseño Latte).
- Color y tipografía derivados de los tokens y recursos de Latte; comprobar contraste del texto sobre el fondo final en claro y oscuro. La paleta se trasladará a los vectores de la escena como valores de exportación, sin introducir colores propios en la interfaz de la app.

### 2. Recursos y estructura de fuentes

| Archivo/carpeta previstos | Contenido |
| --- | --- |
| `docs/diseno/corto-capsulito/guion.md` | Guion de rodaje definitivo, lista de planos, textos visibles, transcripción y puntos de revisión. |
| `docs/diseno/corto-capsulito/svg/` | Cafetera, armario/puerta/estantes, taza, cápsulas, cajas, lupa, megáfono, hucha y móvil en SVG por capas. |
| `docs/diseno/corto-capsulito/rive/` | Proyecto(s) RML con `rive.yaml`, `scene.rml` y generador local si hace falta transformar SVG a RML. |
| `docs/diseno/corto-capsulito/audio/` | Catálogo de frases, subtítulos temporizados y hoja de efectos; las claves y tandas crudas quedan fuera de Git. |
| `docs/diseno/corto-capsulito/entrega/` | Portada, MP4 de revisión, `.riv` compilados, subtítulos y transcripción. Se comprobará el tamaño antes de versionar el vídeo. |

Capsulito sale de los SVG aprobados en `static/mascota/svg/`; su forma, cara y proporciones se conservan. Se aprovecha el caminar y las expresiones existentes. Los objetos nuevos se dibujan como vectores sencillos, con partes móviles separadas (puerta, cápsula, monedas, tapa de hucha). No se necesitan imágenes generadas de forma externa para esta estética; si la lámina revela que algún fondo necesita tratamiento ilustrado, se propondrá antes de producirlo.

### 3. Movimiento en Rive

- Un proyecto RML por plano o por grupo corto de planos, con nombres estables (`armario`, `misterio`, `registro`, `stock`, `hucha`, `cierre`); se ensamblan en la edición final. Así cada escena es revisable y una corrección no obliga a recompilar toda la película.
- Cada plano tendrá fotograma inicial, movimiento principal y fotograma final definidos en `guion.md`. Se animarán traslaciones, rotaciones y opacidades de objetos; la boca usará las formas `mouth` `0..7` ya previstas para Capsulito cuando haya primer plano hablado (RF-186; ADR-0006).
- Compilación y comprobación local: `~/.rive/bin/rive <proyecto> --verify`, `rive inspect <proyecto> --summary` y `rive <proyecto> --once`. Capturas de momentos clave con `--screenshot` y `--advance` para la revisión. No se usa `rive push`, `--publish`, ni cuenta de Rive.
- La animática inicial se hace con SVG y tiempos aproximados. Antes de producir todos los planos se prueba un plano de 3–5 s de extremo a extremo: RML → `.riv` → reproducción en Chromium → vídeo. Ese ensayo comprueba que el exportador conserve el formato, los fotogramas y la sincronía. El vídeo se capturará desde el canvas de Rive en Chromium y `ffmpeg` ensamblará imagen, voz, efectos y subtítulos; si la captura en tiempo real pierde fotogramas, se pasará a capturas por fotograma antes de producir el resto.

### 4. Voz, efectos y subtítulos

- Una locución por bloque o plano, con IDs exclusivos del corto para no pisar `intro_*` ni el catálogo actual. Texto visible limpio y `textoVoz` con etiquetas expresivas del modelo `eleven_v3`. Las frases y la animática se revisan juntas antes de consumir la API.
- Generación local con la voz ya configurada y el método por tandas del [ADR-0006](../../docs/adr/0006-rive-y-sincronizacion-voz-capsulito.md): relleno al inicio/final, corte por silencios con `ffmpeg`, revisión auditiva de cada corte y pista de boca derivada de las marcas de tiempo. Los MP3 y JSON definitivos se guardan con el corto, separados de `static/mascota/voces/` mientras no exista integración en la app.
- El trabajo paralelo está modificando el generador de voces; esta rama parte del último commit de `main` y contiene aún la versión anterior, que genera locuciones individuales. Antes de generar audio se integrará la versión estable del flujo por tandas o se adaptará el corto a su API pública, sin copiar archivos de trabajo sin confirmar ni ejecutar el generador antiguo para estas frases.
- Música y efectos cortos con licencia apta para redistribuirse en el repositorio público, o efectos creados para el proyecto. Mezcla con la voz siempre inteligible; subtítulos temporizados (`.vtt` y quemados en MP4 de revisión). No se grabarán nombres, importes, tokens ni datos reales.

### 5. Entrega y revisión

1. Lámina de recursos y animática muda con subtítulos temporales: revisar coherencia visual, tono del humor y comprensión del flujo económico.
2. Plano piloto compilado y vídeo de prueba: revisar Rive, exportación y lectura en móvil.
3. Locución definitiva por tandas y corte auditado; después, animación final y sincronización labial.
4. MP4 vertical con subtítulos, portada, VTT y transcripción; revisión final sin sonido, con sonido y con movimiento reducido representado por fotogramas estáticos.

La revisión creativa puede cambiar pausas y montaje dentro del guion aprobado. Los cambios de mensaje, destino de reproducción o comportamiento de la aplicación se tramitan con una especificación actualizada antes de implementarlos.

### 6. Cambio de técnica (2026-10-26, aprobado por la persona usuaria)

La primera entrega (61 s, Rive) no cumple el guion: Capsulito no anda ni mueve la boca en el plano 1, el armario no se abre, los objetos desaparecen entre planos y la cápsula parece un vaso. La causa es de método: cada plano era una imagen fija desplazada, y nadie revisó el resultado viéndolo.

- **Técnica.** Cada plano es una página HTML con SVG en `docs/diseno/corto-capsulito/html/`. Capsulito se monta por piezas a partir de `static/mascota/svg/capsulito-saludando.svg`: cuerpo, ojos con párpados, cejas, boca paramétrica de 8 formas (0..7, ADR-0006), brazos y piernas con cinemática inversa, manos y zapatillas de los SVG aprobados. La escena expone `render(t)`, una función pura del tiempo. Se renuncia a Rive en el corto. No se añaden dependencias: Playwright captura cada fotograma y `ffmpeg` monta el vídeo.
- **Continuidad.** Un único decorado (cocina, encimera, cafetera y armario bajo con estantes) se mantiene entre planos. La cápsula se dibuja con la forma de Capsulito (cúpula, aro y cuerpo cónico), no como un vaso.
- **Boca.** Capsulito mueve la boca en todos los planos en los que habla, con las pistas JSON de `audio/locuciones/`.
- **Revisión.** Plano a plano: capturas de fotogramas clave revisadas por el agente y clip corto revisado por la persona usuaria. No se empieza el plano siguiente sin su aprobación. El plano 1 es el piloto.
- **Pronunciación.** El `textoVoz` escribe «Bicafé» donde el texto visible dice «beCafé», porque la primera sílaba se dice en inglés. Regenerar `corto_05` y `corto_07` exige llamar a la API de voz y se pide antes de hacerlo.

## Arquitectura y verificación

- No se modifica `src/`, `static/` de la aplicación, el esquema de datos, las rutas, `historias.md` ni las configuraciones protegidas. Todo el trabajo nuevo vive en `docs/diseno/corto-capsulito/` y `specs/013-corto-capsulito/`. Por ello no aparecen nuevas aristas de módulos en `ARCHITECTURE.md` ni nuevas dependencias de ejecución.
- La historia representa RF-011 (un toque por café), NEC-001/002 (existencias y aviso), RF-040 (compra), RF-030 y RN-008/009 (aportación y hucha), sin fingir que la app reconstruye consumos omitidos. El contador solo cambia tras una acción mostrada.
- Verificar cada RML con Rive CLI e inspeccionar `problems: []`; comparar capturas de apertura, gag, registro y cierre con la lámina aprobada. Validar resolución, relación 9:16, duración y audio del MP4 con `ffprobe`; comprobar sincronía de subtítulos y boca en los planos hablados y leer la transcripción sin sonido.
- Como no se altera código de la app, no se ejecuta la suite E2E de beCafé por este lote. Si se añade integración más adelante, se aplicarán `docs/pruebas.md` y AGENTS.md §7 para las pantallas y contratos afectados. No se inventan CA ni EV nuevos para este corto hasta que su alcance de producto se apruebe.
- Antes de entregar: `git status` para excluir `.env`, tandas crudas en `.local/`, capturas temporales y otros archivos ajenos. No se hará commit, push ni PR sin petición expresa.

## Riesgos y decisiones pendientes

| Riesgo | Medida |
| --- | --- |
| El trabajo paralelo cambia el generador de voces o los SVG de Capsulito | Mantener fuentes del corto aisladas; integrar solo cuando esos cambios estén estables y revisar las diferencias antes de generar audio. |
| Exportación larga desde Rive pierde fotogramas o sincronía | Ensayo de un plano corto antes de producir todo; captura por fotograma si es necesario. |
| El corto es demasiado largo en móvil | Animática con revisión de ritmo; cortar repeticiones antes de grabar, sin fijar 72 s como obligación. |
| El vídeo resulta pesado para el repositorio o la web | Medir tamaño y calidad; decidir distribución al revisar la entrega. No añadirlo a la carga inicial de la PWA. |
| Confusión entre dinero de la hucha y saldo personal | Fichas separadas y secuencia explícita: café → saldo personal; aportación → hucha. |

### 7. Integración en la aplicación (aprobada el 2026-10-26)

Cumple RF-249 a RF-252 de la sección «Integración en la aplicación» de [spec.md](spec.md). Cambia la afirmación del apartado «Arquitectura y verificación» («no se modifica `src/`»).

- **Vídeo web.** `ffmpeg` genera `static/corto/el-misterio-de-la-ultima-capsula.mp4` (720 × 1280, H.264 + AAC, objetivo de 4 a 6 MB), `portada.jpg` y `subtitulos.vtt` a partir de `docs/diseno/corto-capsulito/entrega/`. El script `docs/diseno/corto-capsulito/html/exportar-web.mjs` lo repite sin intervención. El MP4 original de 1080 × 1920 se queda en `docs/diseno/`.
- **Precarga de la PWA.** `src/service-worker/index.ts` excluye `corto/` de `ESTATICOS`, como ya hace con las locuciones: el vídeo no entra en la carga inicial ni se descarga hasta pulsar «Ver el corto». Sin conexión, la portada no se ofrece (RF-249, escenario 5).
- **Componente.** `src/lib/ui/Corto.svelte`, con la prop `modo` (`antesDeEntrar` | `dialogo`) y los eventos `onTerminar` y `onSaltar` como funciones recibidas (constitución III). Recibe las rutas del vídeo, la portada y los subtítulos por props. No llama al servidor ni guarda nada.
  - Portada: la imagen, el título, «Ver el corto» (`Button` primario) y «Saltar» (enlace de texto, `text-ink-muted` sobre fondo estable, con contraste ≥ 4,5:1 y objetivo ≥ 24 × 24 px). Debajo, «Leer la transcripción» como `details`, con el texto de `transcripcion.md` en `textos.ts`.
  - Reproductor: `<video controls playsinline preload="none">` con `<track kind="subtitles" srclang="es" default>`. Al pulsar «Ver el corto» llama a `play()` dentro del gesto, así que el navegador permite el sonido. Fin del vídeo → `onTerminar`.
  - Con `prefers-reduced-motion` no cambia nada del reproductor (ya exige pulsar), pero la transcripción se muestra abierta.
- **Orden con la bienvenida.** En `login/+page.svelte` y `(visita)/visita/[token]/+page.svelte`, `Corto` (modo `antesDeEntrar`) se muestra si `!mascota.bienvenidaVista` y hay conexión. `onTerminar` y `onSaltar` lo cierran con un `$state` local (`corto-visto` solo en memoria de la página) y entonces aparece `Bienvenida` como hoy. En `acceso/[token=token]/+page.svelte`, al cerrarse aparece el formulario. No se guarda nada nuevo (constitución V).
- **Volver a verlo.** `EstadoMascota` gana `cortoManual = $state(false)` y `repetirCorto()`, como `repetirBienvenida()`. Ajustes (`ajustes/+page.svelte`) y Ayuda (`ayuda/+page.svelte`) añaden «Ver el corto otra vez» junto al botón de la bienvenida. El layout `(app)` abre `Corto` en modo `dialogo` (con `Dialog`) cuando `cortoManual` es verdadero.
- **Textos.** Todo el texto nuevo, en `src/lib/shared/textos.ts`.
- **Sin cambio.** Esquema de datos, contratos, módulos de servidor, dependencias, `Bienvenida.svelte` y la constitución.

**Architecture Check (§15 de `ARCHITECTURE.md`).** Componente en `lib/ui` que recibe datos por props; sin acceso a servidor, sin `$effect` que copie estado, sin `localStorage` nuevo, sin dependencias. El único archivo de infraestructura que cambia es el service worker, solo para excluir una ruta.

**Pruebas (`docs/pruebas.md`).**

| CA | Nivel |
| --- | --- |
| CA-249 (portada antes de entrar, solo sin marca) | Componente (`Corto`, modos y eventos) + E2E en `/login`, enlace de visitante y `acceso/[token]` con un contexto limpio, y sin ella no sale |
| CA-250 (volver a verlo) | E2E: Ajustes y Ayuda abren el diálogo |
| CA-251 (sonido, subtítulos, transcripción, saltar) | Componente (`<track default>`, `details`, `play()` solo al pulsar) + E2E sin JavaScript: la portada y la transcripción están en el HTML |
| CA-252 («Saltar» visible, contraste y tamaño) | E2E: tamaño del objetivo ≥ 24 × 24 px y axe en claro y oscuro de cada pantalla con la portada |
| Sin conexión | E2E con `context.setOffline(true)`: no aparece la portada |
| Vídeo web | Prueba de `scripts` sobre `exportar-web.mjs` (tamaño ≤ 6 MB, 720 × 1280, subtítulos presentes) |

Pantalla nueva con la portada: axe en claro y oscuro. Rutas tocadas: `acceso`. Revisión manual con TalkBack del botón «Ver el corto», los subtítulos y «Saltar»: queda como no verificable hasta que la persona usuaria la haga.

**Aprobación:** la persona usuaria aprobó este `plan.md` concreto en la sesión del 2026-10-26; sus tareas dentro de este alcance pueden ejecutarse conforme a AGENTS.md §2.

**Cómo quedó (26-10-2026).**

- `Corto.svelte` no pone el `src` del `<video>` hasta que la persona pulsa «Ver el corto». Con `preload="none"` WebKit descargaba igualmente el MP4 al cargar la pantalla (lo detectó el E2E de WebKit). El `src` se asigna dentro del clic y `play()` se llama sin esperar antes, para conservar el gesto que permite el sonido.
- La portada web es un JPEG (`static/corto/portada.jpg`, 100 KB): el `ffmpeg` del proyecto no trae el codificador WebP y `sharp` no se puede importar fuera de su archivo (`ARCHITECTURE.md` §11).
- El vídeo web pesa 3,1 MB (720 × 1280, H.264 + AAC).
- **Sin JavaScript no se muestra la portada**, igual que la bienvenida de RF-195: la marca de «bienvenida vista» vive en el navegador y el servidor no puede saber si hay que mostrarla. Las tres pantallas siguen funcionando. Esto no cumple la frase de CA-251 de `historias.md` («sin JavaScript la portada y la transcripción están en la página»); queda a la espera de la decisión de la persona usuaria.
- Chromium de Playwright no reproduce H.264: los E2E comprueban que la petición del MP4 sale solo al pulsar, no la reproducción.

**Aprobación de §7:** la persona usuaria aprobó la integración (§7) en la sesión del 2026-10-26, con la spec aprobada y el CAMBIO-025 registrado. Sus tareas (T20 a T28) pueden ejecutarse conforme a AGENTS.md §2. El benchmark completo (T29) no se ejecuta.
