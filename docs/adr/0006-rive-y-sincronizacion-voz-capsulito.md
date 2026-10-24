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
