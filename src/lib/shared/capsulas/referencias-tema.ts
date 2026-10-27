// Colores de cada tema que el cálculo del color propio necesita para medir el contraste (F15, RF-270, research R2).
// Son copias de `tokens/tokens.json`, la fuente de `src/tokens.css`; `referencias-tema.test.ts` comprueba que coinciden.
// Es el único módulo de `lib/shared` que escribe colores hexadecimales a mano.

export type ReferenciasTema = {
	/** `wall-base`: fondo de la aplicación. */
	fondo: string;
	/** `wall-raised`: superficie estable sobre la que se pinta la tarjeta de la cápsula. */
	tarjeta: string;
	/** `ink`: texto principal. */
	tinta: string;
	/** `on-accent`: texto sobre el color de acento. */
	sobreAcento: string;
};

export const REFERENCIAS_TEMA: { readonly claro: ReferenciasTema; readonly oscuro: ReferenciasTema } = Object.freeze({
	claro: { fondo: '#f5ece1', tarjeta: '#fcf8f3', tinta: '#2b1d14', sobreAcento: '#ffffff' },
	oscuro: { fondo: '#1c1714', tarjeta: '#2a221d', tinta: '#f5ede4', sobreAcento: '#2b1a10' },
});
