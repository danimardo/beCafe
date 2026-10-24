# Bienvenida de primer uso (F9 · RF-188)

Objetivo: que quien entra por primera vez sepa **para qué sirve beCafé y qué tiene que tocar**, en menos de 30 segundos y sin leer párrafos.

Implementación: `referencia/src/lib/components/mascota/Bienvenida.svelte`, montada en `(app)/+layout.svelte`. Los pasos salen de `referencia/src/lib/mascota/bienvenida.ts`, que comparte con `/ayuda`. Capturas: `capturas/despues/bienvenida-movil.png` y `bienvenida-escritorio.png`.

## 1. Los 4 pasos

| Paso | Capsulito (`xl`, bocadillo arriba) | Título | Frase |
| --- | --- | --- | --- |
| 1 | `bienvenida-hola`: «¡Hola, {nombre}! Soy Capsulito.» | Esto es beCafé | La cafetera del departamento, sin papeles: qué cápsulas quedan y cómo va la hucha. |
| 2 | `bienvenida-cafe` | Un toque, un café | Toca la cápsula que te pones y queda apuntada. ¿Te equivocaste? Pulsa «Deshacer». |
| 3 | `bienvenida-hucha` | Pagas lo que tomas | Cada café descuenta su precio de tu saldo. Cuando estés en negativo, aporta a la hucha. |
| 4 | `bienvenida-agua` | ¿Rellenas el agua? | Dilo con un toque. Quien más la rellena es el aguador del mes. |

Botones: «Saltar» y «Siguiente»; en el último paso, «Atrás» y «¡A por el café!». Puntos de progreso (anunciados como «Paso N de 4»).

## 2. Comportamiento

- **Cuándo se abre**: la primera vez que la persona entra en el grupo `(app)` **después** de aceptar la privacidad (nunca encima de `/aceptar-privacidad`).
- **Cerrar de cualquier forma** (Saltar, ¡A por el café!, Esc, tocar fuera) la marca como vista.
- **Volver a verla**: Perfil › Apariencia › «Ver la bienvenida otra vez», y el botón de `/ayuda` (solo con JavaScript).
- **Sin JavaScript** (DEC-112): no se abre; `/ayuda` empieza por «Cómo funciona», con los 4 pasos fijos.
- **Persistencia**: solo en el dispositivo (`becafe-bienvenida` = `vista`), como las demás preferencias (principio V). En otro dispositivo se vuelve a mostrar una vez.
- **Con la mascota desactivada**: cada paso muestra un icono grande (mano, taza, hucha, gotas) en su lugar.
- **Móvil**: hoja inferior. **Escritorio**: diálogo centrado de 448 px.

## 3. Lo que no hace

No pide permisos (notificaciones, instalación): eso sigue en `/ayuda`. No tiene vídeo (fase 2, EXC-015).
