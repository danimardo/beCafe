import type { Expresion, MomentoId, PoseRiv } from './momentos';

export type IconoBienvenida = 'hand' | 'package' | 'coffee' | 'shopping-bag' | 'piggy-bank' | 'droplets' | 'award' | 'sparkles';

export interface EscenaBienvenida {
	readonly id: string;
	readonly momento: MomentoId;
	readonly poseRiv: PoseRiv;
	readonly expresion: Expresion;
	readonly titulo: string;
	readonly texto: string;
	readonly textoVoz: string;
	readonly icono: IconoBienvenida;
}

/**
 * Las 8 escenas de la historia animada de bienvenida de Capsulito (`intro_01` a `intro_08`, RF-185, CA-185).
 * Fuente única para el diálogo interactivo `<Bienvenida>`, para la guía estática sin JavaScript de `/ayuda`
 * y para el laboratorio `/ayuda/capsulito`.
 */
export const ESCENAS_BIENVENIDA: readonly EscenaBienvenida[] = [
	{
		id: 'intro_01',
		momento: 'bienvenida-hola',
		poseRiv: 'saludo',
		expresion: 'feliz',
		titulo: '¡Hola! Soy Capsulito',
		texto: 'Soy tu compañero de café en el departamento. Te ayudo a saber qué cápsulas quedan y cómo va nuestra hucha común.',
		textoVoz: '[excited] ¡Hola! [chuckles] Soy Capsulito, tu compañero de café en el departamento.',
		icono: 'hand',
	},
	{
		id: 'intro_02',
		momento: 'bienvenida-reservas',
		poseRiv: 'alerta',
		expresion: 'sorprendido',
		titulo: 'Vigilamos las reservas',
		texto: 'Sin cápsulas no hay servicio. Cada tarjeta muestra cuántas unidades quedan y avisa cuando un tipo entra en stock bajo.',
		textoVoz: '[surprised] ¡Sin cápsulas no hay servicio! [excited] ¡Vamos a vigilar las reservas!',
		icono: 'package',
	},
	{
		id: 'intro_03',
		momento: 'bienvenida-cafe',
		poseRiv: 'cafetera',
		expresion: 'feliz',
		titulo: 'Un toque, un café',
		texto:
			'Toca la cápsula que te pones y queda apuntada al instante. ¿Invitas a alguien? Usa el botón de invitado. ¿Te equivocaste? Pulsa «Deshacer».',
		textoVoz: '[cheerful] Elige tu cápsula y registra el consumo. Comprueba que quede confirmado.',
		icono: 'coffee',
	},
	{
		id: 'intro_04',
		momento: 'bienvenida-compras',
		poseRiv: 'hucha',
		expresion: 'orgulloso',
		titulo: 'Compras que suman',
		texto: 'Cuando alguien trae cajas nuevas, registra la compra para sumar las existencias y actualizar el coste medio.',
		textoVoz: '[cheerful] Cuando lleguen nuevas cápsulas, registra la compra para actualizar las existencias.',
		icono: 'shopping-bag',
	},
	{
		id: 'intro_05',
		momento: 'bienvenida-hucha',
		poseRiv: 'hucha',
		expresion: 'feliz',
		titulo: 'La hucha común',
		texto: 'Cada café descuenta su precio de tu saldo. Cuando estés en negativo, haz una aportación a la hucha y regístrala.',
		textoVoz: '[excited] Cada café cuenta. [chuckles] ¡Y las cuentas también! Consulta tus aportaciones y tu saldo.',
		icono: 'piggy-bank',
	},
	{
		id: 'intro_06',
		momento: 'bienvenida-agua',
		poseRiv: 'cafetera',
		expresion: 'feliz',
		titulo: '¿Rellenas el agua?',
		texto: 'Si rellenas el depósito de la cafetera, pulsa «He rellenado el agua». No mueve dinero, pero queda reconocido.',
		textoVoz: '[cheerful] Si rellenas el depósito, registra el agua en la aplicación.',
		icono: 'droplets',
	},
	{
		id: 'intro_07',
		momento: 'bienvenida-aguador',
		poseRiv: 'celebrando',
		expresion: 'orgulloso',
		titulo: 'El aguador del mes',
		texto: 'El día 1 de cada mes damos las gracias a quien más veces rellenó el depósito el mes anterior.',
		textoVoz: '[excited] También damos las gracias al aguador del mes. [laughs] ¡Ovación para quien nos salva de la sequía!',
		icono: 'award',
	},
	{
		id: 'intro_08',
		momento: 'bienvenida-cierre',
		poseRiv: 'saludo',
		expresion: 'feliz',
		titulo: '¡A por el café!',
		texto: 'Cápsulas controladas, cuentas claras y agua lista. Puedes volver a ver esta guía o apagarme cuando quieras desde Perfil.',
		textoVoz: '[excited] Cápsulas controladas, cuentas claras... [cheerful] ¡a por el café!',
		icono: 'sparkles',
	},
] as const;

export const PASOS_BIENVENIDA = ESCENAS_BIENVENIDA;
