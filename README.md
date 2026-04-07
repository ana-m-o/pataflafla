# Pataflafla

Estructura inicial de una PWA con SvelteKit, Svelte, Dexie.js y Bits UI, sin Tailwind CSS.

## Stack base

- Svelte 5
- SvelteKit
- Dexie.js para IndexedDB
- Bits UI como librería headless
- Lucide Icons (`lucide-svelte`)
- i18n listo para español e inglés (`svelte-i18n`)
- PWA con `@vite-pwa/sveltekit`
- CSS3

## Comandos

- `npm install`
- `npm run dev`
- `npm run check`
- `npm run build`

## Estructura

- `src/lib/components`: componentes reutilizables
- `src/lib/db`: capa de IndexedDB con Dexie
- `src/lib/i18n`: configuración y diccionarios (`es`, `en`)
- `src/lib/features`: módulos por funcionalidad
- `src/lib/stores`: stores globales
- `src/routes`: rutas de SvelteKit
