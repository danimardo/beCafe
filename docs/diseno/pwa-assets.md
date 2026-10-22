# Iconos y recursos de la aplicación

Todo sale de **un único archivo de marca**: `recursos/design/brand/becafe-logo-original.png` (el logotipo de beCafé aportado por el equipo: cuadrado redondeado azul petróleo, una «b» blanca con una taza de espresso en el aro y tres cápsulas). Para regenerarlo todo:

```bash
pip install pillow numpy scipy
python3 docs/diseno/recursos/generate-pwa-assets.py        # desde la raíz del proyecto
```

Si el logotipo cambia, sustituye el PNG (cuadrado, fondo blanco o liso) y vuelve a ejecutarlo.

## Dos versiones del dibujo

| Versión | Qué es | Dónde se usa |
| --- | --- | --- |
| **Completa** | El logotipo tal cual: taza con crema y cápsulas naranjas | Desde 96 px: iconos de la PWA, iOS, Android, macOS, Windows, tiendas, pantallas de arranque, marca de la aplicación |
| **Simplificada** | La «b» blanca con el aro de la taza sobre el mismo azul, sin crema ni cápsulas | Hasta 48 px: favicon, iconos pequeños de iOS/Android/macOS, y la insignia de notificaciones (solo silueta) |

Motivo: la crema, las cápsulas y los brillos son detalle fotográfico que a 16–32 px se convierte en manchas; la «b» con su aro sigue reconociéndose.

## Web y PWA — `static/`

| Archivo | Uso |
| --- | --- |
| `favicon.ico` (16, 32, 48), `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | Pestañas y marcadores (versión simplificada) |
| `icon-192.png`, `icon-512.png` | Iconos «any» del manifiesto; también `<link rel="icon">` de 192 |
| `icon-maskable-512.png` | Icono *maskable* (Android): el logotipo a 80 % sobre el azul a sangre, dentro de la zona segura |
| `apple-touch-icon.png` | iOS «Añadir a pantalla de inicio»: 180×180 **opaco y sin esquinas** (iOS pone las suyas) |
| `badge-96.png` | Insignia monocroma de notificaciones push: solo canal alfa (silueta blanca de la «b») |
| `mstile-150.png` | Baldosa de Windows (`<meta name="msapplication-TileImage">`) |
| `brand/becafe-mark.png`, `brand/becafe-mark-simple.png` | Marca dentro de la aplicación (`BrandMark`) |
| `splash/*.png` | Pantalla de arranque de iOS: 12 dispositivos × claro/oscuro, con el logotipo centrado. Los `<link rel="apple-touch-startup-image">` están en `src/app.html`; `recursos/design/pwa/splash-links.html` es la misma lista para consulta. Opcional |
| `manifest.webmanifest` | `display: standalone`, `lang: es`, fondo crema (el de la pantalla de carga) |

## Aplicaciones nativas y tiendas — `recursos/design/app-icons/`

Por si más adelante se empaqueta la PWA (Capacitor, TWA, Tauri…) o se publica en tiendas.

| Carpeta | Contenido |
| --- | --- |
| `ios/icon-{20,29,40,58,60,76,80,87,120,152,167,180,1024}.png` | Todos los tamaños de `AppIcon`, opacos y sin esquinas. El de 1024 es el de App Store |
| `android/mipmap-{mdpi…xxxhdpi}/` | `ic_launcher.png`, `ic_launcher_round.png`, y el **icono adaptable**: `ic_launcher_foreground.png` (el logotipo dentro de los 66 dp centrales de un lienzo de 108 dp) más `ic_launcher_background.png` |
| `android/drawable-*/ic_stat_notification.png` | Icono de la barra de estado de las notificaciones (silueta) |
| `android/playstore-512.png` | Icono de Google Play |
| `macos/icon.icns` y `macos/icon.iconset/` | Icono de macOS (16 a 1024) |
| `windows/icon.ico` | 16, 24, 32, 48, 64, 128 y 256 px |

## Notas

- Con el modo oscuro el icono no cambia: lleva su propio fondo azul y se ve igual de bien sobre claro y oscuro. Solo las pantallas de arranque cambian de fondo.
- `theme_color` del manifiesto y de `app.html` siguen siendo el crema/marrón oscuro del tema Latte. **Si se adopta el azul de la marca como color de acento de la aplicación**, hay que cambiar también `tokens/tokens.json` y esos colores (ver «Colores de la marca» en `screen-layouts.md`, 8.0).
- Las **cápsulas naranjas** del logotipo recuerdan mucho a las de Nespresso. Si el producto se publica fuera de la empresa, conviene revisar que no haya conflicto de marca.
