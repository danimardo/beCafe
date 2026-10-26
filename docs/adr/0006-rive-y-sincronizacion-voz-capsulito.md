# 0006 — Animaciones Rive aisladas, reserva SVG por capas y sincronización labial con voz pregenerada para Capsulito

- **Estado:** Aceptado
- **Fecha:** 24-10-2026
- **Requisitos relacionados:** principios V, X, XI y XVIII; RF-186, RF-187, RF-188; DEC-105 a DEC-115; `historias.md` v0.18.0

## Contexto

- La funcionalidad F9 incorpora a **Capsulito**, la mascota de beCafé, para dar acompañamiento visual, historia introductoria animada y reacciones contextuales (estilo Duolingo) sin alterar las reglas económicas ni retrasar el registro de un consumo (RNF-002).
- El equipo de diseño ha entregado las ocho poses de Capsulito en dos formatos complementarios y sincronizados sobre el mismo lienzo (`1185 × 1185`):
  1. **Archivos `.riv` compilados con Rive CLI 1.7.0** (`static/mascota/riv/`), con una máquina de estados (`Capsulito`) dividida en dos capas independientes (`Movimiento` y `Boca`) gobernadas mediante `ViewModel` (`play`, `cancel`, `autoPlay`, `reducedMotion`, `mouth` `0..7` y `speechDemo`).
  2. **56 archivos SVG vectoriales limpios por capas** (`21 <g id="...">` y puntos de giro `data-pivot`) más sus exportaciones WebP (`static/mascota/`), que sirven de alternativa estática inmediata.
- Además, se quiere dotar a Capsulito de voz opcional en español generada mediante la API de ElevenLabs (`eleven_v3` con etiquetas expresivas y marcas de tiempo por carácter), moviendo las ocho formas de boca (`mouth` `0..7`) al compás del audio sin exponer claves en el repositorio ni realizar llamadas externas desde el contenedor de producción.
- La constitución exige registrar en un ADR y en su tabla de tecnologías cualquier dependencia nueva de ejecución y aislarla en un único archivo (`ARCHITECTURE.md` §11 y §13).

## Decisión

1. **Runtime web de Rive aislado en un único archivo (`src/lib/client/rive.ts`).** Se incorpora `@rive-app/canvas` (línea `2.x`) como única dependencia nueva para reproducir los `.riv` y vincular la instancia `Default` de su `ViewModel`. Ningún otro archivo del proyecto importa `@rive-app/canvas`; dependency-cruiser y ESLint lo comprueban automáticamente.
2. **Degradación progresiva con reserva SVG/WebP.** El componente `<Capsulito>` renderiza en SSR y sin JavaScript la ilustración estática SVG/WebP con `alt=""` y `aria-hidden="true"`. En el cliente, si la mascota está activa, el navegador soporta canvas y no se pide reducir movimiento, monta el lienzo Rive sobre la misma caja sin desplazamiento de diseño (*layout shift*). Si falla la carga del `.riv` o del runtime, conserva la imagen SVG estática sin bloquear ninguna operación.
3. **Voz pregenerada fuera de banda (`scripts/generar-voces.mjs`) y sincronización labial (`src/lib/client/lip-sync.ts`).** Un script de desarrollo lee `ELEVENLABS_API_KEY` y `ELEVENLABS_VOICE_ID` desde `.env` (fuera de Git), llama al endpoint `/v1/text-to-speech/{voice_id}/with-timestamps` con el texto expresivo (`textoVoz`) y genera en `static/mascota/voces/` los archivos `.mp3` y `.json` de visemas (`cues` con `start`, `end`, `mouth` `1..7`, `audioSha256` y `textSha256`). En producción, la aplicación sirve estos ficheros estáticos sin llamadas a terceros y sincroniza `mouth` con `audio.currentTime`.
4. **Preferencias en el dispositivo.** Las preferencias `becafe-mascota` (`visible` | `oculta`), `becafe-voz` (`activa` | `silenciada`) y `becafe-bienvenida` (`vista`) se guardan en `localStorage` del dispositivo y se validan con Zod en `src/lib/shared/contratos/apariencia.ts`, siguiendo el mismo patrón que el tema y la transparencia (DEC-095, DEC-099).

## Alternativas consideradas

- **Solo imágenes estáticas WebP/SVG sin Rive:** no aprovecha los archivos `.riv` ya entregados ni las 8 formas de boca (`mouth` `0..7`) de la máquina de estados.
- **Llamar a ElevenLabs en tiempo de ejecución desde el servidor de beCafé:** exigiría credenciales externas en producción, añadiría latencia y coste recurrente para frases fijas del catálogo, y crearía un punto de fallo externo innecesario.
- **Guardar las preferencias de mascota y bienvenida en SQLite por usuario:** mezcla ajustes puramente decorativos del dispositivo con el almacén transaccional de negocio, en contra del criterio adoptado para Tema y Reducir transparencia (DEC-095, DEC-099).

## Consecuencias

- Se enmienda la constitución a la versión **1.7.0** (principios V y XVIII y tabla de tecnologías obligatorias).
- Se actualiza `ARCHITECTURE.md` (§2, §11 y §12) y `.dependency-cruiser.cjs` / `eslint.config.js` para imponer que `@rive-app/canvas` solo pueda importarse desde `src/lib/client/rive.ts`.
- El servicio y todas las operaciones económicas funcionan igual si Rive o los ficheros de voz no están disponibles o si el usuario desactiva la mascota o el sonido.

## Generación en tandas (26-10-2026, F11)

### Problema

- ElevenLabs v3 devuelve a veces el audio de una locución recortado: pierde el principio, el final o los dos. En una locución suelta se oye una sílaba o una palabra de menos («quí eliges…», «dispositi…»).
- Las pruebas del 26-10-2026 con la misma petición dieron duraciones de 6,9 a 8,4 s, con y sin el endpoint `/with-timestamps`. El recorte es de la generación y no de cómo se guarda el archivo.
- Un silencio añadido con `ffmpeg` no devuelve lo que falta. Una etiqueta de pausa delante y detrás del texto lo reduce, pero no lo evita.

### Decisión

1. **Se piden las locuciones en tandas de 3 en una sola llamada** a `/v1/text-to-speech/{voz}/with-timestamps`. Una frase de relleno abre la tanda y otra la cierra: el recorte se come el relleno y no las frases.
2. **Cada frase va envuelta** en `[inhales] ... ` y ` ... [sighs]`, y las frases se separan con ` [short pause] `. En el audio final la respiración y el suspiro no se conservan.
3. **Cada frase se corta por un silencio real** del audio de la tanda (`ffmpeg`, `silencedetect` a −45 dB), anclado en las marcas de tiempo de las palabras habladas y no en las de las etiquetas, que no son fiables:
   - El principio va en el último silencio anterior a la primera palabra.
   - El final va en el silencio más largo antes de la frase siguiente.
   - Si una frase no tiene silencio a un lado, no se corta: se vuelve a pedir (3 intentos) y, si sigue fallando, no sustituye lo que había.
4. **Perfil de voz «natural»** (`eleven_v3`: `stability 0,5`, `similarity_boost 0,8`, `style 0,35`, `use_speaker_boost`), elegido por la persona usuaria tras comparar seis perfiles con las mismas tres frases. En v3, `stability` solo distingue 0 (creativo), 0,5 (natural) y 1 (robusto).
5. **La pista de labios** se calcula con las marcas de tiempo de las palabras de la tanda, medidas desde el principio del corte. Los cues que caen más allá del corte (las etiquetas de risa del final) se descartan o se recortan.
6. **El audio de cada tanda sin cortar y sus marcas de tiempo** se guardan en `.local/voces-tandas/` (fuera de Git) para recortarlo de nuevo sin volver a pagar.

### Consecuencias

- `ffmpeg` pasa a ser una herramienta de desarrollo necesaria para `voces.sh`, `voces.ps1` y `npm run voces:generar`. No es una dependencia de ejecución ni de `package.json`. Sin `ffmpeg`, el menú avisa y no llama a la API.
- Cada tanda añade el relleno y el envoltorio a los caracteres que ElevenLabs cobra (el menú muestra la cifra real antes de confirmar), y una frase que se vuelve a pedir cuenta otra vez.
- El formato de salida no cambia: `static/mascota/voces/<id>.mp3` y `<id>.json` con el mismo esquema (`esquemaPistaLipSync`).
- La integración continua necesita `ffmpeg` para ejecutar las pruebas del menú que generan audio. Sin él, esas pruebas no se seleccionan; las de la lógica de corte y las de «sin `ffmpeg`» se ejecutan siempre.

## Sonido de celebración (F12)

- El sonido de `static/mascota/sonidos/celebracion.mp3` (7,6 KB, mono, 48 kbps, 1,2 s) se genera una vez con la API de efectos de sonido de ElevenLabs mediante `scripts/generar-sonido.mjs`. La aplicación nunca llama a la API.
- Se pidieron 4 candidatos y se guardaron en `.local/sonidos/` (fuera de Git). El agente eligió el 01 de forma provisional por su nivel (−17,9 dB de media, comparable a la locución) porque la persona usuaria no estaba presente para escucharlos. Para cambiarlo: `node scripts/generar-sonido.mjs --elegir NN`.
- El sonido sigue el interruptor de voz de Ajustes (RF-243).

## Reposo de Capsulito (F12)

- Un único `.riv` nuevo, `static/mascota/riv/capsulito-reposo.riv` (13 KB), con los gestos de reposo sobre la figura neutra del SVG `saludando`. Las fuentes RML de las 9 poses no están en Git; con un solo archivo basta una fuente versionada, `docs/diseno/f12/rive/reposo/scene.rml`, generada por `generar-reposo.mjs` (derivado de `generar-entrada.mjs`).
- Máquina `Reposo`: capa `Parpadeo` (bucle de 3 s, quieta con `reducedMotion`) y capa `Gesto` con los disparadores `mirarLados`, `pie`, `reloj`, `bostezo` y `cancelar`. El reloj es imaginario: un brazo levantado con la muñeca girada y la mirada hacia ella.
- El instante de cada gesto no está en el `.riv`: lo fija `src/lib/shared/mascota/reposo.ts` según el tiempo quieta (6, 12, 16 y 21 s; ciclo de 23 s). Así el orden es fijo y no depende del azar (constitución XVIII).
- `Capsulito.svelte` cuenta los segundos desde que termina la animación de la pose (`duration_seconds`) con un temporizador de 1 s que se para con la pestaña oculta. Monta el lienzo de reposo a partir de 3 s, solo con 112 px o más, y lo quita al hablar, cambiar de pose, `callado` o movimiento reducido.
- Las capturas de cada gesto están en `docs/diseno/f12/rive/reposo/capturas/`. La persona usuaria las revisa después de la integración (decisión del 26-10-2026).

