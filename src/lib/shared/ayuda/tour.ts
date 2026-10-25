// Tour guiado de Inicio (RF-204, plan F10 D8). Cada paso se ancla a un elemento con `data-tour="<ancla>"`.
// Un paso sin ancla en la pantalla se muestra centrado: el texto siempre explica el paso completo.

export const ANCLAS_TOUR = ['capsula', 'invitado', 'deshacer', 'navegacion'] as const;
export type AnclaTour = (typeof ANCLAS_TOUR)[number];

export type PasoTour = { ancla: AnclaTour; titulo: string; texto: string };

export const PASOS_TOUR: readonly PasoTour[] = Object.freeze([
	{ ancla: 'capsula', titulo: 'Un toque, un café', texto: 'Toca la cápsula que vas a tomar. El café queda a tu nombre al momento.' },
	{ ancla: 'invitado', titulo: 'Si invitas a alguien', texto: 'Este botón registra un café para una persona invitada. Lo pagas tú.' },
	{
		ancla: 'deshacer',
		titulo: '¿Te has equivocado?',
		texto: 'Después de cada toque aparece «Deshacer» durante 5 segundos. Púlsalo y el café desaparece.',
	},
	{ ancla: 'navegacion', titulo: 'El resto de beCafé', texto: 'Desde aquí vas a Saldos, Compras, Estadísticas y tu Perfil.' },
]);
