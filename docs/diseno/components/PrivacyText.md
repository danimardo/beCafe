# PrivacyText

Texto de privacidad (Anexo A, **propuesto**) reutilizable en `/privacidad` y en la pantalla bloqueante.

- Importar: `import { PrivacyText } from '#lib';`
- Archivo: `src/lib/components/legal/PrivacyText.svelte`
- Demo viva: ruta `/componentes#PrivacyText`

## Cuándo usarlo

Es el único sitio donde vive el texto: no lo copies a otras pantallas.

## Props

```ts
type Props = {
	/** Versión del texto vigente (RF-160 registra la versión leída). */
	version?: number;
	class?: string;
};
```

## Accesibilidad

Encabezados jerárquicos; texto ≥16 px.
