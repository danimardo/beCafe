#!/usr/bin/env python3
"""Genera TODOS los iconos de beCafé (web, PWA, iOS, Android, macOS, Windows) a partir del logotipo de marca
`design/brand/becafe-logo-original.png` (cuadrado redondeado azul petróleo sobre fondo blanco, 1254×1254).
Requiere Pillow, numpy y scipy:  pip install pillow numpy scipy
Uso (desde la raíz del proyecto):  python3 scripts/generate-pwa-assets.py
Salidas: static/ (web y PWA), design/app-icons/ (iOS, Android, macOS, Windows, tiendas), design/pwa/splash-links.html.

Dos versiones del logotipo:
- COMPLETA (la del archivo de marca): hasta 192 px y en pantallas de arranque, tiendas y apps.
- SIMPLIFICADA («b» blanca con el aro de la taza, sin café ni cápsulas): para 16–48 px y la insignia de notificaciones,
  donde el detalle fotográfico se pierde."""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

SRC = "design/brand/becafe-logo-original.png"
OUT_ICONS = "design/app-icons"
WALL = {"claro": (245, 236, 225), "oscuro": (28, 23, 20)}


def squircle_master():
    """Recorta el cuadrado redondeado del archivo de marca y le da transparencia (sin la sombra ni el fondo blanco)."""
    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    inside = ndi.binary_fill_holes(((b - r) > 60) | (((r - b) > 80) & (r > 150)))
    lab, n = ndi.label(inside)
    inside = lab == (1 + int(np.argmax(ndi.sum(inside, lab, range(1, n + 1)))))
    ys, xs = np.where(inside)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    # Erosionar 2 px elimina el borde mezclado con el blanco; el desenfoque deja el canto suave.
    m = ndi.binary_erosion(inside, iterations=2).astype(np.uint8) * 255
    alpha = Image.fromarray(m).filter(ImageFilter.GaussianBlur(1.1))
    rgba = im.convert("RGBA")
    rgba.putalpha(alpha)
    rgba = rgba.crop(box)
    side = max(rgba.size)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(rgba, ((side - rgba.width) // 2, (side - rgba.height) // 2))
    white = (np.asarray(im).min(axis=2) > 185) & inside  # la «b» y el aro de la taza
    wl, wn = ndi.label(white)  # fuera los brillos sueltos de las cápsulas: solo piezas grandes
    areas = ndi.sum(white, wl, range(1, wn + 1))
    white = np.isin(wl, [i + 1 for i, v in enumerate(areas) if v > 8000])
    wmask = Image.fromarray((white * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)).crop(box)
    wsq = Image.new("L", (side, side), 0)
    wsq.paste(wmask, ((side - wmask.width) // 2, (side - wmask.height) // 2))
    return sq.resize((1024, 1024), Image.LANCZOS), wsq.resize((1024, 1024), Image.LANCZOS)


MASTER, WHITE_B = squircle_master()
_px = np.asarray(MASTER.convert("RGB"))
# Fondo: superficie suave (polinomio de grado 2) ajustada a los píxeles azules LIMPIOS del logotipo, lejos del borde, de la «b»
# y de las cápsulas. Se prolonga hacia fuera, así el logotipo pegado encima no deja canto visible.
_a = np.asarray(MASTER).astype(float)
_clean = (_a[..., 3] > 250) & ((_a[..., 2] - _a[..., 0]) > 70) & (_a[..., 2] > 90)
_clean &= ndi.binary_erosion(_a[..., 3] > 250, iterations=70) & ~ndi.binary_dilation(~_clean, iterations=14)
_yy, _xx = np.where(_clean)
_sel = np.random.default_rng(1).choice(len(_yy), size=min(60000, len(_yy)), replace=False)
_yy, _xx = _yy[_sel], _xx[_sel]


def _design(x, y):
    x, y = x / 1023.0, y / 1023.0
    return np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], axis=-1)


_coef = np.linalg.lstsq(_design(_xx.astype(float), _yy.astype(float)), _a[_yy, _xx, :3], rcond=None)[0]


def gradient(size, scale=1.0):
    """Fondo azul del logotipo para un lienzo de `size` px donde el logotipo ocupará `scale` de ancho, centrado."""
    g = (np.arange(size) + 0.5) / size
    u = (g - 0.5) / scale * 1023 + 511.5
    u = np.clip(u, 130, 890)  # fuera del cuadrado se repite el color del interior limpio (la prolongación del polinomio se desbocaría)
    X, Y = np.meshgrid(u, u)
    out = _design(X, Y) @ _coef
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).convert("RGBA")


def simplified():
    """Versión plana: degradado + «b» blanca, con la misma silueta redondeada."""
    base = gradient(1024)
    white = Image.new("RGBA", (1024, 1024), (255, 255, 255, 255))
    base.paste(white, (0, 0), WHITE_B)
    base.putalpha(MASTER.getchannel("A"))
    return base


SIMPLE = simplified()


def put(src, size):
    return src.resize((size, size), Image.LANCZOS)


def feathered(src):
    """Copia del logotipo con el borde difuminado, para que al pegarlo sobre el degradado no se vea el canto del cuadrado."""
    a = np.asarray(src.getchannel("A")) > 128
    a = ndi.binary_erosion(a, iterations=66)
    out = src.copy()
    out.putalpha(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(11)))
    return out


def full_bleed(size, scale, src=None):
    """Lienzo cuadrado y opaco: el logotipo a `scale` sobre el degradado (para iOS, maskable, adaptativos)."""
    src = feathered(src or MASTER) if scale < 1.04 else (src or MASTER)
    c = gradient(size, scale)
    s = int(size * scale)
    c.alpha_composite(put(src, s), ((size - s) // 2, (size - s) // 2))
    return c


def circle(im):
    k = 4  # máscara supermuestreada para un borde suave
    m = Image.new("L", (im.width * k, im.height * k), 0)
    ImageDraw.Draw(m).ellipse([0, 0, im.width * k - 1, im.height * k - 1], fill=255)
    m = m.resize(im.size, Image.LANCZOS)
    out = im.copy()
    out.putalpha(m)
    return out


def badge(px=96):
    """Insignia monocroma de notificaciones: solo canal alfa (la «b» con el aro de la taza)."""
    a = WHITE_B.resize((px, px), Image.LANCZOS)
    a = a.point(lambda v: 255 if v > 90 else 0).filter(ImageFilter.GaussianBlur(0.4))
    im = Image.new("RGBA", (px, px), (255, 255, 255, 0))
    im.putalpha(a)
    return im


def save(im, path, rgb=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    (im.convert("RGB") if rgb else im).save(path, optimize=True)


# ───────── WEB / PWA (static/) ─────────
save(put(SIMPLE, 16), "static/favicon-16.png")
save(put(SIMPLE, 32), "static/favicon-32.png")
save(put(SIMPLE, 48), "static/favicon-48.png")
put(SIMPLE, 256).save("static/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
save(put(MASTER, 192), "static/icon-192.png")
save(put(MASTER, 512), "static/icon-512.png")
save(full_bleed(512, 0.80), "static/icon-maskable-512.png")       # dentro de la zona segura (círculo del 80 %)
save(full_bleed(180, 1.10), "static/apple-touch-icon.png", rgb=True)  # iOS aplica su propia máscara: opaco y a sangre
save(badge(96), "static/badge-96.png")
save(put(full_bleed(300, 0.80), 150), "static/mstile-150.png")
save(put(MASTER, 256), "static/brand/becafe-mark.png")            # la usa el componente BrandMark
save(put(SIMPLE, 128), "static/brand/becafe-mark-simple.png")

# ───────── iOS (design/app-icons/ios): opacos, sin esquinas ─────────
for px in (20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024):
    save(full_bleed(px, 1.10) if px >= 120 else full_bleed(px, 1.10, SIMPLE), f"{OUT_ICONS}/ios/icon-{px}.png", rgb=True)

# ───────── Android (design/app-icons/android) ─────────
DENS = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
for d, k in DENS.items():
    launcher = int(48 * k)
    save(put(MASTER if launcher >= 96 else SIMPLE, launcher), f"{OUT_ICONS}/android/mipmap-{d}/ic_launcher.png")
    save(circle(full_bleed(launcher, 0.96, MASTER if launcher >= 96 else SIMPLE)), f"{OUT_ICONS}/android/mipmap-{d}/ic_launcher_round.png")
    fg = int(108 * k)  # icono adaptable: lienzo de 108 dp; el motivo debe caber en los 66 dp centrales
    f = Image.new("RGBA", (fg, fg), (0, 0, 0, 0))
    s = int(fg * 0.58)
    f.alpha_composite(put(feathered(MASTER), s), ((fg - s) // 2, (fg - s) // 2))
    save(f, f"{OUT_ICONS}/android/mipmap-{d}/ic_launcher_foreground.png")
    save(gradient(fg, 0.58), f"{OUT_ICONS}/android/mipmap-{d}/ic_launcher_background.png")
    save(badge(int(24 * k)), f"{OUT_ICONS}/android/drawable-{d}/ic_stat_notification.png")
save(put(MASTER, 512), f"{OUT_ICONS}/android/playstore-512.png")

# ───────── macOS (.icns + iconset) y Windows (.ico) ─────────
for px in (16, 32, 64, 128, 256, 512, 1024):
    save(put(MASTER if px >= 128 else SIMPLE, px), f"{OUT_ICONS}/macos/icon.iconset/icon_{px}.png")
os.makedirs(f"{OUT_ICONS}/windows", exist_ok=True)
MASTER.save(f"{OUT_ICONS}/macos/icon.icns", format="ICNS")
put(MASTER, 256).save(f"{OUT_ICONS}/windows/icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

# ───────── Pantallas de arranque de iOS ─────────
def splash(w, h, theme):
    im = Image.new("RGBA", (w, h), WALL[theme] + (255,))
    side = int(min(w, h) * 0.26)
    im.alpha_composite(put(MASTER, side), ((w - side) // 2, (h - side) // 2 - int(h * 0.02)))
    return im.convert("RGB")

DEVICES = [
    ("iphone-16-pro-max", 1320, 2868, 440, 956, 3),
    ("iphone-16-pro", 1206, 2622, 402, 874, 3),
    ("iphone-15-pro-max", 1290, 2796, 430, 932, 3),
    ("iphone-15-pro", 1179, 2556, 393, 852, 3),
    ("iphone-13", 1170, 2532, 390, 844, 3),
    ("iphone-13-mini", 1080, 2340, 360, 780, 3),
    ("iphone-11-pro-max", 1242, 2688, 414, 896, 3),
    ("iphone-11", 828, 1792, 414, 896, 2),
    ("iphone-se", 750, 1334, 375, 667, 2),
    ("ipad-10", 1620, 2160, 810, 1080, 2),
    ("ipad-air-11", 1668, 2388, 834, 1194, 2),
    ("ipad-pro-13", 2048, 2732, 1024, 1366, 2),
]
links = []
os.makedirs("static/splash", exist_ok=True)
for name, w, h, cw, ch, f in DEVICES:
    for theme in ("claro", "oscuro"):
        fn = f"splash/{name}-{theme}.png"
        splash(w, h, theme).save("static/" + fn, optimize=True)
        scheme = "light" if theme == "claro" else "dark"
        links.append(
            f'<link rel="apple-touch-startup-image" href="%sveltekit.assets%/{fn}" '
            f'media="(device-width: {cw}px) and (device-height: {ch}px) and (-webkit-device-pixel-ratio: {f}) and (orientation: portrait) and (prefers-color-scheme: {scheme})" />'
        )
open("design/pwa/splash-links.html", "w").write("\n".join(links) + "\n")
print("Iconos de beCafé generados (web, iOS, Android, macOS, Windows y arranque).")
