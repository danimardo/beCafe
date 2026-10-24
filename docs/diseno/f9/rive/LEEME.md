# Capsulito — ocho poses animadas y boca controlable

Versión 0.2.0. Creado con Rive CLI 1.7.0 a partir de tus ocho SVG.
El saludo inicial aprobado se conserva en su carpeta anterior sin cambios.

## Empezar en Windows

Descomprimir el ZIP completo. Abrir `VER-ANIMACIONES.cmd` para el saludo.
Abrir `VER-BOCA-SIN-AUDIO.cmd` para ver las formas de boca en movimiento:
es una demostración silenciosa, todavía no sincronizada con una grabación.
Los lanzadores necesitan que `rive --help` funcione en ese equipo.

También se pueden abrir los archivos de `riv/` con el visor que usaste para el
primer saludo. Hay ocho archivos independientes y `capsulito-biblioteca.riv`,
que reúne las ocho poses en artboards independientes.

Para previsualizar una pose con la CLI desde esta carpeta:

```powershell
rive proyectos\celebrando
rive proyectos\pensando --data=speechDemo=true
rive proyectos\biblioteca --artboard=Recordatorio
```

El gesto se reproduce una vez y vuelve a reposo con parpadeo. Hacer clic en el
lienzo desde reposo lo repite. Los gestos son breves y conservan la geometría
del material aprobado; caminar es un paso estilizado en el sitio y añadir
cápsula es un gesto de presentación, no una simulación de inventario.

## Contenido

- `riv/`: 8 `.riv` individuales y 1 biblioteca conjunta, sin scripts ni audio.
- `proyectos/`: fuentes RML y configuración Rive de todos los archivos.
- `fuentes/`: los ocho SVG originales y sus puntos de articulación, preservados.
  También sirven de alternativa estática.
- `previews/`: capturas del reproductor, galería de poses y galería de bocas.
- `manifest.json`: rutas reales, tamaños, SHA-256 y nombres de los controles.
- `validacion.json`: resultados de compilación y pruebas de renderizado.
- `integracion/`: contrato de uso y controlador de sincronización con MP3.
- `voces/`: 27 textos candidatos para revisar antes de grabarlos en ElevenLabs.
- `tools/` y `tests/`: generación reproducible y verificaciones.

## Qué está hecho y qué queda

Las ocho poses tienen gesto, reposo, cancelación, modo estático y ocho formas de
boca seleccionables de forma independiente. El modo `reducedMotion` detiene el
gesto, parpadeo y movimiento de boca. Los `.riv` no contienen scripts, por lo
que no necesitan firma de scripts ni credenciales para esta compilación local.

Pendiente: revisión visual de estas siete nuevas animaciones y las bocas,
aprobación de los textos, MP3 definitivos, sincronización con las grabaciones e
integración/pruebas con la versión real del runtime de beCafé. No se ha creado
un backend ni modificado la aplicación, cuyo código no está en este paquete.
La máquina usa data binding moderno; el agente debe comprobar que su runtime
lo admite. No se ha hecho una prueba en ese runtime ni en Windows desde aquí.

Este lote cubre las ocho poses aportadas; no sustituye todo el catálogo previsto
en las especificaciones (escenas con jarra, hucha, móvil, cajas, otras expresiones,
etc.). Las 48 variantes faciales de la entrega anterior no se han convertido en
48 animaciones adicionales. Las formas de boca nuevas son un repertorio visual
simplificado, no un analizador de fonemas.

Las fuentes editables son `.rml`. No se incluye `.rev`: para exportarlo al editor,
iniciar sesión en Rive y usar, por ejemplo:

```powershell
rive login
rive proyectos\biblioteca --once --rev=proyectos/biblioteca/build/capsulito-biblioteca.rev
```

No se ha subido ni publicado nada en una cuenta de Rive o ElevenLabs.

## Regenerar y verificar

Python 3 y Rive CLI; Pillow se utiliza solamente para comparación de capturas y
láminas de revisión. El controlador de audio se prueba con Node.js 20 o posterior.

```text
python tools/generar.py
python tools/verificar.py --rive rive
node --test tests/lip-sync.test.mjs
python tools/empaquetar.py
```

`generar.py` reemplaza los RML generados: guardar cambios manuales antes de
ejecutarlo. Los originales SVG y el prototipo de saludo aprobado no se modifican.

Las comprobaciones automáticas verifican movimiento visible, repetición por clic,
formas de boca distintas y ausencia de movimiento en modo reducido. Las capturas
usan el fondo oscuro del visor; el artboard no lleva un rectángulo de fondo.
