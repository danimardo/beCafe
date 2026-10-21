"""Genera las ilustraciones de la guía fácil de la aplicación de las cápsulas.

Uso: python generar-imagenes.py  ->  crea la carpeta img/ con los PNG.
Todos los dibujos son aproximados: la aplicación real puede ser distinta.
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch, Polygon, Rectangle

plt.rcParams["font.family"] = "Arial"

SALIDA = Path(__file__).parent / "img"
SALIDA.mkdir(exist_ok=True)

# Paleta con buen contraste sobre blanco
TINTA = "#1A1A1A"
GRIS = "#5F5F5F"
FONDO = "#F4F1EC"
MARRON = "#6B3E26"
AZUL = "#1F5FA8"
VERDE = "#1E7B3C"
ROJO = "#B3261E"
NARANJA = "#B85C00"
CAPSULAS = [("Ristretto", "#2B2B2B"), ("Lungo", "#1F5FA8"), ("Descafeinado", "#B3261E"), ("Vainilla", "#C9A227")]

AVISO = "Dibujo aproximado. La aplicación real puede ser distinta."


def lienzo(ancho, alto):
    fig = plt.figure(figsize=(ancho, alto), dpi=200)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, ancho * 10)
    ax.set_ylim(0, alto * 10)
    ax.axis("off")
    return fig, ax


def guardar(fig, nombre):
    fig.savefig(SALIDA / nombre, dpi=200, facecolor="white")
    plt.close(fig)


def caja(ax, x, y, w, h, color="white", borde=TINTA, radio=1.5, grosor=2.5):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0,rounding_size={radio}",
                                facecolor=color, edgecolor=borde, linewidth=grosor))


def flecha(ax, x1, y1, x2, y2, color=TINTA):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>", mutation_scale=28,
                                 linewidth=3, color=color))


def capsula(ax, x, y, r, color):
    """Cápsula vista de frente: círculo con borde y brillo."""
    ax.add_patch(Circle((x, y), r, facecolor=color, edgecolor=TINTA, linewidth=2))
    ax.add_patch(Circle((x, y), r * 0.55, facecolor="none", edgecolor="white", linewidth=1.5, alpha=0.6))


def taza(ax, x, y, s=1.0):
    ax.add_patch(Polygon([(x - 3 * s, y + 3 * s), (x + 3 * s, y + 3 * s), (x + 2.3 * s, y - 2.5 * s),
                          (x - 2.3 * s, y - 2.5 * s)], closed=True, facecolor="white", edgecolor=TINTA, linewidth=2.5))
    ax.add_patch(Circle((x + 3.3 * s, y + 0.6 * s), 1.3 * s, facecolor="none", edgecolor=TINTA, linewidth=2.5))
    ax.add_patch(Rectangle((x - 2.8 * s, y + 2.2 * s), 5.6 * s, 0.7 * s, facecolor=MARRON, edgecolor="none"))
    for dx in (-1.2, 0, 1.2):
        ax.plot([x + dx * s, x + (dx + 0.4) * s, x + dx * s], [y + 3.6 * s, y + 4.6 * s, y + 5.6 * s],
                color=GRIS, linewidth=2)


def hucha(ax, x, y, s=1.0):
    ax.add_patch(Circle((x, y), 4 * s, facecolor="#F2B8C6", edgecolor=TINTA, linewidth=2.5))
    ax.add_patch(Circle((x + 4 * s, y + 0.3 * s), 1.2 * s, facecolor="#F2B8C6", edgecolor=TINTA, linewidth=2.5))
    ax.add_patch(Rectangle((x - 1.2 * s, y + 3.4 * s), 2.4 * s, 0.5 * s, facecolor=TINTA))
    for dx in (-2.2, 2):
        ax.add_patch(Rectangle((x + dx * s, y - 5 * s), 1 * s, 1.4 * s, facecolor="#F2B8C6", edgecolor=TINTA, linewidth=2))
    ax.add_patch(Circle((x + 1.8 * s, y + 1.5 * s), 0.35 * s, facecolor=TINTA))


def carrito(ax, x, y, s=1.0):
    ax.plot([x - 4.5 * s, x - 3.2 * s, x - 2 * s, x + 3.5 * s, x + 4.3 * s, x - 2.6 * s],
            [y + 3 * s, y + 3 * s, y - 1.5 * s, y - 1.5 * s, y + 2 * s, y + 2 * s], color=TINTA, linewidth=3)
    ax.add_patch(Circle((x - 1.2 * s, y - 2.8 * s), 0.8 * s, facecolor=TINTA))
    ax.add_patch(Circle((x + 2.7 * s, y - 2.8 * s), 0.8 * s, facecolor=TINTA))


def movil(ax, x, y, w=26, h=50, titulo=None):
    caja(ax, x, y, w, h, color=TINTA, borde=TINTA, radio=3)
    caja(ax, x + 1.2, y + 3, w - 2.4, h - 6, color="white", borde="white", radio=1)
    ax.add_patch(Rectangle((x + w / 2 - 3, y + h - 2), 6, 0.6, facecolor=GRIS))
    if titulo:
        ax.add_patch(Rectangle((x + 1.2, y + h - 8), w - 2.4, 5, facecolor=MARRON))
        ax.text(x + w / 2, y + h - 5.5, titulo, ha="center", va="center", fontsize=18.2, color="white", weight="bold")


def nota_aproximado(ax, x, y):
    ax.text(x, y, AVISO, ha="center", va="center", fontsize=16.8, color=GRIS, style="normal")


# 1. Portada
fig, ax = lienzo(8, 4)
taza(ax, 25, 18, 2.2)
for i, (_, c) in enumerate(CAPSULAS):
    capsula(ax, 48 + i * 8, 20, 3.2, c)
ax.text(60, 30, "Cada café cuenta", ha="center", fontsize=28.0, color=TINTA, weight="bold")
guardar(fig, "01-portada.png")

# 2. Para qué sirve
fig, ax = lienzo(9, 4.2)
textos = ["Saber cuántas\ncápsulas quedan", "Saber cuándo\nhay que comprar", "Repartir el dinero\nde forma justa"]
for i, t in enumerate(textos):
    cx = 15 + i * 30
    caja(ax, cx - 13, 4, 26, 34, color=FONDO, borde=FONDO)
    ax.text(cx, 34, str(i + 1), ha="center", va="center", fontsize=30.8, weight="bold", color=MARRON)
    if i == 0:
        for j, (_, c) in enumerate(CAPSULAS[:3]):
            capsula(ax, cx - 6 + j * 6, 22, 2.6, c)
    elif i == 1:
        carrito(ax, cx, 22, 1.4)
    else:
        hucha(ax, cx - 1, 22, 1.4)
    ax.text(cx, 9, t, ha="center", va="center", fontsize=19.6, color=TINTA, linespacing=1.4)
guardar(fig, "02-para-que-sirve.png")

# 3. Recorrido de un café
fig, ax = lienzo(10, 3.6)
pasos = ["Coges\nuna cápsula", "Abres\nla aplicación", "Tocas\nesa cápsula", "La aplicación\nresta 1 cápsula"]
for i, t in enumerate(pasos):
    cx = 12 + i * 25.5
    ax.add_patch(Circle((cx, 24), 7.5, facecolor=FONDO, edgecolor=MARRON, linewidth=3))
    ax.text(cx, 24, str(i + 1), ha="center", va="center", fontsize=36.4, weight="bold", color=MARRON)
    ax.text(cx, 8, t, ha="center", va="center", fontsize=19.6, color=TINTA, linespacing=1.4)
    if i < 3:
        flecha(ax, cx + 8.5, 24, cx + 17, 24, MARRON)
guardar(fig, "03-recorrido-cafe.png")


def pantalla_principal(ax, x, y, con_deshacer=False):
    movil(ax, x, y, titulo="Cápsulas")
    for i, (n, c) in enumerate(CAPSULAS):
        fila, col = divmod(i, 2)
        bx = x + 2.5 + col * 11
        by = y + 26 - fila * 15
        caja(ax, bx, by, 10, 13, color=FONDO, borde=GRIS, radio=1, grosor=1.5)
        capsula(ax, bx + 5, by + 8.5, 2.6, c)
        ax.text(bx + 5, by + 3.2, n, ha="center", va="center", fontsize=10 if len(n) > 9 else 12.5, color=TINTA, weight="bold")
    if con_deshacer:
        caja(ax, x + 2, y + 4.5, 22, 6.5, color=TINTA, borde=TINTA, radio=1)
        ax.text(x + 3.2, y + 7.75, "Café apuntado", ha="left", va="center", fontsize=11, color="white")
        caja(ax, x + 15.2, y + 5.5, 8, 4.5, color="#FFD54F", borde="#FFD54F", radio=0.8)
        ax.text(x + 19.2, y + 7.75, "Deshacer", ha="center", va="center", fontsize=10.5, color=TINTA, weight="bold")


# 4. Boceto pantalla principal
fig, ax = lienzo(6, 6.4)
pantalla_principal(ax, 17, 10)
ax.text(30, 4, AVISO, ha="center", fontsize=14.7, color=GRIS)
guardar(fig, "04-pantalla-principal.png")

# 5. Deshacer
fig, ax = lienzo(9, 6.4)
pantalla_principal(ax, 8, 10, con_deshacer=True)
ax.text(42, 46, "Tienes 5 segundos\npara tocar «Deshacer».", fontsize=21.0, color=TINTA, va="center", linespacing=1.5)
ax.text(42, 31, "¿Te das cuenta más tarde?\nTienes 15 minutos\npara cancelarlo tú.", fontsize=21.0, color=TINTA, va="center", linespacing=1.5)
ax.text(42, 16, "¿Más de 15 minutos?\nPídeselo a un\nadministrador.", fontsize=21.0, color=TINTA, va="center", linespacing=1.5)
flecha(ax, 41, 44, 32, 18, NARANJA)
ax.text(45, 4, AVISO, ha="center", fontsize=14.7, color=GRIS)
guardar(fig, "05-deshacer.png")

# 6. Sin cobertura
fig, ax = lienzo(10, 4.4)
movil(ax, 4, 4, w=18, h=34)
caja(ax, 6.5, 18, 13, 7, color="#FFF3CD", borde=NARANJA, radio=1, grosor=2)
ax.text(13, 21.5, "Pendiente\nde enviar", ha="center", va="center", fontsize=15.4, color=TINTA, linespacing=1.2)
ax.text(13, 41, "Sin internet", ha="center", fontsize=19.6, weight="bold", color=TINTA)
flecha(ax, 26, 21, 46, 21, GRIS)
ax.text(36, 27, "Vuelve internet", ha="center", fontsize=18.2, color=TINTA)
movil(ax, 50, 4, w=18, h=34)
caja(ax, 52.5, 18, 13, 7, color="#D4EDDA", borde=VERDE, radio=1, grosor=2)
ax.text(59, 21.5, "Enviado", ha="center", va="center", fontsize=16.8, color=TINTA)
ax.text(59, 41, "Se envía solo", ha="center", fontsize=19.6, weight="bold", color=TINTA)
ax.text(84, 26, "No borres\nlos datos\ndel navegador\nmientras haya\ncafés pendientes.", ha="center", va="center",
        fontsize=17.5, color=ROJO, weight="bold", linespacing=1.4)
guardar(fig, "06-sin-cobertura.png")

# 7. La hucha
fig, ax = lienzo(10, 4.4)
hucha(ax, 50, 22, 2.2)
ax.text(50, 4, "La hucha", ha="center", fontsize=21.0, weight="bold", color=TINTA)
flecha(ax, 16, 22, 36, 22, VERDE)
ax.text(16, 32, "Entra dinero", ha="center", fontsize=21.0, weight="bold", color=VERDE)
ax.text(16, 12, "Cada persona mete\ndinero y lo apunta", ha="center", fontsize=18.2, color=TINTA, linespacing=1.4)
flecha(ax, 64, 22, 84, 22, ROJO)
ax.text(84, 32, "Sale dinero", ha="center", fontsize=21.0, weight="bold", color=ROJO)
ax.text(84, 12, "Para comprar\ncápsulas", ha="center", fontsize=18.2, color=TINTA, linespacing=1.4)
carrito(ax, 92, 22, 0.8)
guardar(fig, "07-hucha.png")

# 8. Gráfico de saldo de ejemplo
fig = plt.figure(figsize=(9, 4.6), dpi=200)
ax = fig.add_axes([0.1, 0.16, 0.86, 0.72])
pasos_saldo = [0, -0.4, -0.8, -1.2, -1.6, -2.0, -2.4, -2.8, -3.2, -3.6, -4.0, 1.0]
x = range(len(pasos_saldo))
colores = [VERDE if v >= 0 else ROJO for v in pasos_saldo]
ax.bar(x, pasos_saldo, color=colores, width=0.7)
ax.axhline(0, color=TINTA, linewidth=2)
ax.set_xticks(list(x))
ax.set_xticklabels(["Inicio"] + [f"Café\n{i}" for i in range(1, 11)] + ["Mete\n5 €"], fontsize=14.0)
ax.set_ylabel("Saldo de Luis (euros)", fontsize=16.8)
ax.set_ylim(-5, 2)
ax.tick_params(axis="y", labelsize=14)
for s in ("top", "right"):
    ax.spines[s].set_visible(False)
ax.text(10, -4.6, "Debe 4 €", ha="center", fontsize=16.8, color=ROJO, weight="bold")
ax.text(11, 1.35, "1 € a favor", ha="center", fontsize=16.8, color=VERDE, weight="bold")
fig.text(0.5, 0.95, "Ejemplo: cada café cuesta 40 céntimos", ha="center", fontsize=19.6, weight="bold", color=TINTA)
fig.savefig(SALIDA / "08-grafico-saldo.png", dpi=200, facecolor="white")
plt.close(fig)

# 9. Boceto pantalla de saldos
fig, ax = lienzo(6, 6.4)
movil(ax, 17, 10, titulo="Saldos")
for i, (n, v) in enumerate([("Ana", 2.10), ("Luis", -4.00), ("Marta", 0.35), ("Tú", -1.20)]):
    by = 46 - i * 8.5
    caja(ax, 19.5, by, 21, 7, color=FONDO, borde=FONDO, radio=1)
    ax.text(21, by + 3.5, n, va="center", fontsize=16.8, color=TINTA, weight="bold")
    texto = f"{v:+.2f} €".replace(".", ",").replace("-", "−")
    ax.text(39, by + 3.5, texto, va="center", ha="right", fontsize=16.8, weight="bold", color=VERDE if v >= 0 else ROJO)
ax.text(30, 15, "Hucha: 23,50 €", ha="center", fontsize=15.4, color=TINTA)
ax.text(30, 4, AVISO, ha="center", fontsize=14.7, color=GRIS)
guardar(fig, "09-pantalla-saldos.png")

# 10. Notificaciones
fig, ax = lienzo(9, 6.4)
movil(ax, 6, 10)
avisos = [("Quedan pocas cápsulas", "Ristretto: quedan 8."), ("Debes 5,20 €", "Mete dinero en la hucha."),
          ("Tu resumen del mes", "Tomaste 22 cafés.")]
for i, (t, d) in enumerate(avisos):
    by = 44 - i * 11
    caja(ax, 7.8, by, 22.4, 9.5, color=FONDO, borde=GRIS, radio=1, grosor=1.5)
    ax.text(9, by + 6.3, t, fontsize=11.5, weight="bold", color=TINTA)
    ax.text(9, by + 2.6, d, fontsize=12.6, color=TINTA)
ax.text(42, 46, "Avisos para todos:\nquedan pocas cápsulas.", fontsize=19.6, color=TINTA, va="center", linespacing=1.5)
ax.text(42, 32, "Avisos solo para ti:\nsi debes más de 5 €\ny el resumen del mes.", fontsize=19.6, color=TINTA, va="center", linespacing=1.5)
ax.text(42, 17, "Tú eliges qué avisos\nquieres en tu perfil.", fontsize=19.6, color=TINTA, va="center", linespacing=1.5)
ax.text(45, 4, AVISO, ha="center", fontsize=14.7, color=GRIS)
guardar(fig, "10-avisos.png")

# 11. Lo que ven los demás
fig, ax = lienzo(10, 5)
caja(ax, 3, 4, 45, 42, color="#E3F0FB", borde=AZUL)
ax.text(25.5, 41, "Lo ven todos", ha="center", fontsize=22.4, weight="bold", color=AZUL)
for i, t in enumerate(["El saldo de cada persona", "El dinero que mete cada uno", "Las compras", "Los cafés de todo\nel departamento juntos"]):
    ax.text(7, 33 - i * 7.5, "•  " + t, fontsize=18.2, color=TINTA, va="center", linespacing=1.3)
caja(ax, 52, 4, 45, 42, color="#FDF1E3", borde=NARANJA)
ax.text(74.5, 41, "Solo tú y los\nadministradores", ha="center", fontsize=22.4, weight="bold", color=NARANJA, va="center", linespacing=1.2)
for i, t in enumerate(["Tus cafés uno a uno", "Tus estadísticas:\ncuántos cafés tomas\ny de qué tipo"]):
    ax.text(56, 29 - i * 10, "•  " + t, fontsize=18.2, color=TINTA, va="center", linespacing=1.3)
guardar(fig, "11-quien-ve-que.png")

# 12. Reparto
fig, ax = lienzo(10, 4.6)
hucha(ax, 12, 24, 1.6)
ax.text(12, 8, "Faltan 7 €", ha="center", fontsize=22.4, weight="bold", color=ROJO)
flecha(ax, 24, 24, 36, 24, TINTA)
for i in range(7):
    cx = 42 + i * 8
    ax.add_patch(Circle((cx, 30), 2.4, facecolor=FONDO, edgecolor=TINTA, linewidth=2))
    ax.add_patch(FancyBboxPatch((cx - 3, 21), 6, 5, boxstyle="round,pad=0,rounding_size=2",
                                facecolor=FONDO, edgecolor=TINTA, linewidth=2))
    ax.text(cx, 15, "1 €", ha="center", fontsize=18.2, weight="bold", color=TINTA)
ax.text(66, 6, "Somos 7 personas: cada una paga 1 €", ha="center", fontsize=19.6, color=TINTA)
guardar(fig, "12-reparto.png")

print("Imágenes creadas en", SALIDA)
