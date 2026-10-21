# Principios de diseño — Latte

Cálido, editorial y tranquilo: un café con leche con cristal esmerilado por encima. Inspirado en el «Liquid Glass» de Apple sin imitarlo.

## Cristal y fondo

El fondo («wall») es un color base con manchas difuminadas (`wall-1…3` sobre `wall-base`, utilidad `wall-blobs`). Sobre él viven las superficies:

- **`glass`** (blur 24 px, saturación 180 %) — tarjetas, tiles, filas. Borde `glass-border`, brillo interior `glass-highlight`, sombra suave.
- **`glass-strong`** (blur 40 px) — lo que flota: píldora de navegación, avisos «Deshacer», hojas modales.
- Texto pequeño siempre sobre cristal. Solo titulares grandes (`display`) se apoyan en el fondo.
- `prefers-reduced-transparency`: las superficies pasan a color sólido equivalente.

## Color (tokens semánticos)

`ink` (texto), `ink-muted` (secundario), `hairline` (separadores), `accent` (**la** acción principal; canela en claro, canela clara en oscuro) con `on-accent` encima, `accent-soft`, `positive`, `negative`, `warning` (+ variantes `-soft`), `scrim`. Los `cap-*` son colores identificativos de cápsulas (ristretto, lungo, decaf, colombia, vainilla, intenso, azul, rosa).

Todos los pares de texto/fondo están verificados ≥4,5:1 en el peor caso (cristal sobre manchas) en claro y oscuro; bordes de campo ≥3:1.

## Tipografía

Títulos en **Fraunces** (serif, cálida); texto en **Inter**. Estilos (`type-*`): `display` 34/40, `title-lg` 22/28, `amount` 44/48 (cifras tabulares), `title` 17/22, `body` 15/20, `caption` 13/18, `eyebrow` 12/16 mayúsculas.

## Forma y espacio

Radios: `chip` 12, `tile` 20, `panel` 28, `sheet` 36, `full` para botones y navegación flotante. Espaciado en múltiplos de 4. Objetivos táctiles ≥44 px.

## Claro y oscuro

`data-theme="claro|oscuro"` en `<html>`. Preferencia **Automático** (por defecto, `prefers-color-scheme`), **Claro** u **Oscuro**, elegible en Perfil. El componente nunca decide colores por tema: los tokens cambian.

## Responsive

Móvil primero. <md: píldora flotante inferior con 5 pestañas (Inicio, Saldos, Compras, Estadísticas, Perfil), contenido ≤ `max-w-2xl`. ≥md: barra lateral de cristal con grupo «Administración», hojas centradas. Administración usa contenedor ancho (`width="wide"`).

## Contenido y tono

Español, tuteo, frases cortas: «¿Qué cápsula te pones?», «Ristretto registrado», «Deshacer». Importes siempre con signo: `−2,45 €`, `+4,10 €`. Fechas cortas en minúscula («20 oct»).

## Movimiento

Transiciones breves; todo se desactiva con `prefers-reduced-motion`.
