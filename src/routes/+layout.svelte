<script lang="ts">
	import { onMount } from 'svelte';
	import { setupI18n } from '$lib/i18n';

	let { children } = $props();

	onMount(async () => {
		setupI18n();
		if (import.meta.env.PROD) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ immediate: true });
		}
	});
</script>

{@render children()}
