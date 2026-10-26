# Celebración y reposo de Capsulito (F12, RF-243, RF-244, RF-248)

Dos efectos con una función cada uno. Ninguno añade librerías.

## Celebración al registrar (`lib/ui/movimiento/Confeti.svelte`)

| Aspecto | Regla |
| --- | --- |
| Cuándo | Solo cuando el servidor confirma un café propio, un café de invitado o «He rellenado el agua». Un duplicado, un rechazo y un café pendiente de enviar no celebran. |
| Qué | 14 piezas de confeti de unos 0,8 s sobre la tarjeta pulsada. Solo CSS, con las clases de los tokens `accent`, `positive`, `warning`, `cap-azul` y `cap-rosa`. Sin colores propios. |
| Qué no | Sin modal. `pointer-events: none`: no bloquea nuevos toques ni «Deshacer». Es decorativo y no se anuncia: el mensaje de confirmación sigue anunciándose. |
| Movimiento reducido | Sin confeti (`prefers-reduced-motion` o `mascota.animar` falso). Queda el aviso y, con la voz activa, el sonido. |
| Sonido | `static/mascota/sonidos/celebracion.mp3` (≤ 30 KB), con el interruptor de voz de Ajustes. Suena antes de la locución y una celebración nueva corta la anterior. |

## Reposo de Capsulito (`lib/ui/Capsulito.svelte`, `lib/shared/mascota/reposo.ts`)

| Tiempo en reposo | Gesto |
| --- | --- |
| Cada 3 s | Parpadeo |
| 6 s | Mira a los lados |
| 12 s | Golpea el suelo con el pie |
| 16 s | Mira un reloj imaginario |
| 21 s | Bosteza; el ciclo (23 s) vuelve a empezar |

- El orden es fijo y depende del tiempo quieta, no del azar (constitución XVIII).
- Solo con 112 px o más (`md`, `lg`, `xl`) y sin `callado`. Los tamaños pequeños (64 px) no cambian.
- El reposo cuenta desde que termina la animación de la pose. Hablar, cambiar de pose, `callado` o movimiento reducido lo interrumpen y reinician el ciclo.
- Con movimiento reducido no se monta el lienzo de reposo: Capsulito queda quieta.
- Fuente de la animación y capturas de cada gesto: `docs/diseno/f12/rive/reposo/`.
