import { esquemaFechaMadrid, esquemaInstanteUtc, esquemaMes, type FechaMadrid, type InstanteUtc, type Mes } from './tipos';

// Meses y años de calendario en la zona `Europe/Madrid` (constitución V; plan F5 D8). Los límites son `[desde, hasta)` en UTC,
// así que el cambio de horario de marzo y octubre no desplaza ningún consumo de su mes.

const ZONA = 'Europe/Madrid';
const FORMATO = new Intl.DateTimeFormat('en-US', {
	timeZone: ZONA,
	hourCycle: 'h23',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
});

type PartesMadrid = { anio: number; mes: number; dia: number; hora: number; minuto: number; segundo: number };

/** Hora de pared de Madrid de un instante, en números. */
function partesMadrid(milisegundos: number): PartesMadrid {
	const valor = (tipo: Intl.DateTimeFormatPartTypes): number =>
		Number(FORMATO.formatToParts(new Date(milisegundos)).find((pieza) => pieza.type === tipo)?.value);
	return {
		anio: valor('year'),
		mes: valor('month'),
		dia: valor('day'),
		hora: valor('hour'),
		minuto: valor('minute'),
		segundo: valor('second'),
	};
}

/** Diferencia en milisegundos entre la hora de pared de Madrid y UTC en un instante. */
function desfaseMadrid(milisegundos: number): number {
	const p = partesMadrid(milisegundos);
	const paredComoUtc = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
	return paredComoUtc - Math.floor(milisegundos / 1000) * 1000;
}

/** Instante UTC de las 00:00 de Madrid de un día de calendario. Repite la corrección tras el desfase (cambio de horario). */
function medianocheMadrid(anio: number, mes: number, dia: number): number {
	const comoUtc = Date.UTC(anio, mes - 1, dia);
	const primera = comoUtc - desfaseMadrid(comoUtc);
	return comoUtc - desfaseMadrid(primera);
}

function aInstante(milisegundos: number): InstanteUtc {
	return esquemaInstanteUtc.parse(new Date(milisegundos).toISOString());
}

function anioYNumero(mes: Mes): { anio: number; numero: number } {
	return { anio: Number(mes.slice(0, 4)), numero: Number(mes.slice(5, 7)) };
}

/** Límites `[desde, hasta)` de un mes de Madrid. */
export function limitesDeMes(mes: Mes): { desde: InstanteUtc; hasta: InstanteUtc } {
	const { anio, numero } = anioYNumero(mes);
	const desde = medianocheMadrid(anio, numero, 1);
	const hasta = numero === 12 ? medianocheMadrid(anio + 1, 1, 1) : medianocheMadrid(anio, numero + 1, 1);
	return { desde: aInstante(desde), hasta: aInstante(hasta) };
}

/** Límites `[desde, hasta)` de un año natural de Madrid. */
export function limitesDeAnio(anio: number): { desde: InstanteUtc; hasta: InstanteUtc } {
	return {
		desde: aInstante(medianocheMadrid(anio, 1, 1)),
		hasta: aInstante(medianocheMadrid(anio + 1, 1, 1)),
	};
}

/** Mes de Madrid al que pertenece un instante. Las 23:59 del 31 de octubre son octubre; las 00:00 del 1 de noviembre, noviembre. */
export function mesDeInstante(instante: InstanteUtc): Mes {
	const { anio, mes } = partesMadrid(Date.parse(instante));
	return esquemaMes.parse(`${anio}-${String(mes).padStart(2, '0')}`);
}

/** Fecha de calendario de Madrid de un instante (`aaaa-mm-dd`). Las 23:30 UTC ya son el día siguiente en Madrid. */
export function fechaDeMadrid(instante: InstanteUtc): FechaMadrid {
	const { anio, mes, dia } = partesMadrid(Date.parse(instante));
	return esquemaFechaMadrid.parse(`${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`);
}

/** Meses de Madrid desde `desde` hasta `hasta`, ambos incluidos, en orden. */
export function mesesEntre(desde: Mes, hasta: Mes): Mes[] {
	const meses: Mes[] = [];
	let { anio, numero } = anioYNumero(desde);
	const fin = anioYNumero(hasta);
	while (anio < fin.anio || (anio === fin.anio && numero <= fin.numero)) {
		meses.push(esquemaMes.parse(`${anio}-${String(numero).padStart(2, '0')}`));
		if (numero === 12) {
			anio += 1;
			numero = 1;
		} else {
			numero += 1;
		}
	}
	return meses;
}
