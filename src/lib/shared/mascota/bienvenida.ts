import type { Expresion, MomentoId, PoseRiv } from './momentos';

export type IconoBienvenida = 'hand' | 'package' | 'coffee' | 'shopping-bag' | 'piggy-bank' | 'droplets' | 'award' | 'sparkles' | 'wallet';

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
 * Las 9 escenas de la historia animada de bienvenida de Capsulito (`intro_01` a `intro_09`, RF-185, RF-247, CA-185).
 * La escena `intro_09` («el dinero») va en quinto lugar: conserva su identificador porque la locución ya publicada de cada escena no cambia.
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
		textoVoz:
			'[excited] ¡Hola! [chuckles] Soy Capsulito. Soy tu compañero de café en el departamento. Te ayudo a saber qué cápsulas quedan y cómo va nuestra hucha común.',
		icono: 'hand',
	},
	{
		id: 'intro_02',
		momento: 'bienvenida-reservas',
		poseRiv: 'alerta',
		expresion: 'sorprendido',
		titulo: 'Vigilamos las reservas',
		texto: 'Sin cápsulas no hay servicio. Cada tarjeta muestra cuántas unidades quedan y avisa cuando un tipo entra en stock bajo.',
		textoVoz:
			'[surprised] Sin cápsulas no hay servicio. [cheerful] Cada tarjeta muestra cuántas unidades quedan y avisa cuando un tipo entra en stock bajo.',
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
		textoVoz:
			'[cheerful] Toca la cápsula que te pones y queda apuntada al instante. ¿Invitas a alguien? Usa el botón de invitado. ¿Te equivocaste? Pulsa «Deshacer».',
		icono: 'coffee',
	},
	{
		id: 'intro_04',
		momento: 'bienvenida-compras',
		poseRiv: 'hucha',
		expresion: 'orgulloso',
		titulo: 'Compras que suman',
		texto: 'Cuando alguien trae cajas nuevas, registra la compra para sumar las existencias y actualizar el coste medio.',
		textoVoz: '[cheerful] Cuando alguien trae cajas nuevas, registra la compra para sumar las existencias y actualizar el coste medio.',
		icono: 'shopping-bag',
	},
	{
		id: 'intro_09',
		momento: 'bienvenida-dinero',
		poseRiv: 'hucha',
		expresion: 'feliz',
		titulo: 'Así va el dinero',
		texto:
			'La hucha común paga las cápsulas. Tú pones dinero con una aportación y cada café descuenta de tu saldo lo que cuesta. De vez en cuando, los administradores cuentan la caja para que todo cuadre.',
		textoVoz:
			'[cheerful] La hucha común paga las cápsulas. [excited] Tú pones dinero con una aportación y cada café descuenta de tu saldo lo que cuesta. [cheerful] De vez en cuando, los administradores cuentan la caja para que todo cuadre.',
		icono: 'wallet',
	},
	{
		id: 'intro_05',
		momento: 'bienvenida-hucha',
		poseRiv: 'hucha',
		expresion: 'feliz',
		titulo: 'La hucha común',
		texto: 'Cada café descuenta su precio de tu saldo. Cuando estés en negativo, haz una aportación a la hucha y regístrala.',
		textoVoz:
			'[excited] Cada café descuenta su precio de tu saldo. [cheerful] Cuando estés en negativo, haz una aportación a la hucha y regístrala.',
		icono: 'piggy-bank',
	},
	{
		id: 'intro_06',
		momento: 'bienvenida-agua',
		poseRiv: 'cafetera',
		expresion: 'feliz',
		titulo: '¿Rellenas el agua?',
		texto: 'Si rellenas el depósito de la cafetera, pulsa «He rellenado el agua». No mueve dinero, pero queda reconocido.',
		textoVoz: '[cheerful] Si rellenas el depósito de la cafetera, pulsa «He rellenado el agua». No mueve dinero, pero queda reconocido.',
		icono: 'droplets',
	},
	{
		id: 'intro_07',
		momento: 'bienvenida-aguador',
		poseRiv: 'celebrando',
		expresion: 'orgulloso',
		titulo: 'El aguador del mes',
		texto: 'El día 1 de cada mes damos las gracias a quien más veces rellenó el depósito el mes anterior.',
		textoVoz:
			'[excited] El día 1 de cada mes damos las gracias a quien más veces rellenó el depósito el mes anterior. [laughs] ¡Ovación para el aguador!',
		icono: 'award',
	},
	{
		id: 'intro_08',
		momento: 'bienvenida-cierre',
		poseRiv: 'saludo',
		expresion: 'feliz',
		titulo: '¡A por el café!',
		texto: 'Cápsulas controladas, cuentas claras y agua lista. Puedes volver a ver esta guía o apagarme cuando quieras desde Perfil.',
		textoVoz:
			'[excited] Cápsulas controladas, cuentas claras y agua lista. [cheerful] Puedes volver a ver esta guía o apagarme cuando quieras desde Perfil.',
		icono: 'sparkles',
	},
] as const;

export const PASOS_BIENVENIDA = ESCENAS_BIENVENIDA;
