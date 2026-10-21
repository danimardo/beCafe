// DATOS DE MUESTRA para las pantallas de ejemplo. No es la capa de datos real:
// en la aplicación estos valores vienen del servidor (SQLite) según historias.md.
// Importes en céntimos (RN-020).

export const me = { id: 'u0', name: 'Ana Martín', email: 'ana.martin@empresa.example', role: 'administrador' as 'miembro' | 'administrador' };

export interface Member {
	id: string;
	name: string;
	role: 'miembro' | 'administrador';
	active: boolean;
	balanceCents: number;
	note: string;
}
export const members: Member[] = [
	{ id: 'u1', name: 'Marta Ruiz', role: 'administrador', active: true, balanceCents: 410, note: 'Compró el 18 oct' },
	{ id: 'u2', name: 'Jorge Gil', role: 'miembro', active: true, balanceCents: 185, note: 'Aportó 10 € ayer' },
	{ id: 'u0', name: 'Ana Martín', role: 'administrador', active: true, balanceCents: -245, note: '12 cafés este mes' },
	{ id: 'u3', name: 'Sara Pons', role: 'miembro', active: true, balanceCents: -305, note: '9 cafés este mes' },
	{ id: 'u4', name: 'Pablo León', role: 'miembro', active: true, balanceCents: -410, note: '14 cafés este mes' },
	{ id: 'u5', name: 'Luis Torres', role: 'miembro', active: true, balanceCents: -620, note: 'Por debajo del límite (−5 €)' },
	{ id: 'u6', name: 'Elena Ríos', role: 'miembro', active: false, balanceCents: 0, note: 'Baja el 2 oct' }
];

export const huchaCents = 2340;
export const debtLimitCents = -500;

export interface CapsuleType {
	id: string;
	name: string;
	brand: string;
	intensity: number | null;
	stock: number;
	threshold: number;
	avgCostCents: number;
	color: string;
	photoUrl: string | null;
	daysLeft: number | null;
	active: boolean;
	hasRecords: boolean;
}
export const capsules: CapsuleType[] = [
	{ id: 'c1', name: 'Ristretto', brand: 'Nespresso', intensity: 10, stock: 42, threshold: 10, avgCostCents: 35, color: '#3b2a6b', photoUrl: null, daysLeft: 21, active: true, hasRecords: true },
	{ id: 'c2', name: 'Lungo Forte', brand: 'Nespresso', intensity: 8, stock: 6, threshold: 10, avgCostCents: 38, color: '#c0392b', photoUrl: null, daysLeft: 3, active: true, hasRecords: true },
	{ id: 'c3', name: 'Descafeinado', brand: 'Nespresso', intensity: 5, stock: 18, threshold: 8, avgCostCents: 35, color: '#c9a227', photoUrl: null, daysLeft: 36, active: true, hasRecords: true },
	{ id: 'c4', name: 'Colombia', brand: 'Nespresso', intensity: 6, stock: 31, threshold: 10, avgCostCents: 38, color: '#2e8b57', photoUrl: null, daysLeft: 15, active: true, hasRecords: true },
	{ id: 'c5', name: 'Vainilla', brand: 'Nespresso', intensity: 6, stock: 9, threshold: 10, avgCostCents: 40, color: '#e8d3a9', photoUrl: null, daysLeft: 6, active: true, hasRecords: true },
	{ id: 'c6', name: 'Intenso', brand: 'Nespresso', intensity: 12, stock: 54, threshold: 10, avgCostCents: 36, color: '#1c1c1e', photoUrl: null, daysLeft: 18, active: true, hasRecords: true },
	{ id: 'c8', name: 'Volluto', brand: 'Nespresso', intensity: 4, stock: 0, threshold: 10, avgCostCents: 40, color: '#2f6fb0', photoUrl: null, daysLeft: null, active: true, hasRecords: true },
	{ id: 'c7', name: 'Caramelo', brand: 'Nespresso', intensity: null, stock: 0, threshold: 10, avgCostCents: 0, color: '#c2547a', photoUrl: null, daysLeft: null, active: false, hasRecords: false }
];

export interface Movement {
	id: string;
	kind: 'consumo' | 'aportacion' | 'compra' | 'arqueo' | 'recuento' | 'reparto' | 'regularizacion' | 'baja';
	title: string;
	subtitle: string;
	cents?: number;
	voided?: boolean;
	pending?: boolean;
}
export const movements: Movement[] = [
	{ id: 'm1', kind: 'consumo', title: 'Ristretto', subtitle: 'Hoy, 9:12', cents: -35, pending: true },
	{ id: 'm2', kind: 'consumo', title: 'Colombia', subtitle: 'Ayer, 16:40', cents: -38 },
	{ id: 'm3', kind: 'aportacion', title: 'Aportación', subtitle: 'Ayer, 12:05', cents: 1000 },
	{ id: 'm4', kind: 'consumo', title: 'Lungo Forte', subtitle: '18 oct, 10:31 · para un invitado', cents: -38 },
	{ id: 'm5', kind: 'consumo', title: 'Vainilla', subtitle: '18 oct, 10:02', cents: -40, voided: true },
	{ id: 'm6', kind: 'compra', title: 'Compra de 70 cápsulas', subtitle: '18 oct · Marta Ruiz', cents: -2400 },
	{ id: 'm7', kind: 'regularizacion', title: 'Regularización por compra anulada', subtitle: '15 oct', cents: -320 },
	{ id: 'm8', kind: 'arqueo', title: 'Arqueo de la hucha', subtitle: '13 oct · diferencia 0,00 €' }
];

export const weekly = [
	{ label: 'S38', value: 6 },
	{ label: 'S39', value: 13 },
	{ label: 'S40', value: 10 },
	{ label: 'S41', value: 11 },
	{ label: 'S42', value: 8 },
	{ label: 'S43', value: 12 }
];
export const teamWeekly = [
	{ label: 'S38', value: 48 },
	{ label: 'S39', value: 61 },
	{ label: 'S40', value: 55 },
	{ label: 'S41', value: 58 },
	{ label: 'S42', value: 52 },
	{ label: 'S43', value: 64 }
];
export const favourites = [
	{ label: 'Ristretto', value: 5, color: '#3b2a6b' },
	{ label: 'Colombia', value: 3, color: '#2e8b57' },
	{ label: 'Vainilla', value: 2, color: '#e8d3a9' },
	{ label: 'Descafeinado', value: 2, color: '#c9a227' }
];

export const backups = [
	{ id: 'b1', at: 'Hoy, 03:00', size: '4,2 MB', ok: true },
	{ id: 'b2', at: 'Ayer, 03:00', size: '4,2 MB', ok: true },
	{ id: 'b3', at: '18 oct, 03:00', size: '4,1 MB', ok: false, error: 'No se pudo conectar con el bucket S3 (tiempo agotado).' },
	{ id: 'b4', at: '17 oct, 03:00', size: '4,1 MB', ok: true }
];
export const daysSinceRestoreTest = 104; // RF-144: aviso si > 100

export const configChanges = [
	{ id: 'k1', what: 'Plazo de autoanulación: 10 → 15 minutos', who: 'Marta Ruiz', when: '2 oct' },
	{ id: 'k2', what: 'Límite de deuda: −3,00 € → −5,00 €', who: 'Ana Martín', when: '28 sep' }
];

// Avisos del panel de notificaciones (RF-107). `minutesAgo` se convierte en instante al cargar.
export const notificationSeed = [
	{ id: 'n1', kind: 'stock-negativo', title: 'Volluto está por debajo de 0', detail: 'Stock registrado: −1. Revisa con un recuento.', when: 'Hoy, 9:14', minutesAgo: 40, href: '/admin/control' },
	{ id: 'n2', kind: 'stock-bajo', title: 'Lungo Forte: quedan 6', detail: 'El umbral es 10. Con el consumo actual, unos 3 días.', when: 'Hoy, 8:50', minutesAgo: 65, href: '/' },
	{ id: 'n3', kind: 'deuda', title: 'Tu saldo está por debajo del límite', detail: 'Debes 6,20 €. El límite es −5,00 €.', when: 'Ayer', minutesAgo: 60 * 20, href: '/historial?quien=mios' },
	{ id: 'n4', kind: 'hucha-negativa', title: 'La hucha quedaría en negativo', detail: 'Una compra deja el saldo teórico en −0,60 €.', when: '18 oct', minutesAgo: 60 * 24 * 3, href: '/compras' },
	{ id: 'n5', kind: 'copia-fallida', title: 'Falló la copia de seguridad', detail: 'No se pudo conectar con el bucket S3 (18 oct, 03:00).', when: '18 oct', minutesAgo: 60 * 24 * 3 + 30, href: '/admin/copias' },
	{ id: 'n6', kind: 'resumen-mensual', title: 'Tu resumen de septiembre', detail: '41 cafés · saldo actual −2,45 € · Aguador del mes: Ana y Jorge.', when: '1 oct', minutesAgo: 60 * 24 * 20, href: '/estadisticas' }
] as const;

// ───────── Movimientos (RF-111, RF-112) ─────────
import type { MovementDetail } from './movements';

export const graceMinutes = 15; // RN-032 (configurable)
export const viewer = { id: 'u0', role: me.role };

/** Movimientos de MI saldo (RF-112): cargos, abonos, repartos y regularizaciones, con su origen. */
export const myMovements: MovementDetail[] = [
	{ id: 'a1', kind: 'consumo', title: 'Ristretto', at: 'Hoy, 9:12', ageMinutes: 3, authorId: 'u0', authorName: 'Ana Martín', cents: -35, pending: true, origin: 'Guardado en este móvil. Se enviará cuando haya conexión.' },
	{ id: 'a2', kind: 'consumo', title: 'Colombia', at: 'Hoy, 9:05', ageMinutes: 10, authorId: 'u0', authorName: 'Ana Martín', cents: -38, origin: 'Coste medio de Colombia en ese momento: 0,38 €.' },
	{ id: 'a3', kind: 'consumo', title: 'Colombia', at: 'Ayer, 16:40', ageMinutes: 1010, authorId: 'u0', authorName: 'Ana Martín', cents: -38 },
	{ id: 'a4', kind: 'aportacion', title: 'Aportación', at: '12 oct, 12:05', ageMinutes: 12000, authorId: 'u0', authorName: 'Ana Martín', cents: 500, origin: 'Dinero que metiste en la hucha.' },
	{ id: 'a5', kind: 'consumo', title: 'Lungo Forte · invitado', at: '18 oct, 10:31', ageMinutes: 4000, authorId: 'u0', authorName: 'Ana Martín', cents: -38, guest: true, origin: 'Café para un invitado: se te cobra a ti y no cuenta en tus estadísticas.' },
	{ id: 'a6', kind: 'consumo', title: 'Vainilla', at: '18 oct, 10:02', ageMinutes: 4030, authorId: 'u0', authorName: 'Ana Martín', cents: -40, voided: { by: 'Ana Martín', at: '18 oct, 10:02', reason: 'Deshecho por el autor' } },
	{ id: 'a10', kind: 'relleno', title: 'He rellenado el agua', at: 'Hoy, 8:20', ageMinutes: 55, authorId: 'u0', authorName: 'Ana Martín', origin: 'No mueve dinero: solo cuenta para el ranking de rellenos y el aguador del mes.' },
	{ id: 'a11', kind: 'relleno', title: 'He rellenado el agua', at: '19 oct, 15:02', ageMinutes: 2300, authorId: 'u0', authorName: 'Ana Martín', origin: 'No mueve dinero: solo cuenta para el ranking de rellenos y el aguador del mes.' },
	{ id: 'a7', kind: 'regularizacion', title: 'Regularización', at: '15 oct', ageMinutes: 9000, authorId: 'u1', authorName: 'Marta Ruiz', cents: 320, derivedFrom: 'compra anulada del 15 oct', origin: 'Se anuló una compra de 50 cápsulas que había subido el coste medio. Tus 3 cafés posteriores se cobraron a un precio mayor; esto te devuelve la diferencia.' },
	{ id: 'a8', kind: 'reparto', title: 'Reparto del arqueo', at: '13 oct', ageMinutes: 10000, authorId: 'u1', authorName: 'Marta Ruiz', cents: -35, derivedFrom: 'arqueo del 13 oct', origin: 'Faltaban 2,10 € en la hucha. Se repartió entre 6 personas: −0,35 € cada una.' },
	{ id: 'a9', kind: 'reparto', title: 'Reparto del recuento · Ristretto', at: '10 oct', ageMinutes: 14000, authorId: 'u1', authorName: 'Marta Ruiz', cents: -12, derivedFrom: 'recuento de Ristretto del 10 oct', origin: 'Faltaban 2 cápsulas (0,70 €), repartidas entre 6 personas. Los céntimos sobrantes se asignan al azar (RN-014).' }
];

/** Historial general (RF-111): aportaciones, compras, arqueos, recuentos y repartos de todo el equipo. */
export const generalHistory: MovementDetail[] = [
	{ id: 'g0', kind: 'relleno', title: 'Relleno de agua · Jorge Gil', at: 'Hoy, 6:10', ageMinutes: 190, authorId: 'u2', authorName: 'Jorge Gil', origin: 'No mueve dinero: solo cuenta para el ranking de rellenos y el aguador del mes.' },
	{ id: 'g0b', kind: 'relleno', title: 'Relleno de agua · Ana Martín', at: 'Hoy, 8:20', ageMinutes: 55, authorId: 'u0', authorName: 'Ana Martín', origin: 'No mueve dinero: solo cuenta para el ranking de rellenos y el aguador del mes.' },
	{ id: 'g1', kind: 'aportacion', title: 'Aportación de Jorge Gil', at: 'Ayer, 12:05', ageMinutes: 1500, authorId: 'u2', authorName: 'Jorge Gil', cents: 1000 },
	{ id: 'g2', kind: 'compra', title: 'Compra de 70 cápsulas', at: '18 oct', ageMinutes: 4100, authorId: 'u1', authorName: 'Marta Ruiz', cents: -2400, origin: '50 Ristretto (17,00 €) y 20 Descafeinado (7,00 €). Con ticket.' },
	{ id: 'g3', kind: 'arqueo', title: 'Arqueo de la hucha', at: '13 oct', ageMinutes: 10000, authorId: 'u1', authorName: 'Marta Ruiz', isLast: true, origin: 'Contado 23,40 €, saldo teórico 23,40 €: cuadraba. Sin diferencia que repartir.' },
	{ id: 'g4', kind: 'aportacion', title: 'Aportación de Ana Martín', at: '12 oct', ageMinutes: 12000, authorId: 'u0', authorName: 'Ana Martín', cents: 500 },
	{ id: 'g5', kind: 'recuento', title: 'Recuento · Ristretto', at: '10 oct', ageMinutes: 14000, authorId: 'u1', authorName: 'Marta Ruiz', cents: -70, isLast: true, origin: 'Se contaron 40 y había 42 registradas: faltaban 2 (0,70 €).' },
	{ id: 'g6', kind: 'reparto', title: 'Reparto del recuento · Ristretto', at: '10 oct', ageMinutes: 14000, authorId: 'u1', authorName: 'Marta Ruiz', cents: -70, subtitle: '10 oct · −0,12 € por persona (6 personas)', derivedFrom: 'recuento de Ristretto del 10 oct' },
	{ id: 'g7', kind: 'regularizacion', title: 'Regularizaciones por compra anulada', at: '15 oct', ageMinutes: 9000, authorId: 'u1', authorName: 'Marta Ruiz', cents: 960, subtitle: '15 oct · 3 personas, +3,20 € cada una', derivedFrom: 'compra anulada del 15 oct' },
	{ id: 'g8', kind: 'compra', title: 'Compra de 100 cápsulas', at: '15 sep', ageMinutes: 60000, authorId: 'u1', authorName: 'Marta Ruiz', cents: -3600, voided: { by: 'Marta Ruiz', at: '15 oct, 11:20', reason: 'Importe mal introducido: eran 36 €, no 360 €.' } }
];

// ───────── Compras (RF-040 a RF-046) ─────────
export const purchases: MovementDetail[] = [
	{ id: 'p1', kind: 'compra', title: 'Compra de 50 cápsulas · 200,00 €', at: '19 oct', ageMinutes: 2000, authorId: 'u2', authorName: 'Jorge Gil', cents: -20000, origin: '50 Ristretto por 200,00 €. Con ticket. El importe parece un error (4,00 € por cápsula).' },
	{ id: 'p2', kind: 'compra', title: 'Compra de 70 cápsulas', at: '18 oct', ageMinutes: 4100, authorId: 'u1', authorName: 'Marta Ruiz', cents: -2400, origin: '50 Ristretto (17,00 €) y 20 Descafeinado (7,00 €). Con ticket.' },
	{ id: 'p3', kind: 'compra', title: 'Compra de 50 cápsulas', at: '2 oct', ageMinutes: 26000, authorId: 'u2', authorName: 'Jorge Gil', cents: -1700 },
	{ id: 'p4', kind: 'compra', title: 'Compra de 100 cápsulas', at: '15 sep', ageMinutes: 60000, authorId: 'u1', authorName: 'Marta Ruiz', cents: -3600, voided: { by: 'Marta Ruiz', at: '15 oct, 11:20', reason: 'Importe mal introducido: eran 36 €, no 360 €.' } }
];
/** Resultado de anular la compra p1 (CA-045): coste medio reconstruido y regularizaciones por persona. */
export const regularizationDemo = {
	purchaseTitle: 'Compra de 50 cápsulas · 200,00 € · Jorge Gil, 19 oct',
	capsuleName: 'Ristretto',
	avgBefore: 36000,
	avgAfter: 4000,
	items: [
		{ name: 'Ana Martín', consumptions: 1, cents: 320 },
		{ name: 'Luis Torres', consumptions: 1, cents: 320 },
		{ name: 'Marta Ruiz', consumptions: 1, cents: 320 }
	]
};

// Estadísticas globales (RF-120): por mes y por tipo, con los invitados siempre aparte.
export const teamMonthly = [
	{ label: 'may', value: 212 },
	{ label: 'jun', value: 230 },
	{ label: 'jul', value: 148 },
	{ label: 'sep', value: 241 },
	{ label: 'oct', value: 238 }
];
export const guestMonthly = [
	{ label: 'may', value: 14 },
	{ label: 'jun', value: 9 },
	{ label: 'jul', value: 6 },
	{ label: 'sep', value: 18 },
	{ label: 'oct', value: 11 }
];
export const teamByType = [
	{ label: 'Ristretto', value: 78, color: '#3b2a6b' },
	{ label: 'Colombia', value: 61, color: '#2e8b57' },
	{ label: 'Vainilla', value: 52, color: '#e8d3a9' },
	{ label: 'Descafeinado', value: 47, color: '#c9a227' }
];
export const guestByType = [
	{ label: 'Ristretto', value: 5, color: '#3b2a6b' },
	{ label: 'Colombia', value: 4, color: '#2e8b57' },
	{ label: 'Vainilla', value: 2, color: '#e8d3a9' }
];

// ───────── Historial paginado (/historial): más registros antiguos para que haya varias páginas ─────────
const older: MovementDetail[] = Array.from({ length: 14 }, (_, i) => {
	const who = members[(i % 5) + 1];
	const t = i % 3;
	const day = 9 - Math.floor(i / 2);
	return t === 0
		? { id: `h${i}`, kind: 'aportacion' as const, title: `Aportación de ${who.name}`, at: `${Math.max(day, 1)} oct`, ageMinutes: 17000 + i * 900, authorId: who.id, authorName: who.name, cents: 500 + (i % 4) * 250 }
		: t === 1
			? { id: `h${i}`, kind: 'relleno' as const, title: `Relleno de agua · ${who.name}`, at: `${Math.max(day, 1)} oct, 9:${10 + i}`, ageMinutes: 17000 + i * 900, authorId: who.id, authorName: who.name, origin: 'No mueve dinero: solo cuenta para el ranking de rellenos y el aguador del mes.' }
			: { id: `h${i}`, kind: 'compra' as const, title: `Compra de ${30 + i} cápsulas`, at: `${Math.max(day, 1)} oct`, ageMinutes: 17000 + i * 900, authorId: who.id, authorName: who.name, cents: -(1100 + i * 90) };
});
export const historyAll: MovementDetail[] = [...generalHistory, ...older];
export const historyMine: MovementDetail[] = [...myMovements, ...Array.from({ length: 6 }, (_, i) => ({ id: `m${i}`, kind: 'consumo' as const, title: ['Ristretto', 'Colombia', 'Vainilla'][i % 3], at: `${8 - i} oct, 9:${30 + i}`, ageMinutes: 20000 + i * 600, authorId: 'u0', authorName: 'Ana Martín', cents: -(35 + (i % 3) * 3) }))];

// ───────── Relleno de agua (RF-170 a RF-176) ─────────
export const refillIntervalMinutes = 60; // RN-082, configurable (60 por defecto)
/** Último relleno vigente de cualquier persona (RF-170). */
export const lastRefill = { name: 'Jorge', minutesAgo: 190 };
/** Aguador del mes anterior (RF-176): puede ser compartido por empate. Se muestra durante todo el mes en curso. */
export const aguador = { month: 'septiembre', names: ['Ana', 'Jorge'], count: 6, meIncluded: true };
/** Ranking de rellenos vigentes por periodo (RF-175). `baja` marca a quien ya no está activo (RN-085). */
export const refillRanking: Record<'semana' | 'mes' | 'anio', { name: string; count: number; baja?: boolean }[]> = {
	semana: [
		{ name: 'Ana Martín', count: 3 },
		{ name: 'Jorge Gil', count: 2 },
		{ name: 'Marta Ruiz', count: 1 }
	],
	mes: [
		{ name: 'Ana Martín', count: 7 },
		{ name: 'Jorge Gil', count: 7 },
		{ name: 'Marta Ruiz', count: 4 },
		{ name: 'Luis Torres', count: 2 },
		{ name: 'Elena Ríos', count: 1, baja: true }
	],
	anio: [
		{ name: 'Jorge Gil', count: 61 },
		{ name: 'Ana Martín', count: 58 },
		{ name: 'Marta Ruiz', count: 37 },
		{ name: 'Luis Torres', count: 19 },
		{ name: 'Sara Pons', count: 11 },
		{ name: 'Elena Ríos', count: 6, baja: true }
	]
};
export const myRefills = { semana: 3, mes: 7, anio: 58 };
