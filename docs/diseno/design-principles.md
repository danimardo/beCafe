# Principios de diseño — Latte

Cálido, editorial y tranquilo: un café con leche con cristal esmerilado por encima. Inspirado en el «Liquid Glass» de Apple sin imitarlo.

## Cristal y fondo

El fondo («wall») es un color base con manchas difuminadas (`wall-1…3` sobre `wall-base`, utilidad `wall-blobs`). Sobre él viven las superficies:

- **`glass`** (blur 24 px, saturación 180 %) — tarjetas, tiles, filas. Borde `glass-border`, brillo interior `glass-highlight`, sombra suave.
- **`glass-strong`** (blur 40 px) — lo que flota: píldora de navegación, avisos «Deshacer», hojas modales.
- Texto pequeño siempre sobre cristal. Solo titulares grandes (`display`) se apoyan en el fondo.
- El cristal solo se usa cuando cumple una función (agrupar, indicar que algo flota). **Nunca se anida** cristal dentro de cristal. El contenido denso y los formularios van sobre una superficie estable. Excepción cerrada: la tarjeta de cápsula de un toque de Inicio (`CapsuleTile`) puede usar `glass` como superficie de sus acciones rápidas de consumo, y el bocadillo o tostada de celebración de Capsulito puede usar `glass` o `glass-strong`, siempre que pasen a superficie opaca con `prefers-reduced-transparency` o «Reducir transparencia». Los formularios con campos de entrada siguen sobre superficie estable.
- `prefers-reduced-transparency` o el ajuste **«Reducir transparencia»** de Perfil (RF-181, desactivado por defecto y guardado por dispositivo): las superficies pasan a color sólido equivalente, con las mismas acciones. El ajuste solo añade opacidad: nunca reactiva efectos que el sistema pide reducir. *Pendiente de implementar el ajuste; hoy solo responde a la preferencia del sistema.*

## Color (tokens semánticos)

`ink` (texto), `ink-muted` (secundario), `hairline` (separadores), `accent` (**la** acción principal; canela en claro, canela clara en oscuro) con `on-accent` encima, `accent-soft`, `positive`, `negative`, `warning` (+ variantes `-soft`), `scrim`. Los `cap-*` son colores identificativos de cápsulas (ristretto, lungo, decaf, colombia, vainilla, intenso, azul, rosa).

Todos los pares de texto/fondo están verificados ≥4,5:1 en el peor caso (cristal sobre manchas) en claro y oscuro; bordes de campo ≥3:1. El contraste se mide sobre el resultado compuesto, no sobre el token aislado.

**Pendiente de implementar** (constitución XI, RNF-015):

- `prefers-contrast: more`: se refuerzan texto, límites y foco.
- `forced-colors: active`: controles, límites y foco siguen visibles con los colores del sistema.
- Texto al 200 % y reflow a 320 px de ancho sin pérdida de contenido ni de función.

## Tipografía

Títulos en **Fraunces** (serif, cálida); texto en **Inter**. Estilos (`type-*`): `display` 34/40, `title-lg` 22/28, `amount` 44/48 (cifras tabulares), `title` 17/22, `body` 15/20, `caption` 13/18, `eyebrow` 12/16 mayúsculas.

## Forma y espacio

Radios: `chip` 12, `tile` 20, `panel` 28, `sheet` 36, `full` para botones y navegación flotante. Espaciado en múltiplos de 4. Objetivos táctiles ≥44 px.

## Claro y oscuro

`data-theme="claro|oscuro"` en `<html>`. Preferencia **Automático** (por defecto, `prefers-color-scheme`), **Claro** u **Oscuro**, elegible en Perfil (RF-180) y guardada por dispositivo. En Automático, un cambio del sistema durante la sesión se aplica sin perder trabajo ni foco. El componente nunca decide colores por tema: los tokens cambian. Cada componente y cada estado se diseña en los dos temas.

## Responsive

Móvil primero. <md: píldora flotante inferior con 5 pestañas (Inicio, Saldos, Compras, Estadísticas, Perfil), contenido ≤ `max-w-2xl`. ≥md: barra lateral de cristal con grupo «Administración», hojas centradas. Administración usa contenedor ancho (`width="wide"`).

## Contenido y tono

Español, tuteo, frases cortas: «¿Qué cápsula te pones?», «Ristretto registrado», «Deshacer». Importes siempre con signo: `−2,45 €`, `+4,10 €`. Fechas cortas en minúscula («20 oct»).

## Movimiento

Transiciones breves y solo con función; nunca retrasan la respuesta a una acción. Todo se desactiva con `prefers-reduced-motion`.

## Mascota («Capsulito»)

«Capsulito» es una cápsula de café expresiva con 8 poses base (`saludo`, `celebrando`, `pensando`, `dormido`, `alerta`, `triste`, `cafetera`, `hucha`) y 6 expresiones faciales (`feliz`, `orgulloso`, `pensando`, `sorprendido`, `triste`, `dormido`). Se anima con Rive (`.riv`, máquina de estados `Capsulito` con capas `Movimiento` y `Boca`, controles `ViewModel` `play`, `cancel`, `autoPlay`, `reducedMotion`, `mouth` `0..7`, `speechDemo`) y cuenta siempre con respaldo SVG estático en `static/mascota/svg/`.

- Su imagen es decorativa (`alt=""` o `aria-hidden="true"`): el texto visible contiene siempre el mensaje completo.
- Sus apariciones, poses, expresiones, frases y pistas de voz proceden de un catálogo tipado por momento o evento (`lib/ui/mascota/catalogo.ts`), con rotación para no repetir la misma frase dos veces seguidas.
- Tono alegre, cómplice y con guiños cafeteros e informáticos en momentos positivos o cotidianos; tono serio y directo (sin chistes ni reproches) en deuda personal, errores, rechazos o seguridad.
- Voz pregenerada opcional con ElevenLabs (`static/mascota/voces/<id>.mp3`) y sincronización labial (`static/mascota/voces/<id>.json`, bocas `1..7`), desactivada por defecto en reacciones cotidianas y activable en la historia de bienvenida, en el laboratorio `/ayuda/capsulito` o en Perfil.
- Respeta `prefers-reduced-motion` (congela el `.riv` o usa SVG estático) y puede ocultarse por completo en Perfil (`becafe-mascota`).
