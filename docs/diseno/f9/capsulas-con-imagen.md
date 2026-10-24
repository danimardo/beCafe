# Cada cápsula con su imagen (F9 · RF-185)

Hoy las cápsulas se ven como círculos grises: la app no pasa el color del tipo ni la foto (desviación G9). Para que se reconozcan de un vistazo («la morada es el Ristretto»), cada tipo se muestra **siempre** con imagen.

## 1. Qué se ve

| Caso | Imagen |
| --- | --- |
| El tipo tiene foto (RF-005) | Foto recortada en círculo con un **aro del color del tipo** (el color sigue identificándolo) |
| No tiene foto, o la foto no carga | **Ilustración vectorial** de cápsula en el estilo de Capsulito, con cuerpo y cúpula **del color del tipo** y aro crema |

Muestra de las 8 preselecciones de color en claro y oscuro: `capturas/despues/inicio-escritorio-*.png`. La ilustración se lee bien incluso con colores muy claros (vainilla) o muy oscuros (intenso), gracias al contorno suave y a los brillos.

## 2. Componentes

| Componente | Uso |
| --- | --- |
| `CapsuleIllustration` (nuevo) | SVG en línea, teñido con `color`. Los identificadores de los degradados son únicos por instancia (`$props.id()`), así que se pueden poner varias en una página. Es la misma figura que `static/ilustraciones/capsula.svg` (`currentColor`), para usar fuera de Svelte (correo, documentación, Design System). |
| `CapsuleImage` (actualizado) | Misma API que antes (`name`, `color`, `photoUrl`, `size`) y un tamaño nuevo, `xl` (88 px). Si la foto da error (`onerror`), pasa a la ilustración. |
| `CapsuleTile` (nuevo, con cristal por la enmienda de XVIII) | Tarjeta gráfica de Inicio: imagen `xl`, nombre, línea de iconos (paquete + unidades, calendario + días, precio), `StockBadge` si toca, y botón «+1» a todo el ancho. Botón de invitado arriba a la derecha (hermano, no anidado). La información completa va en un texto solo para lectores de pantalla (`aria-describedby`). Al tocar, la cápsula da un saltito (sin animación si se pide reducir movimiento). |
| `CapsuleRow` (sin cambios) | Versión compacta en fila. Para listas densas: administración y selección en hojas. |

## 3. Datos que debe enviar el servidor

Por cada tipo activo: `color` (hex, **obligatorio**, RF-001) y `photoUrl` (opcional, RF-005). Si en la base de datos hay tipos sin color, se les asigna uno de las preselecciones (`capsulePresets` de `ColorField`) en la migración, no en la interfaz.

## 4. Fotos de los administradores (guía para `/admin/capsulas`)

Mostrar esta ayuda junto a `PhotoField`:
- Foto **cuadrada**, de al menos 512 × 512 px, de **una sola cápsula** de frente o vista desde arriba.
- Fondo liso y claro; la cápsula centrada y ocupando el 70 % (se recorta en círculo).
- Sin texto ni marcas de agua.

Vista previa en vivo en el formulario de alta: un `CapsuleTile` sin acciones con la foto o la ilustración en el color elegido.

Procesado en el servidor (recomendado): convertir a WebP de 256 y 512 px y servir con `srcset`. La foto original no se usa directamente en la interfaz.
