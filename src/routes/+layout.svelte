<script lang="ts">
	import { onMount } from 'svelte';
	import { setupI18n } from '$lib/i18n';
	import { themeStore } from '$lib/stores/theme.svelte';
	import '../styles/global.css';

	let { children } = $props();

	onMount(async () => {
		await Promise.all([setupI18n(), themeStore.init()]);
		if (import.meta.env.PROD) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ immediate: true });
		}
	});
</script>

{@render children()}
