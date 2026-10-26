# El misterio de la última cápsula

Corto autónomo de Capsulito en vertical 9:16. El montaje final dura 72 segundos a 1080 × 1920 y 30 fps. Presenta el problema de los cafés sin apuntar y muestra el registro de cada café, el aviso de pocas cápsulas, las compras y la diferencia entre saldo personal y aportaciones a la hucha. No está integrado aún en ninguna pantalla de beCafé.

La versión vigente se dibuja con SVG por piezas en páginas HTML (`html/`) y se captura fotograma a fotograma (`specs/013-corto-capsulito/plan.md` §6). Sustituye a la versión Rive.

## Entrega

- [`entrega/el-misterio-de-la-ultima-capsula.mp4`](entrega/el-misterio-de-la-ultima-capsula.mp4): vídeo con siete locuciones, música y efectos originales, y subtítulos incrustados.
- [`entrega/portada.png`](entrega/portada.png): portada vertical.
- [`entrega/subtitulos.vtt`](entrega/subtitulos.vtt) y [`entrega/transcripcion.md`](entrega/transcripcion.md): alternativas de texto.
- [`entrega/lamina-final.png`](entrega/lamina-final.png): un fotograma de cada plano.

## Regeneración local

Se necesitan `ffmpeg`, Playwright con Chromium y las dependencias npm del proyecto. Desde la raíz del directorio de trabajo:

```bash
for n in 01 02 03 04 05 06 07; do node docs/diseno/corto-capsulito/html/capturar-plano.mjs $n; done
node docs/diseno/corto-capsulito/html/banda-sonora.mjs
node docs/diseno/corto-capsulito/html/montar-corto.mjs
```

- `html/capsulito.js` monta a Capsulito por piezas a partir de `static/mascota/svg/`; `html/decorado.js` dibuja la cocina común y `html/objetos.js`, la lupa, el móvil, la hucha y demás objetos.
- Cada `html/plano-NN.js` es una función pura del tiempo: abre `html/plano-NN.html` en el navegador para verlo con el botón «Reproducir», o añade `?t=4.2` para ver un instante.
- `capturar-plano.mjs NN --hoja 1,2,3` genera una hoja de fotogramas en `.local/corto-capsulito/` para revisar un plano sin exportarlo.
- Los planos sueltos (`entrega/planos/`) y las imágenes intermedias (`.local/corto-capsulito/`) quedan fuera de Git.

Las siete locuciones en `audio/locuciones/` incluyen MP3 y JSON con marcas de boca. `audio/generar-locuciones.mjs` reproduce esas pistas mediante la voz configurada del proyecto y requiere acceso a la API de voz; no hace falta para reconstruir el vídeo. Las locuciones 05 y 07 pronuncian la marca «Bicafé», como se dice en el departamento.

## Versión Rive

La primera versión, hecha con Rive (animáticas, piloto, proyectos `.riv` y sus scripts), no está en el repositorio: se sustituyó por la versión HTML (`specs/013-corto-capsulito/plan.md` §6).
