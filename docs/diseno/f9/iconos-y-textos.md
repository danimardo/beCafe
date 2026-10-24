# Menos texto, más imagen (F9)

Criterio: **si un icono, una cifra o una imagen lo dicen, el texto sobra**. Una frase de ayuda como máximo por sección y, cuando se habla de un botón, se dibuja el botón (su icono) en la frase.

## 1. Sustituciones concretas

| Pantalla | Ahora | Después |
| --- | --- | --- |
| Inicio | «Toca una cápsula para registrarla. El botón de persona la registra para un invitado.» | «Toca para apuntar tu café · [icono de invitado] para un invitado» |
| Inicio, tarjeta de cápsula | «Marca de prueba · 3,48 € / -1 uds · ~0 d» | [paquete] 42 · [calendario] 21 d · 0,35 € (con el texto completo para lectores de pantalla) |
| Inicio | «Stock bajo» como sección con «0 días estimados» por fila | Una línea en `AlertsPanel` con ⚠ «3 tipos en stock bajo: …» y la insignia en cada tarjeta |
| Inicio | «Hucha (teórica)» / «Tu saldo: +29,12 €» en texto | Icono de hucha y de cartera, y dos cifras grandes |
| Inicio, aviso | «Ristretto registrado» | **Sin cambios**: los textos de F1–F8 se mantienen, igual que sus pruebas |
| Inicio, agua | Aviso «Relleno registrado — Gracias por ocuparte del agua» | El mismo texto, con Capsulito celebrando en lugar del icono ✓ |
| Compras | «2026-10-24 · Luis · 3,48 €» | [carrito] «24 oct · Luis» · «−3,48 €» (fecha corta y signo, constitución XI); el resto del texto, sin cambios |
| Historial | «No mueve dinero: solo cuenta para el ranking…» dentro de la fila | Icono de gotas en la fila; la nota, una vez al pie de la lista |
| Estadísticas | Etiquetas de KPI en texto | Icono encima de cada cifra; miniatura de cápsula en la leyenda de favoritas |

## 2. Iconos (Lucide, los mismos en toda la app)

| Concepto | Icono | Concepto | Icono |
| --- | --- | --- | --- |
| Hucha | `piggy-bank` | Tu saldo | `wallet` |
| Café, consumo | `coffee` | Invitado | `user-plus` |
| Stock (unidades) | `package` | Días estimados | `calendar-clock` |
| Stock bajo | `triangle-alert` | Sin stock | `circle-alert` |
| Agua | `droplets` | Aguador | `trophy` |
| Compra | `shopping-cart` | Aportación | `hand-coins` |
| Deshacer | `undo-2` | Sin conexión | `wifi-off` |

Reglas: el icono acompaña al texto, no lo sustituye en las acciones (los botones llevan etiqueta visible), salvo el botón de invitado y la campana, que llevan `aria-label`. Tamaño de 20–22 px en navegación, 14–18 px en línea y 20 px dentro de círculos `accent-soft` de 40 px.

## 3. Tono de los textos

- Tú, presente, frases de 3 a 8 palabras.
- Verbo en lugar de sustantivo: «Apunta tu café», no «Registro de consumo».
- Cifras con unidades y signo, nunca en párrafos.
- Las cuestiones de dinero y de seguridad se dicen sin humor.
