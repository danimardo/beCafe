# Voces de Capsulito: siguiente fase

No hay MP3 ni sincronizaciones de audio reales en esta entrega.
`textos-propuestos.csv` contiene 27 frases candidatas, no aprobadas ni grabadas.
El separador es punto y coma y la codificación es UTF-8.

## Generar en ElevenLabs

1. Revisar las frases antes de gastar créditos. Se puede empezar con `intro_01`.
2. Usar la voz de Capsulito que ya tienes creada, manteniendo modelo y ajustes
   de voz consistentes entre archivos.
3. Generar un archivo por fila elegida. Descargar con el nombre de la columna
   `mp3_previsto`; no concatenar todo el catálogo en una sola grabación.
4. Conservar el texto exacto pronunciado y cualquier cambio realizado en ElevenLabs.
5. Entregar los MP3 finales junto al catálogo corregido. Una nueva toma cambia
   los tiempos: la sincronización anterior no puede reutilizarse sin comprobarla.

Puedes hacerlo desde la web. Si se utiliza la API, el endpoint de generación
con tiempos devuelve audio y alineación por caracteres. Si solo se dispone del
MP3 final, la alineación forzada admite audio y texto para recuperar tiempos.
Ninguna de esas respuestas es por sí sola un repertorio de visemas: todavía hay
que convertir sonidos a formas de boca y revisar la sincronización escuchándola.

Documentación oficial:
- https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
- https://elevenlabs.io/docs/overview/capabilities/forced-alignment

No se ha llamado a ElevenLabs ni se han consumido créditos. No incluyas claves
API en el ZIP, en los JSON de audio ni en código que se ejecute en el navegador.

## Formato previsto de sincronización

Un JSON por MP3, con `schemaVersion: 1`, `clipId`, `audioFile`,
`audioSha256`, `durationSeconds` y `cues`.
Cada cue contiene `start`, `end` (segundos del audio final) y `mouth` (entero 1–7).
Los intervalos son `[start, end)`, ordenados, no solapados; los huecos representan
silencio y usan la boca cerrada. La forma 0 restaura la expresión original al
terminar, pausar o cancelar la reproducción. No asignar tiempos a partir de la
longitud del texto: deben proceder de la grabación definitiva.

Ejemplo de estructura, NO sincronización de una grabación real:

```json
{
  "schemaVersion": 1,
  "clipId": "intro_01",
  "audioFile": "intro_01.mp3",
  "audioSha256": "SHA256_DEL_MP3_FINAL",
  "durationSeconds": 3.2,
  "cues": [{"start": 0.2, "end": 0.35, "mouth": 2}]
}
```

El script `tools/validar_audio.py` comprueba el hash y los intervalos antes de
la integración. Después hay que escuchar y ver el clip: validar los números
no demuestra que los labios coincidan con la pronunciación.

## Uso en beCafé

La voz es opcional y complementa los textos visibles. Activarla mediante una
preferencia/acción del usuario, tratar los rechazos de `audio.play()` y mantener
subtítulos. No poner dos voces a la vez; cancelar la anterior al cambiar de
escena, deshacer una operación o presentar un aviso prioritario.

Las poses asociadas en el CSV son acompañamientos genéricos con el material
disponible: todavía no se han dibujado la jarra, la hucha, el móvil o las escenas
completas del storyboard. No se incluyen frases para decisiones económicas
bloqueantes ni advertencias personales de deuda; su mensaje debe seguir en la
interfaz autorizada. No activar una frase de éxito antes de la confirmación real.
