# Microinteracciones de F11 (RF-233 a RF-236)

Portadas de la guía de microinteracciones a los componentes Latte. Solo CSS y unas pocas líneas de JavaScript sin dependencias. Todas viven bajo `@media (prefers-reduced-motion: no-preference)`: con movimiento reducido el estado final aparece sin transición (EV-110).

## Tokens

Medidas de movimiento, no de diseño. Están en `src/app.css`:

| Token | Valor | Uso |
| --- | --- | --- |
| `--motion-icon-pop-scale` | `1.08` | Casillas y botones de opción al pulsar |
| `--motion-check-length` | `32` | Trazado del check de `Button` con `success` |
| `--motion-shake-distance` | `0.25rem` | Sacudida de un campo con error |
| `--motion-switch-squish` | `.88` | Deformación del pulgar de `Switch` |
| `--motion-spotlight-size` | `15rem` | Radio del brillo de borde |
| `--motion-spotlight-border` | `2px` | Grosor del brillo |
| `--motion-spotlight-strength` | `45%` | Intensidad del brillo |

## Uso

| Efecto | Dónde | Cómo |
| --- | --- | --- |
| Haz de foco, sacudida y mensaje de error | `TextField`, `MoneyField`, `PasswordField`, `SelectField` | Clases `campo-control` y `mensaje-error`; acción `sacudida` (reinicia la animación con cada error nuevo) |
| Respuesta de casillas, radios e interruptores | `input[type=checkbox\|radio]`, `Switch` | Solo CSS (`:active`) |
| Indicador deslizante | `SegmentedControl`, `ThemeToggle` | Acción `indicador`: mide la opción marcada y escribe `--indicador-x` y `--indicador-ancho`. Antes de medir, la opción marcada conserva su fondo |
| Brillo de borde | `Section panel`, `ListRow tarjeta` | Acción `spotlight`: solo con puntero fino. Nunca sobre `glass` ni `CapsuleTile` |
| Check de guardado | `Button success` | La página lo activa con `crearExito().marcar()` solo si `result.type === 'success'`; se apaga a los 1,2 s |
| Cifras que cambian | `Money animar`, `KpiTile numero` | `cifraAnimada`: 240 ms, continúa desde el valor visible; el lector recibe solo el valor final |

No uses el brillo sobre superficies `glass` (no se anida cristal, constitución XVIII) y no añadas otro efecto sin una función: confirmar, orientar o explicar un cambio.
