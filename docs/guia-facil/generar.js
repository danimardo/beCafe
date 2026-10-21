// Genera la guía en lectura fácil de la aplicación de las cápsulas.
// Uso: python generar-imagenes.py && node generar.js  ->  guia-facil-capsulas.docx
// Fuente: historias.md v0.3.0 (20-10-2026). Pautas: UNE 153101:2018 EX (lectura fácil).

const fs = require("fs");
const path = require("path");
const {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, ImageRun, LevelFormat, Packer,
  PageBreak, PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} = require("docx");

const FUENTE = "Arial";
const MARRON = "6B3E26";
const IMG = path.join(__dirname, "img");
const ANCHO_MAX = 560; // píxeles a 96 ppp, dentro del ancho útil de A4

// ---------- Utilidades ----------

function dimensionesPng(fichero) {
  const b = fs.readFileSync(fichero);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), datos: b };
}

function texto(t, opciones = {}) {
  // Permite **negrita** dentro del texto.
  return t.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((trozo) =>
    trozo.startsWith("**")
      ? new TextRun({ text: trozo.slice(2, -2), bold: true, ...opciones })
      : new TextRun({ text: trozo, ...opciones }));
}

const p = (t, extra = {}) => new Paragraph({ children: texto(t), ...extra });
const titulo = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], keepNext: true, pageBreakBefore: false });
const subtitulo = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)], keepNext: true });
const punto = (t) => new Paragraph({ children: texto(t), numbering: { reference: "puntos", level: 0 } });
const salto = () => new Paragraph({ children: [new PageBreak()] });

function imagen(nombre, alt, ancho = ANCHO_MAX) {
  const { w, h, datos } = dimensionesPng(path.join(IMG, nombre));
  const anchoFinal = Math.min(ancho, ANCHO_MAX);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 240 },
    children: [new ImageRun({
      type: "png",
      data: datos,
      transformation: { width: anchoFinal, height: Math.round((anchoFinal * h) / w) },
      altText: { title: alt, description: alt, name: nombre },
    })],
  });
}

function recuadro(lineas, color = "FFF3CD", borde = "B85C00") {
  const b = { style: BorderStyle.SINGLE, size: 12, color: borde, space: 8 };
  return lineas.map((t, i) => new Paragraph({
    children: texto(t),
    shading: { type: ShadingType.CLEAR, color: "auto", fill: color },
    border: {
      left: b, right: b,
      ...(i === 0 ? { top: b } : {}),
      ...(i === lineas.length - 1 ? { bottom: b } : {}),
    },
    indent: { left: 200, right: 200 },
    spacing: { after: i === lineas.length - 1 ? 280 : 0 },
    keepLines: true,
    keepNext: i < lineas.length - 1, // el recuadro no se parte entre páginas
  }));
}

function tablaPalabras(filas) {
  const anchos = [2600, 6426];
  const borde = { style: BorderStyle.SINGLE, size: 6, color: "999999" };
  const bordes = { top: borde, bottom: borde, left: borde, right: borde };
  const celda = (t, i, cabecera) => new TableCell({
    width: { size: anchos[i], type: WidthType.DXA },
    borders: bordes,
    shading: cabecera ? { type: ShadingType.CLEAR, color: "auto", fill: "F4F1EC" } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: cabecera || i === 0 })], spacing: { after: 0 } })],
  });
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: anchos,
    rows: [["Palabra", "Qué quiere decir"], ...filas].map((f, r) =>
      new TableRow({ cantSplit: true, tableHeader: r === 0, children: f.map((t, i) => celda(t, i, r === 0)) })),
  });
}

// ---------- Contenido ----------

const portada = [
  new Paragraph({ spacing: { before: 1800, after: 300 }, alignment: AlignmentType.LEFT, children: [new TextRun({ text: "La aplicación de las cápsulas", bold: true, size: 64, color: MARRON })] }),
  new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: "Guía fácil para el departamento de informática", size: 36 })] }),
  imagen("01-portada.png", "Una taza de café y 4 cápsulas de colores."),
  ...recuadro([
    "**La aplicación todavía se está preparando.**",
    "Esta guía explica cómo funcionará.",
    "Los dibujos son aproximados.",
    "Los precios y los nombres son ejemplos.",
  ]),
  salto(),
];

const indice = [
  titulo("Qué hay en esta guía"),
  ...[
    "1. Para qué sirve la aplicación",
    "2. Cómo entrar",
    "3. Hacerte un café",
    "4. Si te equivocas",
    "5. Si invitas a alguien",
    "6. Si no tienes internet",
    "7. La hucha y tu saldo",
    "8. Comprar cápsulas",
    "9. Los avisos",
    "10. Lo que ven los demás",
    "11. Lo que hacen los administradores",
    "12. Palabras importantes",
    "13. A quién preguntar",
  ].map((t) => p(t, { spacing: { after: 80 } })),
  salto(),
];

const secciones = [
  titulo("1. Para qué sirve la aplicación"),
  p("En el departamento tenemos una cafetera de cápsulas."),
  p("Las cápsulas se compran con el dinero de todos."),
  p("La aplicación de las cápsulas nos ayuda en 3 cosas:"),
  imagen("02-para-que-sirve.png", "3 dibujos: cápsulas para saber cuántas quedan, un carro de la compra para saber cuándo comprar y una hucha para repartir el dinero."),
  p("**1.** Saber cuántas cápsulas quedan."),
  p("**2.** Saber cuándo hay que comprar más."),
  p("**3.** Repartir el dinero de forma justa."),
  p("Repartir de forma justa quiere decir esto:"),
  p("**cada persona paga los cafés que toma.**"),
  p("La aplicación funciona en el móvil."),

  titulo("2. Cómo entrar"),
  p("Un administrador te da de alta en la aplicación."),
  p("Después te pasa un enlace."),
  p("Abres el enlace y eliges tu contraseña."),
  p("La contraseña debe tener **15 letras, números o signos como mínimo.**"),
  p("Un consejo: usa 4 o 5 palabras seguidas que recuerdes bien."),
  p("Solo pones la contraseña la primera vez."),
  p("Después, la aplicación recuerda que eres tú."),
  p("Si pasas 3 meses sin usarla, te pedirá la contraseña otra vez."),
  p("Puedes poner la aplicación en la pantalla de inicio de tu móvil."),
  p("Así la abres con 1 solo toque, como cualquier aplicación."),
  p("¿Has olvidado la contraseña?"),
  p("Pide a un administrador un enlace nuevo."),
  ...recuadro([
    "**Cuida tu móvil.**",
    "Si otra persona usa tu móvil, puede apuntar cafés a tu nombre.",
    "Usa el bloqueo de pantalla.",
  ]),

  titulo("3. Hacerte un café"),
  imagen("03-recorrido-cafe.png", "4 pasos: 1, coges una cápsula. 2, abres la aplicación. 3, tocas esa cápsula. 4, la aplicación resta 1 cápsula."),
  p("**Paso 1.** Coges una cápsula."),
  p("**Paso 2.** Abres la aplicación."),
  p("Ves todas las cápsulas con su foto, su color y su nombre."),
  p("**Paso 3.** Tocas la cápsula que vas a usar."),
  p("Solo 1 toque. No hay que hacer nada más."),
  p("**Paso 4.** La aplicación resta 1 cápsula."),
  p("También apunta el precio de ese café en tu cuenta."),
  imagen("04-pantalla-principal.png", "Dibujo aproximado de la pantalla principal: 4 botones con cápsulas de colores y sus nombres: Ristretto, Lungo, Descafeinado y Vainilla.", 440),
  p("¿Usas 2 cápsulas para un café largo?"),
  p("Toca la cápsula 2 veces."),
  ...recuadro([
    "**Apunta siempre tu café.**",
    "Así sabemos cuántas cápsulas quedan.",
    "Y nadie paga tus cafés por ti.",
  ], "E3F0FB", "1F5FA8"),

  titulo("4. Si te equivocas"),
  p("Al tocar una cápsula aparece el botón **«Deshacer»**."),
  p("El botón está 5 segundos en la pantalla."),
  p("Si lo tocas, el café se cancela."),
  imagen("05-deshacer.png", "Dibujo aproximado: la pantalla muestra el mensaje «Café apuntado» con el botón «Deshacer». Al lado, las 3 formas de corregir un error."),
  p("¿Te das cuenta más tarde?"),
  p("Tienes **15 minutos** para cancelar el café tú mismo."),
  p("Lo cancelas desde tu historial."),
  p("Tienes que escribir por qué lo cancelas."),
  p("¿Han pasado más de 15 minutos?"),
  p("Pide a un administrador que lo cancele."),
  p("Lo cancelado no se borra del todo."),
  p("Se queda guardado con la marca «cancelado»."),
  p("Así todo está claro para todos."),

  titulo("5. Si invitas a alguien"),
  p("A veces invitas a un café a alguien de fuera del departamento."),
  p("Entonces apunta el café con la opción **«Para un invitado»**."),
  p("Ese café lo pagas tú."),
  p("Pero no cuenta como café tuyo en tus estadísticas."),
  p("No puedes apuntar cafés a nombre de otro compañero."),
  p("Cada persona apunta sus propios cafés."),

  titulo("6. Si no tienes internet"),
  p("Puedes apuntar tu café aunque el móvil no tenga internet."),
  p("El móvil guarda el café y pone **«Pendiente de enviar»**."),
  p("Cuando vuelve internet, el móvil lo envía solo."),
  imagen("06-sin-cobertura.png", "A la izquierda, un móvil sin internet con el mensaje «Pendiente de enviar». A la derecha, el mismo móvil con internet y el mensaje «Enviado»."),
  ...recuadro([
    "**Importante.**",
    "No borres los datos del navegador mientras haya cafés pendientes.",
    "Si los borras, esos cafés se pierden.",
  ], "FDECEA", "B3261E"),
  p("Para meter dinero o apuntar una compra **sí necesitas internet.**"),

  titulo("7. La hucha y tu saldo"),
  subtitulo("La hucha"),
  p("En el departamento hay una hucha con dinero de todos."),
  imagen("07-hucha.png", "Una hucha. Entra dinero: cada persona mete dinero y lo apunta. Sale dinero: para comprar cápsulas."),
  p("Cuando metes dinero en la hucha, lo apuntas en la aplicación."),
  p("Tú mismo apuntas el dinero que metes."),
  p("Confiamos en todos."),
  p("Un administrador cuenta la hucha de vez en cuando."),
  subtitulo("Tu saldo"),
  p("Tu saldo es la cuenta entre el dinero que metes y los cafés que tomas."),
  punto("Cada café que tomas **resta** de tu saldo."),
  punto("Cada vez que metes dinero, **suma** a tu saldo."),
  p("Si tu saldo tiene un signo menos (−), debes dinero."),
  p("Por ejemplo, −2 € quiere decir que debes 2 euros."),
  p("Si tu saldo no tiene signo menos, tienes dinero a favor."),
  subtitulo("Un ejemplo"),
  p("Luis empieza con 0 €."),
  p("Toma 10 cafés de 40 céntimos."),
  p("Ahora Luis debe 4 €. Su saldo es −4 €."),
  p("Luis mete 5 € en la hucha y lo apunta."),
  p("Ahora Luis tiene 1 € a favor. Su saldo es +1 €."),
  imagen("08-grafico-saldo.png", "Gráfico de barras del saldo de Luis. Con cada café, la barra roja baja 40 céntimos hasta llegar a menos 4 euros. Cuando mete 5 euros, la barra verde sube a 1 euro a favor."),
  subtitulo("El precio del café"),
  p("El precio depende de lo que costaron las cápsulas."),
  p("Cambia un poco cada vez que se compran cápsulas."),
  p("Si se compran más baratas, el café baja un poco."),
  p("Si se compran más caras, el café sube un poco."),
  subtitulo("Para pagar lo que debes"),
  p("Mete dinero en la hucha."),
  p("Después apúntalo en la aplicación."),
  imagen("09-pantalla-saldos.png", "Dibujo aproximado de la pantalla de saldos: Ana más 2,10 euros, Luis menos 4 euros, Marta más 0,35 euros y tú menos 1,20 euros. Abajo, el dinero que debería haber en la hucha.", 440),

  titulo("8. Comprar cápsulas"),
  p("Cuando quedan pocas cápsulas, la aplicación avisa."),
  p("Cualquier persona puede ir a comprar."),
  p("**El dinero para comprar sale de la hucha.**"),
  p("No pagues con tu propio dinero."),
  p("Cuando vuelvas, apunta la compra en la aplicación:"),
  punto("qué cápsulas has comprado,"),
  punto("cuántas cápsulas,"),
  punto("y cuánto han costado."),
  p("Si compras varios tipos, apunta cada tipo con su precio."),
  p("Puedes hacer una foto al ticket y añadirla a la compra."),
  p("A veces la compra cuesta más de lo que debería haber en la hucha."),
  p("Entonces la aplicación te avisa."),
  p("Revisa el precio. Si está bien, confirma la compra."),

  titulo("9. Los avisos"),
  p("La aplicación te avisa de 2 formas:"),
  punto("en la pantalla de la aplicación,"),
  punto("y con notificaciones en tu móvil."),
  imagen("10-avisos.png", "Dibujo aproximado de 3 notificaciones: «Quedan pocas cápsulas», «Debes 5,20 euros» y «Tu resumen del mes»."),
  p("Estos son los avisos:"),
  punto("**Quedan pocas cápsulas** de un tipo. Lo reciben todos."),
  punto("**Debes más de 5 €.** Te lo recuerda cada semana hasta que pagues."),
  punto("**Tu resumen del mes.** Llega el día 1 de cada mes."),
  p("En tu perfil eliges qué avisos quieres recibir."),
  p("El aviso de deuda no se puede quitar."),
  p("La primera vez, tu móvil te pide permiso para las notificaciones. Di que sí."),
  ...recuadro([
    "**Si tienes un iPhone:**",
    "pon la aplicación en la pantalla de inicio.",
    "Si no, no recibirás notificaciones.",
    "Dentro de la aplicación hay una ayuda que explica cómo hacerlo.",
  ], "E3F0FB", "1F5FA8"),

  titulo("10. Lo que ven los demás"),
  imagen("11-quien-ve-que.png", "Dos recuadros. Lo ven todos: el saldo de cada persona, el dinero que mete cada uno, las compras y los cafés de todo el departamento juntos. Solo tú y los administradores: tus cafés uno a uno y tus estadísticas."),
  subtitulo("Lo ven todos"),
  punto("El saldo de cada persona."),
  punto("El dinero que mete cada uno en la hucha."),
  punto("Las compras de cápsulas."),
  punto("Cuántos cafés se toman en todo el departamento."),
  subtitulo("Solo lo ves tú y los administradores"),
  punto("Tus cafés uno a uno."),
  punto("Tus estadísticas: cuántos cafés tomas y de qué tipo."),
  subtitulo("Tus datos"),
  p("La aplicación guarda los datos de todos."),
  p("También cuando alguien deja el departamento."),
  p("Así las cuentas siempre cuadran."),
  p("La primera vez que entres verás un texto sobre tus datos."),
  p("Léelo con calma."),

  titulo("11. Lo que hacen los administradores"),
  p("Los administradores son compañeros con permisos especiales."),
  p("También toman café y pagan igual que todos."),
  p("Algunas cosas que hacen cambian tu saldo."),
  p("Por eso te las explicamos aquí."),
  subtitulo("Cuentan el dinero de la hucha"),
  p("A veces falta dinero en la hucha."),
  p("Entonces la diferencia se reparte entre todos a partes iguales."),
  imagen("12-reparto.png", "Faltan 7 euros en la hucha. Somos 7 personas. Cada una paga 1 euro."),
  p("Por ejemplo: faltan 7 € y somos 7 personas."),
  p("Cada persona paga 1 €."),
  p("Si sobra dinero, se reparte a favor de todos."),
  subtitulo("Cuentan las cápsulas"),
  p("A veces faltan cápsulas."),
  p("Eso quiere decir que alguien no apuntó sus cafés."),
  p("El precio de esas cápsulas se reparte entre todos."),
  p("**Por eso es importante apuntar cada café.**"),
  subtitulo("Corrigen las compras mal apuntadas"),
  p("A veces alguien se equivoca al apuntar una compra."),
  p("Por ejemplo, pone 200 € en vez de 20 €."),
  p("Entonces el café se cobra más caro de lo que debe."),
  p("Un administrador cancela esa compra."),
  p("La aplicación devuelve sola lo que se cobró de más."),
  p("Verás esa devolución en tu saldo."),
  subtitulo("Cierran las cuentas de quien se va"),
  p("Cuando alguien deja el departamento, su saldo se queda a 0:"),
  punto("si debe dinero, lo paga;"),
  punto("si tiene dinero a favor, se le devuelve de la hucha."),
  p("Si no paga lo que debe, esa cantidad se reparte entre todos."),
  ...recuadro([
    "**Todo queda apuntado.**",
    "Todo esto aparece en el historial de la aplicación.",
    "Cualquier persona puede verlo.",
  ], "E3F0FB", "1F5FA8"),

  salto(),
  titulo("12. Palabras importantes"),
  tablaPalabras([
    ["Aplicación", "El programa del móvil que usamos para apuntar los cafés y el dinero."],
    ["Cápsula", "La pieza pequeña con café que se pone en la cafetera."],
    ["Hucha", "La caja del departamento donde metemos el dinero para comprar cápsulas."],
    ["Saldo", "Tu cuenta. Con signo menos (−), debes dinero. Sin signo menos, tienes dinero a favor."],
    ["Cancelar", "Quitar un café o una compra mal apuntados. Queda guardado con la marca «cancelado»."],
    ["Administrador", "Compañero con permisos especiales: da de alta a las personas y cuenta la hucha y las cápsulas."],
    ["Repartir", "Dividir una cantidad de dinero entre todos a partes iguales."],
    ["Notificación", "Un aviso que aparece en tu móvil."],
    ["Historial", "La lista de todo lo que se ha apuntado en la aplicación."],
    ["Invitado", "Una persona de fuera del departamento a la que invitas a un café."],
    ["Enlace", "Una dirección de internet. La abres y te lleva a una página."],
  ]),
  p(""),

  titulo("13. A quién preguntar"),
  p("¿Tienes dudas?"),
  p("¿Algo no funciona?"),
  p("**Pregunta a un administrador.**"),
  p("Te ayudará."),
  p(""),
  ...recuadro([
    "**Sobre esta guía**",
    "Esta guía sigue las pautas de lectura fácil.",
    "Todavía no la han revisado lectores del equipo.",
    "Si algo no se entiende, dilo. Así la mejoramos.",
    "Está hecha a partir del documento de la aplicación «historias.md», versión 0.3.0, del 20 de octubre de 2026.",
  ], "F4F1EC", "6B3E26"),
];

// ---------- Documento ----------

const documento = new Document({
  creator: "Departamento de informática",
  title: "La aplicación de las cápsulas. Guía fácil",
  description: "Guía en lectura fácil de la aplicación de las cápsulas",
  styles: {
    default: { document: { run: { font: FUENTE, size: 28 }, paragraph: { spacing: { line: 360, after: 140 } } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FUENTE, size: 44, bold: true, color: MARRON },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FUENTE, size: 32, bold: true, color: "1A1A1A" },
        paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [{ reference: "puntos", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 600, hanging: 360 } } } }] }],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1300, left: 1440, right: 1440 } } },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: ["Página ", PageNumber.CURRENT], size: 24, color: "5F5F5F" })] })] }),
    },
    children: [...portada, ...indice, ...secciones],
  }],
});

Packer.toBuffer(documento).then((buffer) => {
  const salida = path.join(__dirname, "..", "guia-facil-capsulas.docx");
  fs.writeFileSync(salida, buffer);
  console.log("Creado:", salida);
});
