import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		globals: true,
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: [...configDefaults.exclude],
		setupFiles: ['src/tests/setup.ts']
	},
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'logo.svg', 'apple-touch-icon-180x180.png'],
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
						src: 'pwa-64x64.png',
						sizes: '64x64',
						type: 'image/png'
					},
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: 'maskable-icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			devOptions: {
				enabled: false
			}
		})
	]
});
