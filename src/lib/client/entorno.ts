import { PUBLIC_VAPID_KEY } from '$app/env/public';

// Lector único de `$app/env/public` en el cliente (ARCHITECTURE.md §8). La única variable pública es la clave VAPID
// (`PUBLIC_VAPID_KEY`), que el navegador necesita para suscribirse. Si no está declarada, el push no se ofrece.
export const entornoCliente = Object.freeze({ clavePublicaVapid: PUBLIC_VAPID_KEY });
