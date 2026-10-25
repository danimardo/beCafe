# Capsulito de la entrada (F11, RF-225, DEC-123)

Animación Rive de la pantalla de acceso. La fuente es `scene.rml`, que **se genera** a partir de
`static/mascota/svg/capsulito-saludando.svg` con `generar-entrada.mjs`. No la edites a mano: cambia el generador.

## Comandos (desde la raíz del repositorio)

```bash
node docs/diseno/f11/rive/generar-entrada.mjs                      # SVG -> scene.rml
~/.rive/bin/rive ./docs/diseno/f11/rive/entrada --verify           # compila sin escribir
~/.rive/bin/rive inspect ./docs/diseno/f11/rive/entrada --summary  # problems debe ser []
~/.rive/bin/rive ./docs/diseno/f11/rive/entrada --once             # escribe build/entrada.riv
cp docs/diseno/f11/rive/entrada/build/entrada.riv static/mascota/riv/capsulito-entrada.riv
node docs/diseno/f11/rive/capturar-entrada.mjs                     # capturas de cada estado en capturas/
```

Las entradas son propiedades del ViewModel `Entrada` (instancia `Default`). La CLI solo las fija con `--data`, y los disparadores no, así que
`capturar-entrada.mjs` carga el `.riv` con `@rive-app/canvas` en Chromium y las fija desde el navegador.
Se eliminaron `AGENTS.md` y `CLAUDE.md` que crea `rive create`: duplicarían las reglas del proyecto.

## Contrato

Artboard `Entrada` (1185 × 1185, sin fondo) y máquina de estados `Entrada`:

| Entrada | Tipo | Efecto |
| --- | --- | --- |
| `mirarX` | número 0–100 | Las pupilas siguen la posición del cursor en el correo (0 izquierda, 50 centro, 100 derecha). |
| `taparOjos` | booleano | Los dos brazos suben y las manos tapan los ojos (contraseña). |
| `fallo` | disparador | Cejas caídas, boca triste y lágrima; vuelve solo al reposo a los 2,5 s. |
| `exito` | disparador | Saltos, brazo en alto, boca grande y confeti; se queda en la pose final. |
| `reducedMotion` | booleano | Detiene la respiración y el parpadeo. |

Capas: `Reposo` (respiración y parpadeo en bucle), `Mirada` (mezcla 1D de `mirarX`), `Manos` y `Emocion`.
Las entradas de la máquina de estados están en desuso en la documentación de la CLI, pero el runtime web las
admite y evitan un ViewModel para cinco valores.
