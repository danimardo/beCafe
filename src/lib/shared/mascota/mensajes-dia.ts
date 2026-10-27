// Mensajes del día de Capsulito (F15, RF-266, RF-267, RN-091). Una persona recibe uno al día, sin repetir hasta ver todos.
// Solo texto, válidos a cualquier hora, en forma neutra de género y sin datos de la persona. Único marcador: `{nombre}`.

export type MensajeDia = { readonly id: string; readonly texto: string };

export const MENSAJES_DIA: readonly MensajeDia[] = Object.freeze([
	{ id: 'dia_01', texto: '¡Hola, {nombre}! Hoy huele a lunes, aunque no lo sea. El café no se entera.' },
	{ id: 'dia_02', texto: 'Aquí sigo, de guardia junto a la cafetera. Tú tranquilo… o tranquila. Yo vigilo.' },
	{ id: 'dia_03', texto: '¿Un café? Venga, que hoy traes cara de necesitarlo.' },
	{ id: 'dia_04', texto: '{nombre}, te he guardado sitio. Bueno, aquí no hay sitios, pero queda bonito.' },
	{ id: 'dia_05', texto: 'Dicen que el café no quita el sueño. Yo digo que lo aplaza.' },
	{ id: 'dia_06', texto: '¡Buenas! Las cápsulas y yo hemos votado y hoy eres nuestra persona favorita.' },
	{ id: 'dia_07', texto: 'Si alguien te pregunta: la reunión podía haber sido un correo. Y un café.' },
	{ id: 'dia_08', texto: 'Hoy me siento productivo. He contado las cápsulas dos veces y salen las mismas.' },
	{ id: 'dia_09', texto: '¡Hola, {nombre}! ¿Sabes el chiste del café? Es muy cortito. Como el ristretto.' },
	{ id: 'dia_10', texto: 'La cafetera ha pitado. No sé si es una señal o que está caliente. Por si acaso, café.' },
	{ id: 'dia_11', texto: 'Buenas, {nombre}. Yo no digo nada, pero la cafetera lleva un rato mirándote.' },
	{ id: 'dia_12', texto: 'Hoy toca compilar el día. Si da error, se arregla con un café y un reinicio.' },
	{ id: 'dia_13', texto: 'He ordenado las cápsulas por color. Luego por sabor. Luego por simpatía. Ganó el Ristretto.' },
	{ id: 'dia_14', texto: '¡Eh, {nombre}! Dicen que lo bueno se hace esperar. El café, no: ese lo quiero ya.' },
	{ id: 'dia_15', texto: 'Hoy es un gran día para tomar decisiones importantes. La primera: ¿con leche o sin leche?' },
	{ id: 'dia_16', texto: 'Un café a tiempo vale más que cien correos a destiempo.' },
	{ id: 'dia_17', texto: '{nombre}, no es por presionar, pero la última cápsula del cajón te echa de menos.' },
	{ id: 'dia_18', texto: 'Mi plan de hoy: vigilar la cafetera, saludar a quien entre y no hacer nada más. Voy genial.' },
	{ id: 'dia_19', texto: 'Si el día se complica, recuerda: siempre queda otra cápsula.' },
	{ id: 'dia_20', texto: '¡Ey! Me han dicho que el café es mejor en compañía. Yo estoy aquí, para lo que haga falta.' },
	{ id: 'dia_21', texto: 'He soñado que me hacía cápsula de mayor. Fue un sueño muy realista.' },
	{ id: 'dia_22', texto: 'Hoy el café va a salir con carácter. Lo sé porque me lo ha dicho el vapor.' },
	{ id: 'dia_23', texto: '{nombre}, ¿has probado a apagarlo y volver a encenderlo? Me refiero al cerebro. Con café.' },
	{ id: 'dia_24', texto: 'Aviso a navegantes: la cafetera está a tope de moral y de agua. Aprovechad.' },
	{ id: 'dia_25', texto: 'He puesto en mi agenda: «tomar café». Y en la de mañana también. Soy muy organizado.' },
	{ id: 'dia_26', texto: 'No te agobies con lo pendiente. Lo pendiente espera; el café se enfría.' },
	{ id: 'dia_27', texto: '¡Buenas, {nombre}! Sé que tienes mil cosas que hacer. Con un café son novecientas noventa y nueve.' },
	{ id: 'dia_28', texto: 'Hoy me han preguntado cuántas cápsulas hay. He dicho «las justas». No sé si acerté.' },
	{ id: 'dia_29', texto: 'Los lunes no existen: es un invento del café para que le echemos más cuenta.' },
	{ id: 'dia_30', texto: '¿Cuántos cafés llevas hoy? No me lo digas. Lo digo por mí, que no quiero saberlo.' },
	{ id: 'dia_31', texto: '{nombre}, si hoy te sale todo regular, échale la culpa a Mercurio. Y tómate un café.' },
	{ id: 'dia_32', texto: 'Un consejo de Capsulito: nunca discutas con alguien que todavía no se ha tomado el café.' },
	{ id: 'dia_33', texto: 'Hoy he practicado mi cara de «sé de lo que hablo». Me sale cuando huelo a café recién hecho.' },
	{ id: 'dia_34', texto: 'Cada vez que alguien rellena el agua, una cápsula sonríe. Yo te lo cuento, que lo veo todo.' },
	{ id: 'dia_35', texto: '¡Hola, {nombre}! Hoy el departamento funciona a base de cafeína y buenas intenciones.' },
	{ id: 'dia_36', texto: 'Me han dicho que hay vida más allá del café. Estoy investigando. De momento, no la encuentro.' },
	{ id: 'dia_37', texto: 'Si necesitas un empujón, te lo doy: ¡venga, un cafetito y a por ello!' },
	{ id: 'dia_38', texto: 'Hoy me he levantado optimista. Es por el olor a café, que me da alas. Pequeñas, pero alas.' },
	{ id: 'dia_39', texto: '{nombre}, un día sin café es como un servidor sin reiniciar: se puede, pero da miedo.' },
	{ id: 'dia_40', texto: 'Última noticia: la cafetera está de buen humor. Aprovecha antes de que cambie de opinión.' },
]);

export const IDS_MENSAJES_DIA: readonly string[] = MENSAJES_DIA.map((mensaje) => mensaje.id);
