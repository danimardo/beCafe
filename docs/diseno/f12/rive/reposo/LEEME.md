# Capsulito en reposo (F12, RF-248, DEC-128; F14, RF-259, DEC-133)

Animación Rive de los gestos de reposo. La fuente es `scene.rml`, que **se genera** a partir de
`static/mascota/svg/capsulito-saludando.svg` con `generar-reposo.mjs` (derivado de `docs/diseno/f11/rive/generar-entrada.mjs`).
No la edites a mano: cambia el generador.

## Comandos (desde la raíz del repositorio)

```bash
node docs/diseno/f12/rive/generar-reposo.mjs                      # SVG -> scene.rml
~/.rive/bin/rive ./docs/diseno/f12/rive/reposo --verify           # compila sin escribir
~/.rive/bin/rive inspect ./docs/diseno/f12/rive/reposo --summary  # problems debe ser []
~/.rive/bin/rive ./docs/diseno/f12/rive/reposo --once             # escribe build/reposo.riv
cp docs/diseno/f12/rive/reposo/build/reposo.riv static/mascota/riv/capsulito-reposo.riv
node docs/diseno/f12/rive/capturar-reposo.mjs                     # fotogramas clave de cada gesto en capturas/
```

La CLI no lanza disparadores, así que `capturar-reposo.mjs` carga el `.riv` con `@rive-app/canvas` en Chromium y los lanza desde el navegador.
Se eliminaron `AGENTS.md` y `CLAUDE.md` que crea `rive create`: duplicarían las reglas del proyecto.

## Contrato

Artboard `Reposo` (1185 × 1185, sin fondo) y máquina de estados `Reposo`. Las entradas son propiedades del ViewModel `Reposo` (instancia `Default`):

| Entrada | Tipo | Efecto |
| --- | --- | --- |
| `mirarLados` | disparador | Las pupilas van a la izquierda, a la derecha y vuelven al centro (1,2 s). |
| `pie` | disparador | La pierna derecha se levanta y golpea el suelo tres veces; las cejas bajan un poco (1,2 s). |
| `bostezoMano` | disparador | El brazo izquierdo sube y la mano tapa la parte baja de la boca, muy abierta; los ojos se entornan (1,8 s). |
| `tocarReloj` | disparador | Aparece un reloj de muñeca en el brazo izquierdo; Capsulito lo mira, lo golpea cuatro veces con la otra mano y acaba mirando al frente con cara de prisa (2 s). |
| `bostezo` | disparador | La boca se abre mucho, los ojos se cierran y la figura se estira (2 s). |
| `cancelar` | disparador | Vuelve al neutro de inmediato, sea cual sea el gesto en curso. |
| `reducedMotion` | booleano | Detiene la respiración y el parpadeo. |

Capas: `Parpadeo` (respiración y parpadeo en bucle de 3 s; quieto con `reducedMotion`) y `Gesto` (cada disparador lanza su
animación y al terminar vuelve a `neutro`). Los párpados del bostezo van cerrados, así que no hay parpadeo durante el bostezo.
Los tiempos de cada gesto (4; 9,5; 15; 20,5 y 26 s en reposo, ciclo de 29 s) no están en el `.riv`: los fija `src/lib/shared/mascota/reposo.ts`.
Las animaciones van a 60 fotogramas por segundo.
