# Contrato para el agente de beCafé

Los assets tienen dos capas independientes en la máquina `Capsulito`:
`Movimiento` y `Boca`. Los nombres exactos de artboard/view model de cada fichero
están en `manifest.json`. Usar la instancia `Default` del view model asociado al
artboard y vincularla a la reproducción. No usar la API antigua de inputs de
máquina de estados: estos controles son propiedades de un view model.

| Propiedad | Tipo | Inicial | Función |
|---|---|---|---|
| `play` | trigger | — | Repetir el gesto desde reposo o estado cancelado |
| `cancel` | trigger | — | Volver inmediatamente a la pose estática |
| `autoPlay` | boolean | true | Gesto al cargar; fijar antes del primer avance |
| `reducedMotion` | boolean | false | Pose estática, sin parpadeo ni boca animada |
| `mouth` | number entero 0–7 | 0 | Seleccionar forma de boca |
| `speechDemo` | boolean | false | Secuencia de prueba SIN audio, solo revisión |

Al desactivar `reducedMotion`, lanzar `play` si se quiere reanudar el gesto;
no se reproduce automáticamente un evento de negocio antiguo. `cancel` actúa
en la capa de gesto; para cancelar una intervención hablada hay que detener
también el audio y poner `mouth=0`, `speechDemo=false`. El disparador `play`
durante un gesto activo no lo reinicia ni añade eventos a una cola.

| mouth | Forma | Uso orientativo |
|---|---|---|
| 0 | Original de la pose | Reposo y vuelta a expresión original |
| 1 | Cerrada | Silencios, M/B/P |
| 2 | Abierta | A |
| 3 | Extendida | E/I |
| 4 | Redonda | O |
| 5 | Estrecha | U |
| 6 | Labiodental | F/V visual; no asignar V española automáticamente a F |
| 7 | Lengua | L y articulaciones próximas, según el audio |

Los valores son categorías discretas, no interpolar `mouth` ni asignar números
fuera de rango. La conversión debe considerar sonidos y contexto: las letras
no se corresponden siempre con fonemas, y la V española suele sonar como B.
Esta entrega no contiene un conversor de texto a visemas ni tiempos definitivos.

## Integrar audio

`lip-sync.mjs` exporta `attachLipSync(audio, setMouth, cues, options)`.
`audio` es un HTMLAudioElement, `setMouth` una función proporcionada por el
adaptador de Rive que escribe la propiedad `mouth` de su instancia vinculada.
El módulo no importa un SDK ni supone una versión de Svelte/Rive.

```javascript
import { attachLipSync } from './lip-sync.mjs';

// `sync` viene del JSON verificado del MP3 definitivo.
// `setMouth` lo implementa el adaptador con el runtime real de beCafé.
const lips = attachLipSync(audio, setMouth, sync.cues, {
  duration: sync.durationSeconds,
  enabled: !prefersReducedMotion,
});
// Ejecutar a partir de una acción/autorización de sonido del usuario:
try {
  await audio.play();
} catch {
  lips.stop(); // conservar el texto visible aunque falle el sonido
}
// Al abandonar escena, cambiar recurso o desmontar componente:
// lips.dispose();
```

El reloj es `audio.currentTime`, no un temporizador iniciado al solicitar la
descarga. Se contemplan pausa, búsqueda, buffering, fin, error, cambio de
velocidad y desmontaje. Los huecos de la pista usan boca cerrada. La boca vuelve
a la expresión original al pausar o terminar. `setEnabled(false)` desactiva
solo los labios; el anfitrión también debe ajustar `reducedMotion` en Rive.
No recrear la instancia del view model a cada fotograma.

Comprobar hash y nombre del MP3 con `tools/validar_audio.py`. Validar que su
duración real coincide con `durationSeconds` al cargar metadatos. Si faltan
tiempos válidos, mostrar la expresión original y los textos; no inventar una
sincronización a partir del número de letras. No activar `speechDemo` como
sustituto de una sincronización real.

## Gobierno de eventos

Las asociaciones del CSV son propuestas, no lógica de dominio implementada.
Mantener un único protagonista y una voz a la vez. Deduplicar confirmaciones;
dar prioridad a errores y controles de negocio sobre celebraciones. Una cola
pendiente o la recuperación de conexión no son confirmaciones del servidor.
La aplicación conserva textos funcionales, importes, permisos, intervalos de
agua y el botón Deshacer. La mascota no escribe en inventario, saldos ni usuarios.

El gesto `Pensando` es una pose genérica sonriente, no una expresión preocupada
final. Para errores sensibles, desactivar la mascota y conservar el aviso
funcional si esa expresión no resulta apropiada.

## Validación aún necesaria en la aplicación

Carga y vinculación del view model con su runtime real; reproducción de MP3 y
timings finales; interacción con Deshacer; cambio de escena/cancelación; ausencia
de audio y recursos; opciones de accesibilidad, claro/oscuro y dispositivos
objetivo. `validacion.json` describe pruebas locales, no certifica esa integración.
