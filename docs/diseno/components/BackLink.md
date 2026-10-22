# BackLink

Enlace «‹ Volver» a la pantalla padre, para pantallas de detalle (p. ej. Mi saldo).

- Importar: `import { BackLink } from '#lib';`
- Archivo: `src/lib/components/layout/BackLink.svelte`
- Demo viva: ruta `/componentes#BackLink`

## Cuándo usarlo

Úsalo en vez de `history.back()`: lleva siempre a una ruta conocida. Va encima de `PageHeader`.

## Props

```ts
type Props = { href: string; label: string };
```

## Accesibilidad

Enlace real con nombre accesible; objetivo ≥44 px.
