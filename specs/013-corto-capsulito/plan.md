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

**Aprobación:** la persona usuaria aprobó este `plan.md` concreto en la sesión del 2026-10-26; sus tareas dentro de este alcance pueden ejecutarse conforme a AGENTS.md §2.
