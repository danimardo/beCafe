# Stepper

Indicador de pasos (baja de usuario con liquidación).

- Importar: `import { Stepper } from '#lib';`
- Archivo: `src/lib/components/ui/Stepper.svelte`
- Demo viva: ruta `/componentes#Stepper`

## Cuándo usarlo

`current` desde 0.

## Props

```ts
type Props = { steps: string[]; /** Índice del paso actual, desde 0. */ current: number; class?: string };
```

## Accesibilidad

`aria-current="step"`.
