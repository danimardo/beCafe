# UndoToast

Aviso temporal con «Deshacer» (RF-013), 5 s.

- Importar: `import { UndoToast } from '#lib';`
- Archivo: `src/lib/components/ui/UndoToast.svelte`
- Demo viva: ruta `/componentes#UndoToast`

## Cuándo usarlo

Se muestra con `toasts.showUndo(...)`; no lo montes a mano.

## Props

```ts
type Props = { toast: UndoToastData; onclose: () => void };
```

## Accesibilidad

Se pausa al pasar/enfocar (WCAG 2.2.1).
