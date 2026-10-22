# Button

Botón de acción. Variantes: primary (una por pantalla), soft, ghost, danger, glass. Con `href` se renderiza como enlace.

- Importar: `import { Button } from '#lib';`
- Archivo: `src/lib/components/ui/Button.svelte`
- Demo viva: ruta `/componentes#Button`

## Cuándo usarlo

Una sola acción primaria por pantalla. `loading` desactiva y anuncia `aria-busy`. Tamaño mínimo 44 px.

## Props

```ts
type Props = Common & (({ href: string } & Omit<HTMLAnchorAttributes, 'class'>) | ({ href?: undefined } & Omit<HTMLButtonAttributes, 'class'>));
```

## Accesibilidad

Objetivo ≥44 px, foco visible, texto ≥4,5:1.
