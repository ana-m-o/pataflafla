import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.svg', 'icons/pataflafla.svg'],
			kit: {
				includeVersionFile: true
			},
			manifest: {
				name: 'Pataflafla',
				short_name: 'Pataflafla',
				description: 'PWA local-first con SvelteKit, Dexie y Bits UI.',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				background_color: '#f8fafc',
				theme_color: '#111827',
				lang: 'es',
				icons: [
					{
						src: 'icons/pataflafla.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'any'
					},
					{
						src: 'icons/pataflafla.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'maskable'
					}
				]
			},
			devOptions: {
				enabled: true
			}
		})
	]
});
