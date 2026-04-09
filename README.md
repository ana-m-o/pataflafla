# Pataflafla

PWA local-first con SvelteKit, Svelte 5, Dexie.js y Bits UI, sin Tailwind CSS.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Svelte 5 + SvelteKit |
| Base de datos | Dexie.js (IndexedDB) |
| Componentes UI | Bits UI (headless) |
| Iconos | lucide-svelte |
| i18n | svelte-i18n (es / en) |
| PWA | @vite-pwa/sveltekit |
| Estilos | CSS3 plano |
| Tests | Vitest + happy-dom |
| Servidor | adapter-node |

## Comandos

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo en localhost:5173
npm run check        # chequeo de tipos (svelte-check)
npm run check:watch  # chequeo continuo
npm run build        # build de producción → build/
npm run preview      # previsualiza el build localmente
npm test             # smoke tests (una sola pasada)
npm run test:watch   # tests en modo watch
npm run generate:assets  # regenera todos los iconos PWA desde static/logo.svg
```

## Tests

Framework: **Vitest** con `happy-dom`.

```bash
npm test             # pasa una vez y muestra resultado
npm run test:watch   # queda en modo vigilancia
```

Los tests viven en `src/tests/`. El smoke test actual cubre:
- Las claves de traducción de los locales `es` y `en` son coherentes entre sí.
- El módulo `db` exporta una instancia Dexie válida.

Para añadir tests de componentes usar `@testing-library/svelte`:

```ts
import { render, screen } from '@testing-library/svelte';
import MiComponente from '$lib/components/MiComponente.svelte';

it('renderiza el título', () => {
  render(MiComponente);
  expect(screen.getByRole('heading')).toBeInTheDocument();
});
```

## Iconos PWA

Los iconos se generan automáticamente a partir de `static/logo.svg`:

```bash
npm run generate:assets
```

Genera en `static/`: `favicon.ico`, `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`.

## Producción

```bash
npm run build   # genera build/
node build      # arranca en http://localhost:3000
```

## Instalar la PWA en móvil

1. Ejecuta `node build` en el PC.
2. Abre `http://<IP_DEL_PC>:3000` desde el teléfono (misma red Wi-Fi).
3. **Android/Chrome**: menú → *Instalar app*.
4. **iOS/Safari**: compartir → *Agregar a pantalla de inicio*.

> El service worker solo se registra en producción (`node build`). En dev no está activo.  
> Para instalación real fuera de red local, se requiere **HTTPS**.

## Estructura

```
src/
├── lib/
│   ├── components/   # componentes reutilizables
│   ├── db/           # capa IndexedDB con Dexie
│   ├── features/     # módulos por funcionalidad
│   ├── i18n/         # configuración svelte-i18n + locales es/en
│   ├── stores/       # stores globales
│   └── types/        # tipos TypeScript compartidos
├── routes/           # rutas SvelteKit
└── tests/            # tests Vitest
static/               # assets públicos (iconos PWA, manifest, logo)
```
