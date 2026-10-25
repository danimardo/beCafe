// Tour guiado de Inicio (RF-204, plan F10 D8). Cada paso se ancla a un elemento con `data-tour="<ancla>"`.
// Un paso sin ancla en la pantalla se muestra centrado: el texto siempre explica el paso completo.

import type { Pose } from '../mascota/momentos';

export const ANCLAS_TOUR = ['capsula', 'invitado', 'deshacer', 'navegacion'] as const;
export type AnclaTour = (typeof ANCLAS_TOUR)[number];

/** `id` es la clave estable de la locución (`tour_01`…); `pose` es la del catálogo de Capsulito para ese paso (RF-227). */
export type PasoTour = { id: string; ancla: AnclaTour; pose: Pose; titulo: string; texto: string };

export const PASOS_TOUR: readonly PasoTour[] = Object.freeze([
	{
		id: 'tour_01',
		ancla: 'capsula',
		pose: 'senalando',
		titulo: 'Un toque, un café',
		texto: 'Toca la cápsula que vas a tomar. El café queda a tu nombre al momento.',
	},
	{
		id: 'tour_02',
		ancla: 'invitado',
		pose: 'saludando',
		titulo: 'Si invitas a alguien',
		texto: 'Este botón registra un café para una persona invitada. Lo pagas tú.',
	},
	{
		id: 'tour_03',
		ancla: 'deshacer',
		pose: 'pensando',
		titulo: '¿Te has equivocado?',
		texto: 'Después de cada toque aparece «Deshacer» durante 5 segundos. Púlsalo y el café desaparece.',
	},
	{
		id: 'tour_04',
		ancla: 'navegacion',
		pose: 'caminando',
		titulo: 'El resto de beCafé',
		texto: 'Desde aquí vas a Saldos, Compras, Estadísticas y tu Perfil.',
	},
]);
